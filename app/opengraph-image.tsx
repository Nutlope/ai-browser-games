import { ImageResponse } from "next/og";
import { siteName } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AI Browser Games - eight AI models built the same three games";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#ffffff",
          color: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#0a0a0a",
              color: "#ffffff",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: -1
            }}
          >
            ABG
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 600 }}>{siteName}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 920
            }}
          >
            Eight AI models built the same three games.
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#52525b" }}>
            Browse them, play them, and see what each one cost.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#71717a"
          }}
        >
          8 models · 3 games · 24 builds
        </div>
      </div>
    ),
    { ...size }
  );
}
