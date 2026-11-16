import { ImageResponse } from "next/og";

// Náhled pro sdílení na sítích + u vyhledávačů/AI (1200×630).
// EN kopie: middleware nevpouští soubory s příponou (viz middleware.ts matcher),
// takže tenhle route nikdy nedostane jazyk z /en — nelze mít CS a EN variantu
// přes URL. Volíme ANGLICKY: názvy marketplaců jsou univerzální a sdílení míří
// i do zahraničí; české stránky si v náhledu drží CS title/description z metadat.
// Jen inline styly bez oklch a bez ozdobných glyphů — Satori (next/og) má omezené
// CSS a výchozí font nemusí mít speciální znaky; „jiskru" kreslíme jako <svg>.
export const alt = "Handmade.net — AI listing optimization for Etsy, Amazon and Fler";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#f7f4ee",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
          <svg width="46" height="46" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="og" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00CED1" />
                <stop offset="100%" stopColor="#00A86B" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill="#2a1f18" />
            <path
              d="M16 4.5 L18.7 13.3 L27.5 16 L18.7 18.7 L16 27.5 L13.3 18.7 L4.5 16 L13.3 13.3 Z"
              fill="url(#og)"
            />
          </svg>
          <div style={{ fontSize: 38, color: "#6a5a48" }}>handmade.net</div>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#2a1f18",
            lineHeight: 1.1,
            maxWidth: 960,
          }}
        >
          AI listing optimization for Etsy, Amazon &amp; Fler
        </div>
        <div
          style={{
            width: 160,
            height: 10,
            borderRadius: 999,
            marginTop: 34,
            background: "linear-gradient(90deg, #00CED1, #00A86B)",
          }}
        />
        <div style={{ fontSize: 29, color: "#5a4a3a", marginTop: 28, maxWidth: 960 }}>
          A better title, description, keywords and pricing. You keep selling yourself.
        </div>
      </div>
    ),
    { ...size },
  );
}
