import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "Missing session ID" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "Payment not completed" });
    }

    return res.status(200).json({
      token: sessionId, // used as auth token for /api/generate
      customerEmail: session.customer_details?.email || "",
      metadata: session.metadata || {},
    });
  } catch (err) {
    console.error("Verify error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
