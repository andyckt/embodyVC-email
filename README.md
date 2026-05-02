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

## Receive emails (Inbound) and forward them

This repo also includes a webhook endpoint for Resend Inbound:

- `POST /api/inbound` (see `api/inbound.js`)

### 1) Set up receiving in Resend

- **Recommended**: enable receiving on a **subdomain** (e.g. `inbound.embodyvc.com`) so you don’t break your existing Gmail / Google Workspace MX records.
- In Resend dashboard, enable **Receiving** for that domain/subdomain and copy the required **MX** record.
- Add that MX record in your DNS provider and wait for verification.

### 2) Create the webhook

In Resend → **Webhooks**:

- Add webhook URL: `https://<your-vercel-domain>/api/inbound`
- Event: `email.received`
- Copy the webhook **signing secret** and set it as `RESEND_WEBHOOK_SECRET` in Vercel env vars.

### 3) Configure forwarding destination

In Vercel env vars add:

- `FORWARD_TO="kamtocheung1104@gmail.com"`
- `RESEND_WEBHOOK_SECRET="whsec_..."` (from webhook details)

Optional:

- `FORWARD_FROM` (defaults to `RESEND_FROM`)
- `FORWARD_ONLY_TO="andy@embodyvc.com"` (only forward when the inbound “to” matches)
- `FORWARD_SUBJECT_PREFIX` (defaults to `[FWD] `)

### 4) How do emails to `andy@embodyvc.com` reach Resend?

You have two common options:

- **A (recommended)**: Keep Gmail/Workspace as-is for `embodyvc.com`, create a subdomain like `inbound.embodyvc.com` for Resend receiving, then create a Gmail/Workspace forwarding rule from `andy@embodyvc.com` → `anything@inbound.embodyvc.com`.
- **B**: Move MX for `embodyvc.com` to Resend (not recommended unless you intend Resend to receive *all* mail for the domain).

## Send a test email (CLI)

```bash
npm run send:test
```

## Important

Never commit API keys. `.env` is ignored by git.
