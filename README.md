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
- `RESEND_TO` (your Gmail for testing)

## Send a test email

```bash
npm run send:test
```

## Important

Never commit API keys. `.env` is ignored by git.
