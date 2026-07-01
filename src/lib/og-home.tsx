import { ImageResponse } from "next/og";

// Brand/marketing OG card used for the homepage and as the default share image
// across the site (via app/opengraph-image + app/twitter-image). Kept separate
// from the article-oriented atlasOgImage() in og-image.tsx.

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
export const ogAlt = "Atlas HR — HR for teams that cross borders";

export function atlasBrandOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)",
          color: "#f8fafc",
          padding: 72,
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>Atlas HR</div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, fontWeight: 800, letterSpacing: -1, maxWidth: 1000 }}>
            HR for teams that cross borders.
          </div>
          <div style={{ fontSize: 28, color: "#bfdbfe", maxWidth: 940, lineHeight: 1.3 }}>
            Hire, onboard, pay and stay compliant across Nigeria, India, the UK and the US — with
            Atlas AI turning HR questions into completed work.
          </div>
        </div>

        {/* Country chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {["Nigeria", "India", "United Kingdom", "United States"].map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 600,
                color: "#e2e8f0",
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 999,
                padding: "10px 22px",
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    ogSize
  );
}
