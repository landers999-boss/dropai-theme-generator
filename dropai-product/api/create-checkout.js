// api/create-checkout.js
// Creates a Stripe Checkout session and returns the URL

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { niche, storeName } = req.body;
    const appUrl = process.env.VITE_APP_URL || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: process.env.VITE_STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      // Pass niche + store name through so we have them post-payment
      metadata: {
        niche: niche || "",
        storeName: storeName || "",
      },
      success_url: `${appUrl}/generate?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?cancelled=true`,
      // Collect customer email for receipts
      customer_creation: "always",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: err.message });
  }
}
