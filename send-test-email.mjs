import 'dotenv/config';
import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM;
const to = process.env.RESEND_TO;

if (!apiKey) throw new Error('Missing RESEND_API_KEY (set it in .env)');
if (!from) throw new Error('Missing RESEND_FROM (set it in .env)');
if (!to) throw new Error('Missing RESEND_TO (set it in .env)');

const resend = new Resend(apiKey);

const result = await resend.emails.send({
  from,
  to: [to],
  subject: 'Resend test from embodyvc.com',
  html: `<p>It works. Sent at ${new Date().toISOString()}</p>`,
});

console.log(JSON.stringify(result, null, 2));
