import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { niche, storeName } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "DropAI Shopify Theme Generator",
              description: "AI-generated custom Shopify theme for your dropshipping store",
            },
            unit_amount: 4700, // $47.00
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: { niche: niche || "", storeName: storeName || "" },
      success_url: `${req.headers.origin}/generate?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
