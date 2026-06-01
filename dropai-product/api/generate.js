export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { niche, storeName, tagline } = req.body;
  if (!niche) return res.status(400).json({ error: "Missing niche" });

  const name = storeName || niche + " Store";
  const accent = getAccentColor(niche);

  const filesToGenerate = [
    {
      key: "layout/theme.liquid",
      prompt: `Write layout/theme.liquid for a Shopify store called "${name}" (${niche}). Include <!DOCTYPE html>, <head> with {{ content_for_header }}, a sticky nav with logo and cart icon, and <main>{{ content_for_layout }}</main> and a footer. Use inline CSS for nav/footer styling. Niche color accent: ${accent}. Return ONLY the file content, no explanation.`
    },
    {
      key: "templates/index.liquid",
      prompt: `Write templates/index.liquid for a Shopify ${niche} store called "${name}"${tagline ? ` (tagline: ${tagline})` : ""}. Include a hero section with headline and CTA button, a featured products section using {% section 'featured-collection' %}, and a brief value props section. Return ONLY the file content.`
    },
    {
      key: "templates/product.liquid",
      prompt: `Write templates/product.liquid for a Shopify ${niche} store. Include product image, title, price (use {{ product.price | money }}), description, variant selector, and add-to-cart form. Use proper Shopify Liquid syntax. Return ONLY the file content.`
    },
    {
      key: "templates/cart.liquid",
      prompt: `Write templates/cart.liquid for a Shopify ${niche} store. Show cart items with title, quantity, price. Include a checkout button and subtotal. Use {{ cart.items }}, {{ cart.total_price | money }}. Return ONLY the file content.`
    },
    {
      key: "assets/theme.css",
      prompt: `Write a complete theme.css for a ${niche} Shopify store called "${name}". Include: CSS reset, variables with accent color ${accent}, typography, responsive nav, hero section, product grid, product page, cart page, buttons, footer. Mobile-first responsive. Return ONLY the CSS.`
    },
    {
      key: "config/settings_schema.json",
      prompt: `Write config/settings_schema.json for a Shopify theme. Include sections for "Colors" (accent color, background), "Typography" (font choices), and "Social media" (instagram, facebook url). Return ONLY valid JSON array.`
    },
  ];

  async function callClaude(prompt) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error("Anthropic error: " + err);
    }
    const data = await response.json();
    return data.content?.[0]?.text || "";
  }

  try {
    const files = {};
    for (const file of filesToGenerate) {
      const content = await callClaude(file.prompt);
      // Strip any markdown fences
      files[file.key] = content.replace(/^```[\w]*\n?/i, "").replace(/\n?```$/i, "").trim();
    }

    return res.status(200).json({
      success: true,
      files,
      meta: {
        themeName: name + " Theme",
        tagline: tagline || getTagline(niche),
        colorAccent: accent,
      },
    });
  } catch (err) {
    console.error("Caught error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

function getAccentColor(niche) {
  const map = {
    "Pet Supplies": "#F97316",
    "Fitness & Gym": "#EF4444",
    "Beauty & Skincare": "#EC4899",
    "Home Decor": "#8B5CF6",
    "Tech & Gadgets": "#3B82F6",
    "Fashion & Apparel": "#F59E0B",
    "Food & Gourmet": "#10B981",
    "Kids & Baby": "#FBBF24",
    "Sports & Outdoors": "#06B6D4",
    "Jewelry & Accessories": "#D97706",
    "Health & Wellness": "#22C55E",
  };
  return map[niche] || "#00C896";
}

function getTagline(niche) {
  const map = {
    "Pet Supplies": "Everything your pet deserves",
    "Fitness & Gym": "Train harder. Live better.",
    "Beauty & Skincare": "Glow from within",
    "Home Decor": "Make every room a statement",
    "Tech & Gadgets": "The future, delivered",
    "Fashion & Apparel": "Style that speaks",
    "Food & Gourmet": "Taste the difference",
    "Kids & Baby": "Safe, fun, and loved",
    "Sports & Outdoors": "Adventure awaits",
    "Jewelry & Accessories": "Wear your story",
    "Health & Wellness": "Feel your best every day",
  };
  return map[niche] || "Quality you can trust";
}
