import { Resend } from 'resend';

export function parseRecipients(value) {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @param {Record<string, unknown>} body - Parsed JSON from the GUI
 * @returns {Promise<{ ok: true, result: unknown } | { ok: false, status: number, error: string }>}
 */
export async function sendGuiEmail(body) {
  const requiredSecret = process.env.GUI_SEND_SECRET;
  if (requiredSecret) {
    const provided = typeof body.secret === 'string' ? body.secret : '';
    if (provided !== requiredSecret) {
      return { ok: false, status: 401, error: 'Invalid or missing send password.' };
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey) {
    return { ok: false, status: 500, error: 'Server misconfigured: missing RESEND_API_KEY.' };
  }
  if (!from) {
    return { ok: false, status: 500, error: 'Server misconfigured: missing RESEND_FROM.' };
  }

  const to = parseRecipients(body.to);
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const html = typeof body.html === 'string' ? body.html : '';
  const text =
    typeof body.text === 'string' && body.text.trim() !== '' ? body.text : undefined;

  if (to.length === 0) {
    return { ok: false, status: 400, error: 'Add at least one recipient email.' };
  }
  if (!subject) {
    return { ok: false, status: 400, error: 'Subject is required.' };
  }
  if (!html.trim() && !text) {
    return { ok: false, status: 400, error: 'Add HTML body and/or plain text body.' };
  }

  const payload = {
    from,
    to,
    subject,
  };
  if (html.trim()) payload.html = html;
  if (text) payload.text = text;

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send(payload);
    return { ok: true, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed';
    return { ok: false, status: 500, error: message };
  }
}
