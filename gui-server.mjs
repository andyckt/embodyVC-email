import 'dotenv/config';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sendGuiEmail } from './lib/email-send.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, 'public', 'index.html');

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM;
const port = Number(process.env.PORT) || 3847;

if (!apiKey) {
  console.error('Missing RESEND_API_KEY in .env');
  process.exit(1);
}
if (!from) {
  console.error('Missing RESEND_FROM in .env');
  process.exit(1);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    try {
      const html = fs.readFileSync(indexPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Missing public/index.html');
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/send') {
    try {
      const body = await readBody(req);
      const outcome = await sendGuiEmail(body);
      if (!outcome.ok) {
        sendJson(res, outcome.status, { error: outcome.error });
        return;
      }
      sendJson(res, 200, { result: outcome.result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Send failed';
      sendJson(res, 500, { error: message });
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(port, () => {
  console.log(`Email GUI: http://localhost:${port}`);
});
