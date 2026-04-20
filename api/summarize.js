module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { links, mode } = req.body;
  if (!links || links.length === 0) return res.status(400).json({ error: 'No links provided' });

  const isFolder = mode === 'folder';

  const linkText = links
    .map((l, i) => {
      let line = `${i + 1}. ${l.title}`;
      if (l.memo) line += ` — ${l.memo}`;
      if (l.insight) line += `\n   인사이트: ${l.insight}`;
      if (l.idea) line += `\n   아이디어: ${l.idea}`;
      return line;
    })
    .join('\n');

  const systemPrompt = isFolder
    ? '당신은 사용자의 영감 아카이브를 분석하는 어시스턴트입니다. 링크 목록과 사용자의 인사이트를 바탕으로 이 폴더의 핵심 주제와 생각의 흐름을 3줄로 요약해주세요. 각 줄은 "•"로 시작하고, 한국어로 작성하세요.'
    : '당신은 사용자의 링크를 분석하는 어시스턴트입니다. 이 링크의 핵심 내용을 3줄로 요약해주세요. 각 줄은 "•"로 시작하고, 한국어로 간결하게 작성하세요.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: linkText }],
      }),
    });

    if (!response.ok) throw new Error('Claude API error');

    const data = await response.json();
    const summary = data.content?.[0]?.text || '요약을 생성할 수 없어요.';
    return res.status(200).json({ summary });
  } catch {
    const fallback = links
      .slice(0, 5)
      .map((l) => `• ${l.title}`)
      .join('\n');
    return res.status(200).json({ summary: fallback });
  }
};
