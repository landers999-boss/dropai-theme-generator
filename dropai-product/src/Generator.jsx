import { useState, useEffect, useRef } from "react";
import JSZip from "jszip";

const NICHES = [
  { id: "pet", label: "Pet Supplies", icon: "🐾" },
  { id: "fitness", label: "Fitness & Gym", icon: "💪" },
  { id: "beauty", label: "Beauty & Skincare", icon: "✨" },
  { id: "home", label: "Home Decor", icon: "🏠" },
  { id: "tech", label: "Tech & Gadgets", icon: "⚡" },
  { id: "fashion", label: "Fashion & Apparel", icon: "👗" },
  { id: "food", label: "Food & Gourmet", icon: "🍃" },
  { id: "kids", label: "Kids & Baby", icon: "🧸" },
  { id: "sports", label: "Sports & Outdoors", icon: "🏔️" },
  { id: "jewelry", label: "Jewelry & Accessories", icon: "💎" },
  { id: "wellness", label: "Health & Wellness", icon: "🌿" },
  { id: "custom", label: "Custom Niche", icon: "✏️" },
];

const GEN_STEPS = ["Verifying purchase", "Configuring AI", "Building theme", "Packaging files"];

export default function Generator({ sessionId }) {
  // Phases: verify | configure | generating | done | error
  const [phase, setPhase] = useState("verify");
  const [token, setToken] = useState(null);
  const [prefillMeta, setPrefillMeta] = useState({});
  const [customerEmail, setCustomerEmail] = useState("");

  // Configure form
  const [selectedNiche, setSelectedNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [storeName, setStoreName] = useState("");
  const [tagline, setTagline] = useState("");

  // Generation state
  const [genStep, setGenStep] = useState(0);
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const logRef = useRef(null);

  const addLog = (msg) => setLog((l) => [...l, { msg, ts: Date.now() }]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // Step 1: verify the Stripe session and get a signed token
  useEffect(() => {
    if (!sessionId) { setError("No session ID found."); setPhase("error"); return; }
    verifyPurchase();
  }, [sessionId]);

  async function verifyPurchase() {
    setPhase("verify");
    try {
      const res = await fetch("/api/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const text = await res.text();
      if (!text) throw new Error("Empty response from server");
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setToken(data.token);
      setCustomerEmail(data.customerEmail || "");
      if (data.metadata?.niche) {
        const match = NICHES.find((n) => n.label === data.metadata.niche);
        if (match) setSelectedNiche(match.id);
        else { setSelectedNiche("custom"); setCustomNiche(data.metadata.niche); }
      }
      if (data.metadata?.storeName) setStoreName(data.metadata.storeName);
      setPrefillMeta(data.metadata || {});
      setPhase("configure");
    } catch (e) {
      setError(e.message);
      setPhase("error");
    }
  }

  const activeNiche =
    selectedNiche === "custom"
      ? customNiche
      : NICHES.find((n) => n.id === selectedNiche)?.label || "";

  async function generate() {
    if (!activeNiche) return;
    setPhase("generating");
    setGenStep(0);
    setLog([]);
    setError("");

    try {
      addLog("🔐 Verifying purchase token...");
      setGenStep(1);
      await sleep(400);

      addLog(`📦 Niche: ${activeNiche}`);
      addLog(`🏪 Store: ${storeName || activeNiche + " Store"}`);
      setGenStep(2);

      addLog("🤖 Sending request to AI...");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ niche: activeNiche, storeName, tagline }),
      });

      // ✅ Safe parse — handles empty or non-JSON responses
      const text = await res.text();
      if (!text) throw new Error("Empty response from server");
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error || "Generation failed");

      // ✅ Parse AI content into files/meta
      const aiText = data.content?.[0]?.text || "";
      const clean = aiText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const files = parsed.files || {};
      const meta = parsed.meta || {};

      addLog(`✅ Theme generated — ${Object.keys(files).length} files`);
      setGenStep(3);

      addLog("📦 Building ZIP archive...");
      const zip = new JSZip();
      const folderName =
        (storeName || activeNiche).toLowerCase().replace(/\s+/g, "-") + "-theme";
      const folder = zip.folder(folderName);
      for (const [path, content] of Object.entries(files)) {
        folder.file(path, content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      setGenStep(4);
      addLog("✅ ZIP ready for download!");

      setResult({ blob, meta, files });
      setPhase("done");
    } catch (e) {
      setError(e.message);
      addLog("❌ " + e.message);
      setPhase("error");
    }
  }

  function downloadZip() {
    if (!result?.blob) return;
    const name =
      (storeName || activeNiche).toLowerCase().replace(/\s+/g, "-") +
      "-shopify-theme.zip";
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={styles.nav}>
        <div style={styles.logo}>Drop<span style={{ color: "#00C896" }}>AI</span></div>
        {customerEmail && (
          <div style={styles.emailBadge}>
            <span style={{ color: "#9CA3AF", fontSize: 13 }}>✓</span>{" "}
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>{customerEmail}</span>
          </div>
        )}
      </nav>

      {/* ── PHASE: VERIFY ── */}
      {phase === "verify" && (
        <CenteredBox>
          <Spinner />
          <h2 style={styles.h2}>Verifying your purchase...</h2>
          <p style={styles.sub}>Confirming payment with Stripe</p>
        </CenteredBox>
      )}

      {/* ── PHASE: CONFIGURE ── */}
      {phase === "configure" && (
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 2rem" }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={styles.badge}>✓ Purchase verified — let's build your theme</div>
            <h1 style={styles.h1}>Configure your theme</h1>
            <p style={styles.sub}>You can generate as many times as you want. Each run is unique.</p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <Label>Choose your niche</Label>
            <div style={styles.nicheGrid}>
              {NICHES.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNiche(n.id)}
                  style={{
                    ...styles.nicheBtn,
                    background: selectedNiche === n.id ? "rgba(0,200,150,0.08)" : "#111",
                    border: selectedNiche === n.id ? "2px solid #00C896" : "1px solid #222",
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{n.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{n.label}</div>
                  {selectedNiche === n.id && (
                    <div style={styles.checkDot}>
                      <svg width="9" height="7" viewBox="0 0 9 7"><path d="M1 3.5L3 5.5L8 1" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedNiche === "custom" && (
            <div style={{ marginBottom: "1.25rem" }}>
              <Label>Describe your niche</Label>
              <Input
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
                placeholder="e.g. Sustainable bamboo kitchenware"
              />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "2rem" }}>
            <div>
              <Label>Store name <Opt /></Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder={`e.g. ${activeNiche || "My"} Co.`} />
            </div>
            <div>
              <Label>Tagline <Opt /></Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Quality gear, fast delivery" />
            </div>
          </div>

          <div style={styles.includesBox}>
            <div style={styles.includesTitle}>What gets generated</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
              {[
                ["📐", "layout/theme.liquid"],
                ["📄", "5 page templates"],
                ["🧩", "4 Liquid sections"],
                ["🎨", "Full CSS stylesheet"],
                ["⚙️", "Theme Editor config"],
                ["🌐", "Locale files"],
              ].map(([icon, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9CA3AF" }}>
                  <span>{icon}</span> {label}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!activeNiche}
            style={{
              ...styles.btnPrimary,
              background: activeNiche ? "#00C896" : "#1a1a1a",
              color: activeNiche ? "#0A0A0A" : "#444",
              cursor: activeNiche ? "pointer" : "not-allowed",
              width: "100%",
              justifyContent: "center",
              fontSize: 16,
              padding: "16px",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            Generate My Theme
          </button>
        </div>
      )}

      {/* ── PHASE: GENERATING ── */}
      {phase === "generating" && (
        <CenteredBox>
          <div style={styles.spinRing}><Spinner size={36} /></div>
          <h2 style={styles.h2}>Building your <span style={{ color: "#00C896" }}>{activeNiche}</span> theme...</h2>
          <p style={{ ...styles.sub, marginBottom: "2rem" }}>Claude is writing all your theme files right now</p>

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: "2rem" }}>
            {GEN_STEPS.map((s, i) => (
              <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: i < genStep ? "#00C896" : i === genStep ? "rgba(0,200,150,0.15)" : "#1a1a1a",
                  border: `2px solid ${i <= genStep ? "#00C896" : "#2a2a2a"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, transition: "all 0.3s",
                  color: i < genStep ? "#0A0A0A" : i === genStep ? "#00C896" : "#444",
                }}>
                  {i < genStep ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 10, color: i <= genStep ? "#9CA3AF" : "#333", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{s}</span>
              </div>
            ))}
          </div>

          <div ref={logRef} style={styles.terminal}>
            <div style={{ color: "#00C896", marginBottom: 6, fontSize: 11, letterSpacing: 1 }}>● LIVE OUTPUT</div>
            {log.map((l, i) => (
              <div key={i} style={{ color: l.msg.startsWith("❌") ? "#ef4444" : l.msg.startsWith("✅") ? "#00C896" : "#9CA3AF", padding: "2px 0", fontSize: 13 }}>
                {l.msg}
              </div>
            ))}
            <span style={{ color: "#444", animation: "blink 1s infinite" }}>▋</span>
          </div>

          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </CenteredBox>
      )}

      {/* ── PHASE: DONE ── */}
      {phase === "done" && result && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={styles.successIcon}>✅</div>
            <h2 style={{ ...styles.h1, textAlign: "center", marginBottom: "0.5rem" }}>Your theme is ready!</h2>
            <p style={{ color: "#9CA3AF", fontSize: 14 }}>
              {result.meta?.tagline || `A custom ${activeNiche} Shopify theme, built just for you.`}
            </p>
          </div>

          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 16, overflow: "hidden", marginBottom: "1.5rem" }}>
            <div style={{ background: result.meta?.colorAccent || "#00C896", padding: "1.25rem 1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#0A0A0A" }}>
                  {result.meta?.themeName || storeName || activeNiche + " Theme"}
                </div>
                <div style={{ fontSize: 12, color: "rgba(0,0,0,0.55)" }}>{activeNiche} · Shopify Theme · {Object.keys(result.files).length} files</div>
              </div>
              <div style={{ fontSize: 32 }}>{NICHES.find((n) => n.id === selectedNiche)?.icon || "🛍️"}</div>
            </div>
            <div style={{ padding: "1.25rem 1.75rem" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Generated files</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.keys(result.files).map((f) => (
                  <div key={f} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>
                    {f.split("/").pop()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <button onClick={downloadZip} style={{ ...styles.btnPrimary, flex: 1, justifyContent: "center", fontSize: 15, padding: "14px" }}>
              <DownloadIcon /> Download Theme ZIP
            </button>
            <button
              onClick={() => { setPhase("configure"); setResult(null); setLog([]); }}
              style={{ ...styles.btnGhost, flex: "0 0 auto", padding: "14px 20px" }}
            >
              Generate Again
            </button>
          </div>

          <div style={styles.installBox}>
            <div style={styles.includesTitle}>How to install in Shopify</div>
            {[
              ["1", "Go to Shopify Admin → Online Store → Themes"],
              ["2", 'Click "Add theme" → "Upload zip file"'],
              ["3", "Select your downloaded ZIP file and click Upload"],
              ["4", 'Preview, then click "Publish" to go live'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
                <div style={styles.stepNum}>{n}</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", paddingTop: 4 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PHASE: ERROR ── */}
      {phase === "error" && (
        <CenteredBox>
          <div style={{ fontSize: 48, marginBottom: "1rem" }}>⚠️</div>
          <h2 style={{ ...styles.h2, color: "#ef4444", marginBottom: "0.75rem" }}>Something went wrong</h2>
          <p style={{ color: "#9CA3AF", fontSize: 14, marginBottom: "1.5rem", maxWidth: 420, textAlign: "center", lineHeight: 1.6 }}>
            {error}
          </p>
          {log.length > 0 && (
            <div style={{ ...styles.terminal, marginBottom: "1.5rem", width: "100%", maxWidth: 480 }}>
              {log.map((l, i) => (
                <div key={i} style={{ color: l.msg.startsWith("❌") ? "#ef4444" : "#666", fontSize: 12, fontFamily: "monospace" }}>{l.msg}</div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            {token && (
              <button onClick={generate} style={styles.btnPrimary}>Try Again</button>
            )}
            <button onClick={verifyPurchase} style={styles.btnGhost}>Re-verify Purchase</button>
          </div>
          <p style={{ marginTop: "1.5rem", fontSize: 12, color: "#444" }}>
            Still stuck? Email <a href="mailto:support@dropai.app" style={{ color: "#00C896" }}>support@dropai.app</a>
          </p>
        </CenteredBox>
      )}
    </div>
  );
}

function CenteredBox({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 56px)", padding: "3rem 2rem", textAlign: "center" }}>
      {children}
    </div>
  );
}

function Spinner({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2" style={{ animation: "spin 1.2s linear infinite", display: "block", margin: "0 auto 1.5rem" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 }}>{children}</div>;
}

function Opt() {
  return <span style={{ color: "#444", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}> (optional)</span>;
}

function Input({ value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", background: "#111", border: `1px solid ${focused ? "#00C896" : "#2a2a2a"}`,
        borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14,
        fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box", transition: "border 0.15s",
      }}
    />
  );
}

function DownloadIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

const styles = {
  root: { fontFamily: "'DM Sans','Inter',sans-serif", minHeight: "100vh", background: "#0A0A0A", color: "#fff" },
  nav: { background: "#0A0A0A", borderBottom: "1px solid #1a1a1a", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  logo: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: -0.5 },
  emailBadge: { display: "flex", alignItems: "center", gap: 6, background: "#111", border: "1px solid #1e1e1e", borderRadius: 20, padding: "4px 12px" },
  badge: { display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.25)", color: "#00C896", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20, marginBottom: "1rem", letterSpacing: 0.5 },
  h1: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.4rem,3vw,2rem)", letterSpacing: -0.5, marginBottom: "0.5rem" },
  h2: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.3rem,3vw,1.75rem)", letterSpacing: -0.5, marginBottom: "0.5rem" },
  sub: { color: "#9CA3AF", fontSize: 14, fontWeight: 300 },
  nicheGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 },
  nicheBtn: { borderRadius: 12, padding: "1rem 0.75rem", cursor: "pointer", textAlign: "left", color: "#fff", position: "relative", transition: "all 0.15s" },
  checkDot: { width: 18, height: 18, background: "#00C896", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 },
  includesBox: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" },
  installBox: { background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: "1.25rem" },
  includesTitle: { fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  terminal: { background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, padding: "1rem 1.25rem", textAlign: "left", maxHeight: 200, overflowY: "auto", fontFamily: "monospace", fontSize: 13, width: "100%", maxWidth: 500 },
  spinRing: { marginBottom: "1.5rem" },
  btnPrimary: { background: "#00C896", color: "#0A0A0A", fontWeight: 700, fontSize: 14, padding: "12px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 8 },
  btnGhost: { background: "transparent", color: "#9CA3AF", fontWeight: 500, fontSize: 14, padding: "12px 20px", borderRadius: 8, border: "1px solid #2a2a2a", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  successIcon: { width: 72, height: 72, background: "rgba(0,200,150,0.12)", border: "2px solid #00C896", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: 30 },
  stepNum: { width: 24, height: 24, background: "#00C896", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0A0A0A", flexShrink: 0, marginTop: 2 },
};
