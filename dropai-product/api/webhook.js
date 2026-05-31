// api/webhook.js
// Stripe webhook endpoint — handles payment events
// Use this to: send confirmation emails, log purchases, revoke access, etc.
//
// To wire it up:
//   stripe listen --forward-to localhost:5173/api/webhook   (local dev)
//   Add https://your-app.vercel.app/api/webhook in Stripe Dashboard → Webhooks

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const email = session.customer_details?.email;
      const niche = session.metadata?.niche;
      const storeName = session.metadata?.storeName;

      console.log(`✅ New purchase — ${email} — niche: ${niche} — store: ${storeName}`);

      // TODO: Send a confirmation email here using Resend / Postmark / SendGrid:
      //
      // await sendEmail({
      //   to: email,
      //   subject: "Your DropAI theme is ready",
      //   html: `<p>Thanks for purchasing! Return to the app to generate your theme.</p>
      //          <p><a href="${process.env.VITE_APP_URL}/generate?session_id=${session.id}">Click here to build your theme</a></p>`
      // });

      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      console.warn(`⚠️ Payment failed — ${pi.last_payment_error?.message}`);
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      console.log(`↩️ Refund issued — ${charge.amount_refunded / 100} ${charge.currency.toUpperCase()}`);
      // TODO: invalidate the session token if you want to revoke access on refund
      break;
    }

    default:
      // Ignore unhandled event types
      break;
  }

  return res.status(200).json({ received: true });
}
