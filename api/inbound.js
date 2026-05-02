import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function readRawBody(req, limitBytes = 2_000_000) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > limitBytes) throw new Error('Payload too large');
    chunks.push(buf);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function getHeader(req, name) {
  const v = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: 'Server misconfigured: missing RESEND_WEBHOOK_SECRET.' });
  }

  let payload;
  try {
    payload = await readRawBody(req);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bad request';
    return res.status(400).json({ error: msg });
  }

  const id = getHeader(req, 'svix-id');
  const timestamp = getHeader(req, 'svix-timestamp');
  const signature = getHeader(req, 'svix-signature');
  if (!id || !timestamp || !signature) {
    return res.status(400).json({ error: 'Missing webhook signature headers.' });
  }

  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch {
    return res.status(400).json({ error: 'Invalid webhook' });
  }

  if (event?.type !== 'email.received') {
    // Acknowledge other events.
    return res.status(200).json({ ok: true });
  }

  const forwardTo = process.env.FORWARD_TO;
  const forwardFrom = process.env.FORWARD_FROM || process.env.RESEND_FROM;
  if (!forwardTo) {
    return res.status(500).json({ error: 'Server misconfigured: missing FORWARD_TO.' });
  }
  if (!forwardFrom) {
    return res.status(500).json({ error: 'Server misconfigured: missing FORWARD_FROM/RESEND_FROM.' });
  }

  const onlyTo = process.env.FORWARD_ONLY_TO; // optional: e.g. "andy@embodyvc.com"
  if (onlyTo) {
    const tos = Array.isArray(event.data?.to) ? event.data.to : [];
    const normalized = tos.map((t) => String(t).toLowerCase());
    if (!normalized.includes(String(onlyTo).toLowerCase())) {
      return res.status(200).json({ ok: true, skipped: true });
    }
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    return res.status(400).json({ error: 'Missing email_id in event.' });
  }

  const { data: email, error: emailError } = await resend.emails.receiving.get(emailId);
  if (emailError) {
    return res.status(500).json({ error: `Failed to fetch email: ${emailError.message}` });
  }

  // Attachments (optional)
  let attachments;
  try {
    const { data: attachmentsData, error: attachmentsError } =
      await resend.emails.receiving.attachments.list({ emailId });

    if (attachmentsError) {
      return res.status(500).json({ error: `Failed to fetch attachments: ${attachmentsError.message}` });
    }

    const list = attachmentsData?.data;
    if (Array.isArray(list) && list.length > 0) {
      attachments = await Promise.all(
        list.map(async (a) => {
          const r = await fetch(a.download_url);
          const buf = Buffer.from(await r.arrayBuffer());
          return {
            filename: a.filename,
            content: buf.toString('base64'),
            contentType: a.content_type,
            contentDisposition: a.content_disposition ?? undefined,
            cid: a.content_id ?? undefined,
          };
        }),
      );
    }
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Attachment processing failed' });
  }

  const subjectPrefix = process.env.FORWARD_SUBJECT_PREFIX || '[FWD] ';
  const forwardedSubject = `${subjectPrefix}${email.subject || '(no subject)'}`;

  const { data: sent, error: sendError } = await resend.emails.send({
    from: forwardFrom,
    to: [forwardTo],
    subject: forwardedSubject,
    html: email.html || undefined,
    text: email.text || undefined,
    attachments,
  });

  if (sendError) {
    return res.status(500).json({ error: `Failed to forward email: ${sendError.message}` });
  }

  return res.status(200).json({ ok: true, forwarded: true, id: sent?.id ?? null });
}

