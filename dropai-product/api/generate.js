export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  console.log("generate called, key exists:", !!process.env.ANTHROPIC_API_KEY);

  const { niche, storeName, tagline } = req.body;
  if (!niche) return res.status(400).json({ error: "Missing niche" });

  const name = storeName || niche + " Store";

  const prompt = `Create a minimal Shopify theme for a ${niche} store called "${name}"${tagline ? ` with tagline "${tagline}"` : ""}.

Return ONLY a JSON object, no markdown fences, no explanation. Keep each file concise but functional. Each file value must be a single line string with \\n for newlines:

{
  "files": {
    "layout/theme.liquid": "single line string",
    "templates/index.liquid": "single line string",
    "templates/product.liquid": "single line string",
    "assets/theme.css": "single line string",
    "config/settings_schema.json": "[]"
  },
  "meta": {
    "themeName": "name here",
    "tagline": "tagline here",
    "colorAccent": "#hexcode"
  }
}

Make it niche-appropriate for ${niche}. Keep each file under 200 words.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
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
