export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  console.log("generate called, key exists:", !!process.env.ANTHROPIC_API_KEY);

  const { niche, storeName, tagline } = req.body;
  if (!niche) return res.status(400).json({ error: "Missing niche" });

  const name = storeName || niche + " Store";

  const prompt = `You are a Shopify theme developer. Create a high-quality, production-ready Shopify theme for a ${niche} store called "${name}"${tagline ? ` with tagline "${tagline}"` : ""}.

CRITICAL: Return ONLY a raw JSON object. No markdown, no backticks, no explanation before or after. The response must start with { and end with }.

All file content must be on a single line — use \\n for line breaks, \\" for quotes inside strings. Do not use actual newlines inside JSON string values.

{
  "files": {
    "layout/theme.liquid": "full HTML layout with {{ content_for_header }}, {{ content_for_layout }}, nav, footer",
    "templates/index.liquid": "homepage with hero, featured products, value props",
    "templates/product.liquid": "product page with image, title, price, add to cart",
    "templates/collection.liquid": "collection grid with product cards",
    "templates/cart.liquid": "cart page with line items and checkout button",
    "sections/header.liquid": "sticky nav with logo, menu, cart icon + {% schema %}",
    "sections/hero.liquid": "hero banner with headline, subtext, CTA button + {% schema %}",
    "assets/theme.css": "complete CSS: reset, typography, layout, components, responsive",
    "config/settings_schema.json": "theme editor settings array with typography and color sections",
    "locales/en.default.json": "strings object with general, products, cart keys"
  },
  "meta": {
    "themeName": "${name} Theme",
    "tagline": "compelling tagline for ${niche}",
    "colorAccent": "#hexcode matching ${niche} aesthetic"
  }
}

Make it genuinely good — real Liquid syntax, proper Shopify objects (product.title, product.price | money, cart.item_count), niche-appropriate colors and copy, mobile-responsive CSS. Each file should be complete and functional.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 16000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", errText);
      return res.status(500).json({ error: "Anthropic error: " + errText });
    }

    const data = await response.json();
    console.log("Anthropic response received");
    return res.status(200).json({ success: true, content: data.content });
  } catch (err) {
    console.error("Caught error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
