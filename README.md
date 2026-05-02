# embodyvc-email

## Setup

1) Install dependencies

```bash
npm install
```

2) Create `.env`

```bash
cp .env.example .env
```

Fill in:
- `RESEND_API_KEY`
- `RESEND_FROM` (use `Andy <andy@embodyvc.com>`)
- `RESEND_TO` (optional — only used by `npm run send:test`)

## Send from a simple GUI

Recipient, subject, and body are entered in the browser (not from `.env`).

```bash
npm run gui
```

Open [http://localhost:3847](http://localhost:3847) (or set `PORT` in `.env` to use another port).

## Host on Vercel

The GUI is a static page in `public/` plus a serverless function at `api/send.js`.

1. Push this repo to GitHub (or GitLab / Bitbucket) and [import the project in Vercel](https://vercel.com/new), or run `npx vercel` from the project root.
2. In the Vercel project **Settings → Environment Variables**, add:
   - `RESEND_API_KEY`
   - `RESEND_FROM` (same verified sender as locally)
   - **`GUI_SEND_SECRET`** — a long random string. The hosted form will require that password so random visitors cannot send mail through your API. Omit only for private / trusted deployments.
3. Deploy. Open your production URL; `/` shows the form and `POST /api/send` sends via Resend.

Local parity with production: `npx vercel dev` (installs the CLI if needed).

## Send a test email (CLI)

```bash
npm run send:test
```

## Important

Never commit API keys. `.env` is ignored by git.
