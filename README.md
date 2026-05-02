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

## Send a test email (CLI)

```bash
npm run send:test
```

## Important

Never commit API keys. `.env` is ignored by git.
