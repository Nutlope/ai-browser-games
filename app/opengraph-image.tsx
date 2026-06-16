import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AI Browser Games - eight AI models built the same three games";

const togetherLogo = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/together-logo.png")
).toString("base64")}`;

const TILE = {
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  width: 341,
  height: 208,
  borderRadius: 20,
  fontSize: 34,
  fontWeight: 600 as const,
  letterSpacing: -0.5,
  color: "#f4f4f5"
};

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
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 38,
          padding: "56px 64px"
        }}
      >
        {/* logos: ABG mark + Together AI */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 54,
              height: 54,
              borderRadius: 14,
              background: "#0a0a0a",
              color: "#ffffff",
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: -1
            }}
          >
            ABG
          </div>
          <div style={{ display: "flex", width: 1, height: 34, background: "#e4e4e7" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={togetherLogo} width={142} height={30} alt="Together AI" />
        </div>

        {/* headline (centered, "Three games." on its own line) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 62,
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: -2
          }}
        >
          <div style={{ display: "flex" }}>One prompt. Eight models.</div>
          <div style={{ display: "flex" }}>Three games.</div>
        </div>

        {/* three game tiles, each labeled by name */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          <div style={{ ...TILE, background: "linear-gradient(160deg, #102018, #0a120d)" }}>
            Snake
          </div>
          <div style={{ ...TILE, background: "linear-gradient(160deg, #161426, #0d0c16)" }}>
            Tetris
          </div>
          <div style={{ ...TILE, background: "linear-gradient(160deg, #0c1422, #090d16)" }}>
            Breakout
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 1, color: "#71717a" }}>
          Compared by generation cost
        </div>
      </div>
    ),
    { ...size }
  );
}
