import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const runtime = "edge";
export const alt = `${SITE.name} — ${SITE.description}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#eef2f6";
const INK = "#0c1222";
const INK_FAINT = "#8b9cb3";
const HOT = "#0d9488";

const MASTHEAD_CAPTION = SITE.keywords.map((k) => k.toUpperCase()).join(" · ");

function DottedRing({ ringSize = 72 }: { ringSize?: number }) {
  const cx = ringSize / 2;
  const cy = ringSize / 2;
  const r = ringSize / 2 - 4;
  const dotR = ringSize * 0.028;
  const points = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  return (
    <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={dotR} fill={HOT} />
      ))}
      <circle cx={cx} cy={cy} r={dotR * 1.4} fill={HOT} />
    </svg>
  );
}

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: PAPER,
          color: INK,
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingTop: 18,
            paddingBottom: 18,
            borderTop: `1px solid ${INK_FAINT}`,
            borderBottom: `1px solid ${INK_FAINT}`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              color: INK_FAINT,
              fontSize: 18,
              letterSpacing: "0.22em",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
            }}
          >
            <span>{MASTHEAD_CAPTION}</span>
            <span>OPEN SOURCE</span>
          </div>
          <DottedRing />
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 120,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                fontWeight: 900,
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              <span style={{ color: INK }}>sync</span>
              <span style={{ color: HOT, fontStyle: "italic" }}>frame</span>
            </div>
            <div
              style={{
                marginTop: 28,
                fontSize: 32,
                color: INK,
                opacity: 0.72,
                maxWidth: 900,
                lineHeight: 1.35,
              }}
            >
              {SITE.tagline}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: INK_FAINT,
            fontSize: 18,
            letterSpacing: "0.22em",
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            paddingTop: 16,
            borderTop: `1px solid ${INK_FAINT}`,
          }}
        >
          <span>{SITE.author.name.toUpperCase()}</span>
          <span>{SITE.url.replace(/^https?:\/\//, "").toUpperCase()}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
