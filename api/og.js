module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { url } = req.body;
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'No URL' });

  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; archivo-bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    const html = await response.text();

    const getMeta = (prop) => {
      const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"'<>]+)["']`, 'i');
      const re2 = new RegExp(`<meta[^>]+content=["']([^"'<>]+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i');
      return (html.match(re1) || html.match(re2))?.[1]?.trim() || null;
    };

    const decodeEntities = (str) =>
      str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();

    const rawTitle =
      getMeta('og:title') ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
      '';
    const title = decodeEntities(rawTitle);

    let image = getMeta('og:image') || getMeta('og:image:url');
    if (image && !image.startsWith('http')) {
      try {
        const base = new URL(fullUrl);
        image = image.startsWith('//')
          ? `${base.protocol}${image}`
          : image.startsWith('/')
          ? `${base.origin}${image}`
          : `${base.origin}/${image}`;
      } catch {
        image = null;
      }
    }

    const rawDesc = getMeta('og:description') || getMeta('description') || '';
    const description = decodeEntities(rawDesc);

    return res.status(200).json({
      title,
      image: image || null,
      description: description || null,
    });
  } catch (e) {
    if (e.name === 'AbortError') return res.status(504).json({ error: 'Timeout' });
    return res.status(500).json({ error: 'Failed to fetch' });
  }
};
