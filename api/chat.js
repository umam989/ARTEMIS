// Vercel Serverless Function: Artemis AI -> TokenPortal
const MODEL = 'deepseek-v4.1-flash';
const ENDPOINT = 'https://tokenportal.id/v1/chat/completions';

// Best-effort per-instance rate limit. For a high-traffic public app,
// use shared storage (for example Redis) and add bot protection.
const buckets = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const item = buckets.get(ip) || { count: 0, reset: now + 60_000 };
  if (now > item.reset) { item.count = 0; item.reset = now + 60_000; }
  item.count += 1;
  buckets.set(ip, item);
  return item.count > 15;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }
  const key = process.env.TOKENPORTAL_API_KEY;
  if (!key) return res.status(500).json({ error: { message: 'TOKENPORTAL_API_KEY belum diatur di Vercel.' } });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) return res.status(429).json({ error: { message: 'Terlalu banyak request. Coba lagi sebentar.' } });

  try {
    const body = req.body;
    if (!body || !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 30) {
      return res.status(400).json({ error: { message: 'Format messages tidak valid.' } });
    }
    const payload = {
      model: MODEL,
      messages: body.messages,
      stream: true,
      max_tokens: Math.min(Number(body.max_tokens) || 4096, 8192)
    };
    if (body.thinking) payload.thinking = body.thinking;
    if (body.reasoning_effort) payload.reasoning_effort = body.reasoning_effort;
    if (typeof body.temperature === 'number') payload.temperature = body.temperature;

    const upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(payload)
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return res.status(upstream.status).json({ error: { message: detail.slice(0, 1500) || 'TokenPortal request gagal.' } });
    }
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    const reader = upstream.body.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!res.write(Buffer.from(value))) await new Promise(resolve => res.once('drain', resolve));
    }
    return res.end();
  } catch (error) {
    if (!res.headersSent) return res.status(500).json({ error: { message: 'Backend Artemis AI gagal memproses request.' } });
    return res.end();
  }
};
