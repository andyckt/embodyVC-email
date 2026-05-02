import { sendGuiEmail } from '../lib/email-send.mjs';

function parseJsonBody(raw) {
  if (!raw || raw === '') return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function getJsonBody(req) {
  if (req.body != null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (Buffer.isBuffer(req.body)) {
    return parseJsonBody(req.body.toString('utf8'));
  }
  if (typeof req.body === 'string') {
    const parsed = parseJsonBody(req.body);
    return parsed === null ? null : parsed;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 2_000_000) {
      throw new Error('Payload too large');
    }
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  const parsed = parseJsonBody(raw);
  return parsed;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = await getJsonBody(req);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bad request';
    return res.status(400).json({ error: msg });
  }
  if (body === null) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const outcome = await sendGuiEmail(body);
  if (!outcome.ok) {
    return res.status(outcome.status).json({ error: outcome.error });
  }
  return res.status(200).json({ result: outcome.result });
}
