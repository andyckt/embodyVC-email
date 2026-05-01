import 'dotenv/config';
import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) throw new Error('Missing RESEND_API_KEY (set it in .env)');

const id = process.argv[2];
if (!id) throw new Error('Usage: node ./get-email.mjs <email_id>');

const resend = new Resend(apiKey);
const result = await resend.emails.get(id);
console.log(JSON.stringify(result, null, 2));

