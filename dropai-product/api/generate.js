export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  console.log("generate called, key exists:", !!process.env.ANTHROPIC_API_KEY);

  const { niche, storeName, tagline } = req.body;
  if (!niche) return res.status(400).json({ error: "Missing niche" });

  const prompt = `Generate a Shopify theme for a ${niche} store called "${storeName || niche + " Store"}".
${tagline ? `Tagline: ${tagline}` : ""}

Return ONLY a valid JSON object with exactly this structure, no markdown, no extra text:
{
  "files": {
    "layout/theme.liquid": "full liquid content here",
    "templates/index.liquid": "full liquid content here",
    "templates/product.liquid": "full liquid content here",
    "assets/theme.css": "full css content here",
    "config/settings_schema.json": "full json content here"
  },
  "meta": {
    "themeName": "store theme name",
    "tagline": "short tagline",
    "colorAccent": "#hexcode"
  }
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 8000,
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
