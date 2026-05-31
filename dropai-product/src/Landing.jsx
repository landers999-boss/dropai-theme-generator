import { useState } from "react";

const NICHES = [
  "Pet Supplies", "Fitness & Gym", "Beauty & Skincare", "Home Decor",
  "Tech & Gadgets", "Fashion & Apparel", "Food & Gourmet", "Kids & Baby",
  "Sports & Outdoors", "Jewelry", "Health & Wellness",
];

const TESTIMONIALS = [
  { name: "Jordan M.", role: "Pet store owner", avatar: "JM", color: "#0F6E56", text: "Had a live Shopify store in under an hour. The theme looked like I paid a designer $500 for it." },
  { name: "Sofia P.", role: "Home decor dropshipper", avatar: "SP", color: "#185FA5", text: "I tried Fiverr, I tried free themes. Nothing matched my brand until this. Worth every penny." },
  { name: "Daniel K.", role: "Fitness gear seller", avatar: "DK", color: "#7C3AED", text: "Generated 3 themes for 3 stores in one afternoon. This pays for itself on the first store." },
];

const FEATURES = [
  { icon: "⚡", title: "Ready in 60 seconds", desc: "Claude generates your entire theme live — no waiting, no back-and-forth with a designer." },
  { icon: "🎨", title: "Niche-matched design", desc: "Colors, fonts, copy, and layout tuned to your specific market. Pet stores don't look like tech stores." },
  { icon: "📦", title: "Instant ZIP download", desc: "One click, one file. Upload directly to Shopify — takes about 2 minutes to go live." },
  { icon: "🔧", title: "Theme Editor ready", desc: "Every section has schema blocks. Edit headlines, colors, and products without touching code." },
  { icon: "📱", title: "Mobile-first", desc: "Over 70% of Shopify traffic is mobile. Your theme looks sharp on every screen size." },
  { icon: "♾️", title: "Lifetime access", desc: "Pay once. Generate themes whenever you need. No subscriptions, no per-generation fees." },
];

