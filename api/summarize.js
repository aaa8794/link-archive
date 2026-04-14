module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { links } = req.body;
  if (!links || links.length === 0) return res.status(400).json({ error: 'No links provided' });

  const text = links
    .map((l, i) => `${i + 1}. ${l.title}${l.memo ? ` — ${l.memo}` : ''}${l.retrospective ? ` (회고: ${l.retrospective})` : ''}`)
    .join('\n');

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        parameters: { max_length: 200, min_length: 50 },
      }),
    });

    if (!response.ok) throw new Error('HuggingFace API error');

    const data = await response.json();
    const summary = data[0]?.summary_text || '요약을 생성할 수 없어요.';
    return res.status(200).json({ summary });
  } catch {
    // 무료 API 실패 시 간단한 폴백 요약
    const fallback = links
      .slice(0, 5)
      .map((l) => `• ${l.title}`)
      .join('\n');
    return res.status(200).json({ summary: fallback });
  }
};
