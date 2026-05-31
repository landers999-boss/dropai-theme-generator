// api/verify-session.js
// Verifies a Stripe checkout session was paid and returns a short-lived token

import Stripe from "stripe";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Simple HMAC token: base64(sessionId + expiry) signed with ANTHROPIC_API_KEY
// No DB needed — the signature proves we issued it, expiry prevents replay
function issueToken(sessionId) {
  const expiry = Date.now() + 1000 * 60 * 60; // 1 hour
  const payload = Buffer.from(JSON.stringify({ sessionId, expiry })).toString("base64url");
  const sig = crypto
    .createHmac("sha256", process.env.ANTHROPIC_API_KEY)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto
    .createHmac("sha256", process.env.ANTHROPIC_API_KEY)
    .update(payload)
    .digest("base64url");
  if (sig !== expected) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (Date.now() > data.expiry) return null;
  return data;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "Payment not completed" });
    }

    const token = issueToken(session.id);

    return res.status(200).json({
      token,
      metadata: session.metadata,
      customerEmail: session.customer_details?.email,
    });
  } catch (err) {
    console.error("Verify error:", err);
    return res.status(500).json({ error: err.message });
  }
}
