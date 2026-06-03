export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { niche, storeName, tagline } = req.body;
  if (!niche) return res.status(400).json({ error: "Missing niche" });

  const name = storeName || niche + " Store";
  const accent = getAccentColor(niche);
  const taglineText = tagline || getTagline(niche);
  const { emoji, hero, features } = getNicheContent(niche);

  const filesToGenerate = [
    {
      key: "layout/theme.liquid",
      prompt: `You are an expert Shopify theme developer. Write layout/theme.liquid for a premium ${niche} Shopify store called "${name}".

This file is the MASTER LAYOUT. It wraps every page. Do NOT include a hero or product content here.

Requirements:
- Start with <!DOCTYPE html><html lang="en"><head>
- Include {{ content_for_header }} in <head>
- Include a <style> block with COMPLETE CSS for the entire theme:
  * CSS custom properties: --accent: ${accent}; --accent-dark: (darkened version); --text: #1a1a1a; --muted: #6b7280; --bg: #ffffff; --bg-alt: #f9fafb; --border: #e5e7eb;
  * Full reset, body, typography (use a clean font stack)
  * Sticky nav with .nav-logo and .nav-actions (cart link)
  * .hero, .hero-title, .hero-sub, .hero-cta styles
  * .section, .container (max-width 1200px, centered)
  * .product-grid (CSS grid, auto-fill, minmax 240px)
  * .product-card with hover lift effect
  * .product-img (aspect-ratio 1, object-fit cover)
  * .product-title, .product-price (use --accent color)
  * .btn (accent background, white text, border-radius 6px, padding 12px 28px)
  * .features-grid (3 columns), .feature-card
  * footer styles
  * Full mobile responsive @media (max-width: 768px)
- <body> with:
  * <nav> showing "${name}" logo linking to / and cart icon with {{ cart.item_count }} linking to /cart
  * <main id="main">{{ content_for_layout }}</main>
  * <footer> with store name, tagline "${taglineText}", and copyright

Return ONLY the complete file content. No explanation.`
    },
    {
      key: "templates/index.liquid",
      prompt: `You are writing templates/index.liquid for a Shopify ${niche} store called "${name}" (tagline: "${taglineText}").

CRITICAL RULES:
- Do NOT include <!DOCTYPE html>, <html>, <head>, <body>, or <style> tags. This file is injected into layout/theme.liquid via {{ content_for_layout }}.
- Do NOT use any {% section %} tags.
- Use ONLY the CSS classes already defined in the layout (hero, hero-title, hero-sub, hero-cta, btn, section, container, product-grid, product-card, product-img, product-title, product-price, features-grid, feature-card).

Write:
1. A <div class="hero"> with:
   - <h1 class="hero-title">${name}</h1>
   - <p class="hero-sub">${taglineText}</p>
   - <a href="/collections/all" class="btn hero-cta">Shop Now</a>

2. A <div class="section"><div class="container"> with:
   - <h2>Featured Products</h2>
   - <div class="product-grid">{% for product in collections.all.products limit:4 %}<div class="product-card"><a href="{{ product.url }}">{% if product.featured_image %}<img class="product-img" src="{{ product.featured_image | img_url: '400x400' }}" alt="{{ product.title | escape }}">{% endif %}<div class="product-info"><p class="product-title">{{ product.title }}</p><p class="product-price">{{ product.price | money }}</p></div></a></div>{% endfor %}</div>

3. A <div class="section" style="background:var(--bg-alt)"><div class="container"> with:
   - <h2>Why ${name}?</h2>
   - <div class="features-grid"> with 3 <div class="feature-card"> items using niche-specific icons and copy for ${niche}:
     ${features.map(f => `Icon: ${f.icon}, Title: ${f.title}, Text: ${f.text}`).join('\n     ')}

Return ONLY the complete file content. No extra tags.`
    },
    {
      key: "templates/product.liquid",
      prompt: `Write templates/product.liquid for a Shopify ${niche} store.

CRITICAL: Do NOT include <!DOCTYPE html>, <html>, <head>, <body>, or <style> tags. No {% section %} tags. This renders inside layout/theme.liquid.

Write a <div class="section"><div class="container"> with a two-column product layout:
- Left column: product image using {{ product.featured_image | img_url: '600x600' }}
- Right column:
  * {{ product.title }} as h1
  * {{ product.price | money }} styled with --accent color
  * {{ product.description }}
  * {% form 'product', product %} with:
    - {% if product.variants.size > 1 %} variant selector
    - quantity input
    - <button type="submit" class="btn">Add to Cart</button>
  * {% endform %}

Return ONLY the file content.`
    },
    {
      key: "templates/collection.liquid",
      prompt: `Write templates/collection.liquid for a Shopify ${niche} store.

CRITICAL: Do NOT include <!DOCTYPE html>, <html>, <head>, <body>, or <style> tags. No {% section %} tags.

Write a <div class="section"><div class="container"> with:
- <h1>{{ collection.title }}</h1>
- {% if collection.description != blank %}<p>{{ collection.description }}</p>{% endif %}
- <div class="product-grid">{% for product in collection.products %}<div class="product-card"><a href="{{ product.url }}"><img class="product-img" src="{{ product.featured_image | img_url: '400x400' }}" alt="{{ product.title | escape }}"><div class="product-info"><p class="product-title">{{ product.title }}</p><p class="product-price">{{ product.price | money }}</p></div></a></div>{% endfor %}</div>

Return ONLY the file content.`
    },
    {
      key: "templates/cart.liquid",
      prompt: `Write templates/cart.liquid for a Shopify ${niche} store.

CRITICAL: Do NOT include <!DOCTYPE html>, <html>, <head>, <body>, or <style> tags. No {% section %} tags.

Write a <div class="section"><div class="container"> with:
- <h1>Your Cart</h1>
- {% form 'cart', cart %}
- {% for item in cart.items %} showing item image, title, quantity input (name="updates[]"), line price, remove link
- Cart subtotal: {{ cart.total_price | money }}
- <button type="submit" name="checkout" class="btn">Checkout</button>
- {% endform %}
- <a href="/collections/all">Continue Shopping</a>

Return ONLY the file content.`
    },
    {
      key: "config/settings_schema.json",
      prompt: `Write a valid Shopify config/settings_schema.json array with two objects:
1. name: "theme_info", theme_name: "${name} Theme", theme_version: "1.0.0"
2. name: "Colors", settings array with one color setting: id "accent_color", label "Accent Color", default "${accent}"

Return ONLY a valid JSON array. No explanation, no markdown.`
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
        max_tokens: 4000,
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
    "Fashion & Apparel": "#111827",
    "Food & Gourmet": "#10B981",
    "Kids & Baby": "#FBBF24",
    "Sports & Outdoors": "#06B6D4",
    "Jewelry & Accessories": "#B45309",
    "Health & Wellness": "#22C55E",
  };
  return map[niche] || "#111827";
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

function getNicheContent(niche) {
  const map = {
    "Pet Supplies": {
      emoji: "🐾",
      hero: "Give Your Pet the Best",
      features: [
        { icon: "🐶", title: "Vet Approved", text: "All products are reviewed and recommended by licensed veterinarians." },
        { icon: "🚚", title: "Fast Delivery", text: "Get supplies at your door before your pet notices they're running low." },
        { icon: "💯", title: "Satisfaction Guarantee", text: "If your pet doesn't love it, we'll make it right — no questions asked." },
      ]
    },
    "Fitness & Gym": {
      emoji: "💪",
      hero: "Gear Up. Show Up. Level Up.",
      features: [
        { icon: "🏋️", title: "Pro-Grade Equipment", text: "Same gear used by professional athletes and elite training facilities." },
        { icon: "📦", title: "Ships in 24hrs", text: "Order today, train tomorrow. Fast fulfillment on all orders." },
        { icon: "🔄", title: "Free Returns", text: "Not the right fit? Return within 30 days, no hassle." },
      ]
    },
    "Beauty & Skincare": {
      emoji: "✨",
      hero: "Your Skin Deserves the Best",
      features: [
        { icon: "🌿", title: "Clean Ingredients", text: "Formulated without parabens, sulfates, or harsh chemicals." },
        { icon: "🧪", title: "Dermatologist Tested", text: "Every product is clinically tested for safety and efficacy." },
        { icon: "💧", title: "Real Results", text: "Thousands of verified reviews from customers who transformed their skin." },
      ]
    },
    "Home Decor": {
      emoji: "🏠",
      hero: "Design the Home You Deserve",
      features: [
        { icon: "🎨", title: "Curated Designs", text: "Every piece is hand-selected by our interior design team." },
        { icon: "📐", title: "Quality Craftsmanship", text: "Built to last with premium materials and attention to detail." },
        { icon: "🚚", title: "White Glove Shipping", text: "Careful handling and secure packaging on every order." },
      ]
    },
    "Tech & Gadgets": {
      emoji: "⚡",
      hero: "The Latest Tech, Delivered Fast",
      features: [
        { icon: "🔋", title: "Always Authentic", text: "100% genuine products from official manufacturers and distributors." },
        { icon: "🛡️", title: "Warranty Protected", text: "Full manufacturer warranty on every device we sell." },
        { icon: "💬", title: "Expert Support", text: "Our tech team is available 7 days a week to help you get set up." },
      ]
    },
    "Fashion & Apparel": {
      emoji: "👗",
      hero: "Dress Like You Mean It",
      features: [
        { icon: "👚", title: "Premium Fabrics", text: "Sourced from the finest mills — soft, durable, and built to last season after season." },
        { icon: "📏", title: "Perfect Fit Guarantee", text: "Detailed size guides and free exchanges so you always get the right fit." },
        { icon: "🌱", title: "Sustainably Made", text: "Ethical production and eco-conscious materials in every collection." },
      ]
    },
    "Food & Gourmet": {
      emoji: "🍃",
      hero: "Taste the Extraordinary",
      features: [
        { icon: "👨‍🍳", title: "Chef Curated", text: "Every product is selected and tested by professional chefs." },
        { icon: "❄️", title: "Fresh Guarantee", text: "Temperature-controlled shipping keeps perishables perfect." },
        { icon: "🌍", title: "Global Sourcing", text: "Rare ingredients and flavors from artisans around the world." },
      ]
    },
    "Kids & Baby": {
      emoji: "🧸",
      hero: "Safe, Fun, and Made to Last",
      features: [
        { icon: "🔒", title: "Safety First", text: "All products meet or exceed ASTM and CPSC safety standards." },
        { icon: "🎨", title: "Educational Play", text: "Designed to develop creativity, motor skills, and imagination." },
        { icon: "💚", title: "Non-Toxic Materials", text: "BPA-free, phthalate-free, and made with child-safe materials." },
      ]
    },
    "Sports & Outdoors": {
      emoji: "🏔️",
      hero: "Built for Where You're Going",
      features: [
        { icon: "⛰️", title: "Adventure Ready", text: "Gear tested in extreme conditions by real outdoor enthusiasts." },
        { icon: "🏕️", title: "Expert Advice", text: "Our team of athletes and guides helps you choose the right gear." },
        { icon: "🔧", title: "Lifetime Warranty", text: "We stand behind our gear for the long haul, just like you do." },
      ]
    },
    "Jewelry & Accessories": {
      emoji: "💎",
      hero: "Crafted to Be Remembered",
      features: [
        { icon: "💍", title: "Fine Materials", text: "Sterling silver, 14k gold, and genuine gemstones in every piece." },
        { icon: "🎁", title: "Gift Ready", text: "Every order arrives in a luxury gift box — no extra charge." },
        { icon: "✍️", title: "Custom Engraving", text: "Personalize any piece with a name, date, or message." },
      ]
    },
    "Health & Wellness": {
      emoji: "🌿",
      hero: "Feel Your Best Every Day",
      features: [
        { icon: "🧬", title: "Science Backed", text: "Formulations developed with clinical research and third-party testing." },
        { icon: "🌱", title: "Natural Ingredients", text: "No artificial fillers, binders, or unnecessary additives." },
        { icon: "📋", title: "Transparent Labels", text: "Full ingredient disclosure — because you deserve to know what you're taking." },
      ]
    },
  };
  return map[niche] || {
    emoji: "🛍️",
    hero: `Welcome to ${niche}`,
    features: [
      { icon: "✅", title: "Quality Guaranteed", text: "Every product is carefully selected and quality checked." },
      { icon: "🚚", title: "Fast Shipping", text: "Quick and reliable delivery on all orders." },
      { icon: "💬", title: "Great Support", text: "Our team is here to help whenever you need us." },
    ]
  };
}
