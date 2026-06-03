export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { niche, storeName, tagline } = req.body;
  if (!niche) return res.status(400).json({ error: "Missing niche" });

  const name = storeName || niche + " Store";
  const accent = getAccentColor(niche);
  const taglineText = tagline || getTagline(niche);

  const filesToGenerate = [
    {
      key: "layout/theme.liquid",
      prompt: `Write layout/theme.liquid for a Shopify store called "${name}" (${niche} niche).
Include:
- <!DOCTYPE html><html><head> with {{ content_for_header }}, meta charset, viewport, and a <style> block with full CSS (reset, nav, footer, buttons, product grid, hero, responsive)
- Use accent color ${accent}
- A sticky <nav> with the store name "${name}" on the left and a cart icon showing {{ cart.item_count }} on the right, linking to /cart
- <main>{{ content_for_layout }}</main>
- A <footer> with store name and copyright
Return ONLY the file content, no explanation.`
    },
    {
      key: "templates/index.liquid",
      prompt: `Write templates/index.liquid for a Shopify ${niche} store called "${name}" (tagline: "${taglineText}").
Do NOT use any {% section %} tags. Write all HTML inline.
Include:
- A hero div with a big headline, the tagline, and a "Shop Now" <a href="/collections/all"> button
- A "Featured Products" heading followed by {{ collections.all.products | limit: 4 }} in a product grid, each showing product image, title, and price
- A 3-column "Why Us" section with relevant ${niche} selling points
Use only standard HTML and Liquid. No {% section %} tags. Return ONLY the file content.`
    },
    {
      key: "templates/product.liquid",
      prompt: `Write templates/product.liquid for a Shopify ${niche} store.
Include:
- Product image: {{ product.featured_image | img_url: '600x600' }}
- Product title: {{ product.title }}
- Price: {{ product.price | money }}
- Description: {{ product.description }}
- Add to cart form with {% form 'product', product %} and a submit button
- Variant selector if product has multiple variants
Use only standard Shopify Liquid. Return ONLY the file content.`
    },
    {
      key: "templates/collection.liquid",
      prompt: `Write templates/collection.liquid for a Shopify ${niche} store.
Include:
- Collection title: {{ collection.title }}
- Product grid using {% for product in collection.products %}
- Each product card: image, title, price, link to product page
Use standard Shopify Liquid. Return ONLY the file content.`
    },
    {
      key: "templates/cart.liquid",
      prompt: `Write templates/cart.liquid for a Shopify ${niche} store.
Include:
- {% form 'cart' %} wrapping the cart
- {% for item in cart.items %}: show item image, title, quantity input, line price
- Subtotal: {{ cart.total_price | money }}
- Checkout button
- "Continue Shopping" link to /collections/all
Return ONLY the file content.`
    },
    {
      key: "config/settings_schema.json",
      prompt: `Write a valid Shopify config/settings_schema.json.
Include two sections: one for "Colors" with a color picker for accent color (default "${accent}"), one for "Typography" with a font-family select.
Return ONLY a valid JSON array. No extra text.`
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
      files[file.key] = content.replace(/^```[\w]*\n?/i, "").replace(/\n?```$/i, "").trim();
    }

    return res.status(200).json({
      success: true,
      files,
      meta: {
        themeName: name + " Theme",
        tagline: taglineText,
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
