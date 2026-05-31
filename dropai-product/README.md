# DropAI Theme Generator

AI-powered Shopify theme generator. Users pay once via Stripe, then generate unlimited custom themes tailored to their niche.

---

## Architecture

```
Browser (React + Vite)
  │
  ├── / (Landing page)         → Stripe Checkout
  │
  └── /generate?session_id=... → Verifies purchase → Generates theme → Downloads ZIP
          │
          ▼
  Vercel Serverless Functions
  │
  ├── POST /api/create-checkout   Creates Stripe checkout session
  ├── POST /api/verify-session    Verifies payment, issues signed token (1hr)
  ├── POST /api/generate          Calls Anthropic API (key never touches browser)
  └── POST /api/webhook           Stripe events (receipts, refunds, logging)
```

**Security model:** The Anthropic API key lives only in Vercel env vars. The browser never sees it. Users get a short-lived HMAC-signed token after payment that authorizes exactly one generation window.

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/you/dropai-theme-generator
cd dropai-theme-generator
npm install
```

### 2. Create environment file

```bash
cp .env.example .env.local
```

Fill in all values (see below for where to get each one).

### 3. Set up Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create a product: **Products → Add product**
   - Name: `DropAI Lifetime Access`
   - Price: $47 one-time
3. Copy the **Price ID** (starts with `price_`) → `VITE_STRIPE_PRICE_ID`
4. Copy your **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY`
5. Copy your **Secret key** → `STRIPE_SECRET_KEY`

For the webhook secret (needed in production):
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-app.vercel.app/api/webhook`
3. Events to listen for: `checkout.session.completed`, `charge.refunded`
4. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 4. Get an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create key
3. Copy it → `ANTHROPIC_API_KEY`

> **Cost estimate:** Each theme generation uses ~6,000–8,000 output tokens on claude-sonnet.
> At current pricing that's roughly $0.024–$0.032 per generation. At $47/sale your margin is ~99%.

### 5. Run locally

```bash
npm run dev
```

To test the full Stripe flow locally, install the Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:5173/api/webhook
```

This gives you a local webhook secret — use it as `STRIPE_WEBHOOK_SECRET` in `.env.local` during development.

For local API testing without going through Stripe, you can temporarily hardcode a test token in `Generator.jsx` (remove before deploying).

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, say **yes** to detecting Vite. Then add environment variables:

```bash
vercel env add ANTHROPIC_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
vercel env add VITE_STRIPE_PRICE_ID
vercel env add VITE_APP_URL    # e.g. https://dropai.vercel.app
```

Or add them in the Vercel dashboard under **Project → Settings → Environment Variables**.

Redeploy after adding env vars:
```bash
vercel --prod
```

Update `VITE_APP_URL` to your production URL, and update the Stripe webhook endpoint URL.

---

## Environment Variables Reference

| Variable | Where to get it | Used by |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com | `/api/generate` |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API keys | `/api/create-checkout`, `/api/verify-session` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | `/api/webhook` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API keys | Frontend (not used yet, available for Stripe.js) |
| `VITE_STRIPE_PRICE_ID` | Stripe Dashboard → Products | `/api/create-checkout` |
| `VITE_APP_URL` | Your deployed domain | Stripe redirect URLs |

---

## Customizing

**Change the price:** Update the Stripe product price and edit the `$47` display strings in `Landing.jsx`.

**Add niches:** Edit the `NICHES` array in both `Landing.jsx` and `Generator.jsx`.

**Change the AI prompt:** Edit `SYSTEM_PROMPT` and the `userPrompt` in `api/generate.js`.

**Add email receipts:** Uncomment the email block in `api/webhook.js` and add your email provider (Resend is easiest — `npm install resend`).

**Custom domain:** Add it in Vercel Dashboard → Project → Domains.

---

## File Structure

```
├── api/
│   ├── create-checkout.js   Stripe checkout session
│   ├── verify-session.js    Payment verification + token issuance
│   ├── generate.js          Anthropic API call (server-side)
│   └── webhook.js           Stripe event handling
├── src/
│   ├── main.jsx             React entry point
│   ├── App.jsx              Router (landing vs generator)
│   ├── Landing.jsx          Sales page
│   └── Generator.jsx        Post-purchase theme builder UI
├── index.html
├── vite.config.js
├── vercel.json              API routing + CORS headers
├── package.json
└── .env.example
```

---

## Selling on Gumroad / Lemon Squeezy instead

If you don't want to manage Stripe yourself, you can skip the checkout API and sell the app URL directly on Gumroad:

1. Deploy the app (without Stripe) to Vercel
2. Protect `/generate` with a simple password (add a `?key=yourpassword` check)
3. Sell on Gumroad — deliver the password + URL as the product
4. When someone buys, they get the password and can generate themes

This is simpler but less scalable. The Stripe approach above is better for volume.

---

## Support

Email: support@dropai.app
