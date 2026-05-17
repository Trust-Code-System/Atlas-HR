import { ImageResponse } from "next/og";

export const ogSize = {
  width: 1200,
  height: 630,
};

export function atlasOgImage({
  title,
  label,
  readingTime,
}: {
  title: string;
  label: string;
  readingTime?: number;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f172a",
          color: "#f8fafc",
          padding: 64,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            A
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, fontWeight: 800 }}>Atlas HR</div>
            <div style={{ fontSize: 18, color: "#93c5fd" }}>{label}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              maxWidth: 980,
              fontSize: title.length > 70 ? 48 : 58,
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: 0,
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 22, color: "#cbd5e1" }}>
            <span>Atlas HR Editorial Team</span>
            {readingTime ? <span>- {readingTime} min read</span> : null}
          </div>
        </div>

        <div
          style={{
            height: 10,
            width: 360,
            borderRadius: 999,
            background: "#3b82f6",
          }}
        />
      </div>
    ),
    ogSize
  );
}