export default function Landing() {
  const [loading, setLoading] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState("");
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: selectedNiche, storeName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "'DM Sans', 'Inter', sans-serif", background: "#0A0A0A", color: "#fff", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ background: "#0A0A0A", borderBottom: "1px solid #1a1a1a", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>
          Drop<span style={{ color: "#00C896" }}>AI</span>
        </div>
        <button onClick={() => document.getElementById("pricing").scrollIntoView({ behavior: "smooth" })}
          style={{ background: "#00C896", color: "#0A0A0A", fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          Get Access →
        </button>
      </nav>

      {/* HERO */}
      <section style={{ background: "#0A0A0A", padding: "5rem 2rem 4rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,200,150,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.25)", color: "#00C896", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20, marginBottom: "1.5rem", letterSpacing: 1, textTransform: "uppercase", position: "relative" }}>
          ⚡ AI-Powered Shopify Theme Generator
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: -1.5, lineHeight: 1.05, maxWidth: 780, margin: "0 auto 1.5rem", position: "relative" }}>
          A custom Shopify theme for your niche,{" "}
          <span style={{ color: "#00C896" }}>built in 60 seconds</span>
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: 17, maxWidth: 520, margin: "0 auto 2.5rem", fontWeight: 300, lineHeight: 1.6, position: "relative" }}>
          Stop paying $500 for designers or settling for generic themes. DropAI generates a production-ready Shopify theme tailored to your exact niche — instantly.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", position: "relative" }}>
          <button onClick={() => document.getElementById("pricing").scrollIntoView({ behavior: "smooth" })}
            style={{ background: "#00C896", color: "#0A0A0A", fontWeight: 700, fontSize: 16, padding: "15px 36px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
            🛒 Get Instant Access — $47
          </button>
          <button onClick={() => document.getElementById("how").scrollIntoView({ behavior: "smooth" })}
            style={{ background: "transparent", color: "#fff", fontWeight: 500, fontSize: 15, padding: "15px 28px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", fontFamily: "inherit" }}>
            See how it works ↓
          </button>
        </div>
        <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#9CA3AF", fontSize: 13, position: "relative" }}>
          <span style={{ color: "#F5A623" }}>★★★★★</span>
          <span>Trusted by 400+ store owners</span>
          <span style={{ color: "#333" }}>·</span>
          <span>Instant delivery</span>
          <span style={{ color: "#333" }}>·</span>
          <span>30-day guarantee</span>
        </div>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <div style={{ background: "#111827", padding: "14px 2rem", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "2rem", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }}>
        {[["🔒", "Secure checkout"], ["⚡", "Instant ZIP download"], ["🎨", "11 niche styles"], ["♾️", "Lifetime access"], ["🛡️", "30-day guarantee"]].map(([icon, text]) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}>
            <span>{icon}</span> {text}
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: "5rem 2rem", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#00C896", marginBottom: "0.75rem" }}>How it works</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: -0.5 }}>Three steps to a live store</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          {[
            { num: "01", title: "Pick your niche", desc: "Choose from 11 pre-tuned niches or describe your own. Pet stores, fitness gear, beauty — each gets a unique design direction." },
            { num: "02", title: "Claude builds it", desc: "Our AI generates all 15 Shopify theme files in real time — layout, sections, CSS, config — tailored to your market in about 60 seconds." },
            { num: "03", title: "Upload & launch", desc: "Download your ZIP, upload it in Shopify Admin under Online Store → Themes. You're live in under 5 minutes." },
          ].map((s) => (
            <div key={s.num} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: "1.75rem" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "2.5rem", color: "#1e1e1e", lineHeight: 1, marginBottom: "0.75rem" }}>{s.num}</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: "0.5rem" }}>{s.title}</div>
              <div style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: "#0d0d0d", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#00C896", marginBottom: "0.75rem" }}>What you get</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: -0.5 }}>Everything a designer would charge $500 for</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "1.25rem", display: "flex", gap: 14 }}>
                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FILE LIST */}
      <section style={{ padding: "5rem 2rem", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#00C896", marginBottom: "0.75rem" }}>What's in the ZIP</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", letterSpacing: -0.5, marginBottom: "1rem" }}>15 production-ready files, upload-ready</h2>
            <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Every file follows Shopify's theme architecture. Sections include <code style={{ background: "#1a1a1a", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{"{% schema %}"}</code> blocks so everything is editable in the Theme Editor — no code required after setup.
            </p>
          </div>
          <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: "1.25rem" }}>
            {[
              ["layout/", "theme.liquid"],
              ["templates/", "index.liquid · product.liquid · collection.liquid · cart.liquid · page.liquid"],
              ["sections/", "header.liquid · hero.liquid · featured-collection.liquid · footer.liquid"],
              ["assets/", "theme.css · theme.js"],
              ["config/", "settings_schema.json · settings_data.json"],
              ["locales/", "en.default.json"],
            ].map(([folder, files]) => (
              <div key={folder} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
                <span style={{ color: "#00C896", fontSize: 12, fontFamily: "monospace", flexShrink: 0, paddingTop: 1 }}>{folder}</span>
                <span style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>{files}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: "#0d0d0d", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#00C896", marginBottom: "0.75rem" }}>Real customers</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: -0.5 }}>Store owners love it</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.75rem" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{t.role}</div>
                  </div>
                </div>
                <div style={{ color: "#F5A623", fontSize: 13, marginBottom: "0.5rem" }}>★★★★★</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>"{t.text}"</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#059669", fontWeight: 600, marginTop: 10 }}>
                  ✓ Verified purchase
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "5rem 2rem", maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#00C896", marginBottom: "0.75rem" }}>Pricing</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: -0.5, marginBottom: "0.75rem" }}>One price. Unlimited themes.</h2>
          <p style={{ color: "#9CA3AF", fontSize: 14 }}>A freelance theme costs $300–$800. A Shopify theme subscription is $20/month. You pay once.</p>
        </div>

        <div style={{ background: "#111", border: "2px solid #00C896", borderRadius: 20, overflow: "hidden" }}>
          <div style={{ background: "#00C896", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#0A0A0A" }}>DropAI Lifetime</div>
            <div style={{ background: "#0A0A0A", color: "#00C896", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>BEST VALUE</div>
          </div>
          <div style={{ padding: "1.75rem" }}>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: 13, color: "#9CA3AF", textDecoration: "line-through", marginBottom: 4 }}>Regular price: $127</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "2.5rem", letterSpacing: -1 }}>$47</span>
                <span style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 4 }}>Save $80</span>
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF" }}>One-time payment · No subscriptions</div>
            </div>

            {[
              "Generate unlimited themes",
              "11 niche-specific designs",
              "All 15 Shopify theme files",
              "Theme Editor ready (schema blocks)",
              "Mobile-responsive layouts",
              "Lifetime access + future updates",
              "30-day money-back guarantee",
            ].map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 14, borderBottom: "1px solid #1a1a1a" }}>
                <span style={{ color: "#00C896", fontWeight: 700, fontSize: 14 }}>✓</span> {f}
              </div>
            ))}

            {/* Quick niche selector before checkout */}
            <div style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                Your niche <span style={{ color: "#444", fontWeight: 400 }}>(optional — you can change it after)</span>
              </label>
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                style={{ width: "100%", background: "#0d0d0d", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", color: selectedNiche ? "#fff" : "#6B7280", fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 10 }}
              >
                <option value="">Select a niche...</option>
                {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                <option value="custom">Other / Custom</option>
              </select>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Store name (optional)"
                style={{ width: "100%", background: "#0d0d0d", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ background: "#1a0505", border: "1px solid #3d0f0f", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#fca5a5", marginBottom: "1rem" }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              style={{ background: loading ? "#1a1a1a" : "#00C896", color: loading ? "#444" : "#0A0A0A", fontWeight: 700, fontSize: 16, padding: "16px", borderRadius: 10, width: "100%", border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: "0.5rem" }}>
              {loading ? "Redirecting to checkout..." : "🔒 Get Instant Access — $47"}
            </button>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: "0.75rem" }}>
              {["🔒 SSL Encrypted", "⚡ Instant delivery", "🛡️ 30-day guarantee"].map((t) => (
                <span key={t} style={{ fontSize: 11, color: "#6B7280" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: "#0d0d0d", borderTop: "1px solid #1a1a1a", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#00C896", marginBottom: "0.75rem" }}>FAQ</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", letterSpacing: -0.5, marginBottom: "2rem" }}>Common questions</h2>
          {[
            ["Do I need a Shopify subscription?", "Yes. Shopify plans start at $39/month. You'll need an account to upload and use the generated theme."],
            ["Can I edit the theme after generating it?", "Absolutely. Every section has schema blocks for the Theme Editor. You can also edit the Liquid/CSS files directly if you're comfortable with code."],
            ["What if I don't like the generated theme?", "You can regenerate as many times as you want — there's no per-generation fee. Different runs produce different results. And if you're still unhappy after 30 days, we'll refund you."],
            ["Does this work with any Shopify plan?", "Yes — Basic, Shopify, Advanced, and Plus all support custom theme uploads."],
            ["Is my Anthropic API key exposed?", "No. The key lives on our server. You never see it, and your browser never touches it directly."],
            ["Can I use this for client stores?", "Yes. One purchase covers unlimited stores and clients."],
          ].map(([q, a]) => (
            <div key={q} style={{ borderBottom: "1px solid #1a1a1a", padding: "1.1rem 0" }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: "0.4rem" }}>{q}</div>
              <div style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.7 }}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{ background: "#0A0A0A", padding: "4rem 2rem", textAlign: "center", borderTop: "1px solid #1a1a1a" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: -0.5, marginBottom: "0.75rem" }}>
          Stop waiting. Start selling.
        </h2>
        <p style={{ color: "#9CA3AF", fontSize: 15, marginBottom: "2rem" }}>Your Shopify store can be live today.</p>
        <button onClick={() => document.getElementById("pricing").scrollIntoView({ behavior: "smooth" })}
          style={{ background: "#00C896", color: "#0A0A0A", fontWeight: 700, fontSize: 16, padding: "16px 40px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          Get Instant Access — $47
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#111827", padding: "1.5rem 2rem", textAlign: "center", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem", marginBottom: "0.75rem" }}>
          {["Privacy Policy", "Terms of Service", "Refund Policy", "Contact"].map((l) => (
            <a key={l} href="#" style={{ fontSize: 13, color: "#9CA3AF", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#6B7280" }}>© {new Date().getFullYear()} DropAI. All rights reserved. Results vary by individual effort.</div>
      </footer>
    </div>
  );
}
