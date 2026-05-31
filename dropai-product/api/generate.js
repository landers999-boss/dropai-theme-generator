// api/generate.js
// Verifies token, calls Anthropic, returns theme JSON
// The Anthropic key never touches the browser

import { verifyToken } from "./verify-session.js";

const SYSTEM_PROMPT = `You are a Shopify Liquid theme developer. Generate complete, production-ready Shopify theme files.
Always return ONLY a valid JSON object with no markdown, no backticks, no preamble. The JSON must be parseable by JSON.parse().
The JSON structure must be exactly:
{
  "files": {
    "layout/theme.liquid": "...",
    "templates/index.liquid": "...",
    "templates/product.liquid": "...",
    "templates/collection.liquid": "...",
    "templates/cart.liquid": "...",
    "templates/page.liquid": "...",
    "sections/header.liquid": "...",
    "sections/hero.liquid": "...",
    "sections/featured-collection.liquid": "...",
    "sections/footer.liquid": "...",
    "assets/theme.css": "...",
    "assets/theme.js": "...",
    "config/settings_schema.json": "...",
    "config/settings_data.json": "...",
    "locales/en.default.json": "..."
  },
  "meta": {
    "themeName": "...",
    "colorAccent": "#hexcolor",
    "tagline": "short 1-line description of the theme"
  }
}
Rules:
- All Liquid files must use valid Shopify Liquid syntax with {% schema %} blocks in sections
- The CSS must be complete and include all styles needed for the theme
- The theme.liquid layout must include {{ content_for_header }}, {{ content_for_layout }}
- Make the design unique and tailored to the specific niche
- Include Google Fonts via link tag in theme.liquid
- All values in the JSON must be strings (escape newlines as \\n, quotes as \\")
- Do not use actual newlines inside JSON string values`;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Verify token
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  const tokenData = verifyToken(token);
  if (!tokenData) return res.status(401).json({ error: "Invalid or expired token. Please purchase again." });

  const { niche, storeName, tagline } = req.body;
  if (!niche) return res.status(400).json({ error: "Missing niche" });

  const userPrompt = `Generate a complete Shopify theme for a ${niche} dropshipping store.

Store name: ${storeName || niche + " Store"}
Tagline: ${tagline || "Quality products delivered fast"}
Niche: ${niche}

Design requirements:
- Create a unique, conversion-optimized design specific to the ${niche} niche
- Use a color palette and typography that fits ${niche} products
- Include urgency/scarcity elements appropriate for dropshipping
- The hero section should have a bold headline targeting ${niche} customers
- Featured collection section showing 4 products in a grid
- Trust badges and social proof elements
- Mobile-responsive design
- Fast-loading, minimal JavaScript

Make the theme feel authentic and premium for the ${niche} market. Choose fonts and colors that would appeal to ${niche} buyers.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
  const errText = await response.text();
  throw new Error("Anthropic said: " + errText);
}

}

    const data = await response.json();
    const rawText = data.content.map((b) => b.text || "").join("");

    // Extract JSON
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Claude response");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.files) throw new Error("No files in response");

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Generate error:", err);
    return res.status(500).json({ error: err.message });
  }
}
