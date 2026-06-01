export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  console.log("generate called, key exists:", !!process.env.ANTHROPIC_API_KEY);

  const { niche, storeName, tagline } = req.body;
  if (!niche) return res.status(400).json({ error: "Missing niche" });

  const name = storeName || niche + " Store";

  const prompt = `You are a Shopify theme developer. Create a production-ready Shopify theme for a ${niche} store called "${name}"${tagline ? ` with tagline "${tagline}"` : ""}.

Return a JSON object with this exact structure. IMPORTANT: all file contents must use \\n for newlines (escaped), not real newlines. The entire response must be valid JSON that can be parsed with JSON.parse().

{
  "files": {
    "layout/theme.liquid": "...",
    "templates/index.liquid": "...",
    "templates/product.liquid": "...",
    "templates/collection.liquid": "...",
    "templates/cart.liquid": "...",
    "sections/header.liquid": "...",
    "sections/hero.liquid": "...",
    "assets/theme.css": "...",
    "config/settings_schema.json": "...",
    "locales/en.default.json": "..."
  },
  "meta": {
    "themeName": "...",
    "tagline": "...",
    "colorAccent": "#hexcode"
  }
}

Make it genuinely good — real Liquid syntax, proper Shopify objects (product.title, product.price | money, cart.item_count), niche-appropriate colors and copy for ${niche}, mobile-responsive CSS. Each file should be complete and functional. Remember: escape all newlines as \\n inside string values.`;

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
    const aiText = data.content?.[0]?.text || "";

    // Strip markdown fences if present
    const clean = aiText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    // Fix unescaped newlines inside JSON strings
    // Replace real newlines that appear inside string values with \n
    let fixed = "";
    let inString = false;
    let escaped = false;
    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      if (escaped) {
        fixed += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        fixed += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        fixed += ch;
        continue;
      }
      if (inString && ch === "\n") {
        fixed += "\\n";
        continue;
      }
      if (inString && ch === "\r") {
        continue; // strip carriage returns
      }
      if (inString && ch === "\t") {
        fixed += "\\t";
        continue;
      }
      fixed += ch;
    }

    let parsed;
    try {
      parsed = JSON.parse(fixed);
    } catch (e) {
      console.error("JSON parse error:", e.message);
      console.error("Raw AI text (first 500):", clean.substring(0, 500));
      return res.status(500).json({ error: "AI returned invalid JSON: " + e.message });
    }

    return res.status(200).json({
      success: true,
      files: parsed.files || {},
      meta: parsed.meta || {},
    });

  } catch (err) {
    console.error("Caught error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
