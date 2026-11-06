import { ImageResponse } from "next/og";

// Dynamický OG obrázek (sdílení na sítích + náhled u vyhledávačů/AI).
// Jen inline styly bez oklch a bez speciálních glyphů — Satori (next/og) má
// omezené CSS a výchozí font nemusí mít ozdobné znaky.
export const alt = "Handmade.net — AI optimalizace listingů pro Etsy, Amazon a Fler";
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
        <div style={{ fontSize: 38, color: "#6a5a48", marginBottom: 20 }}>handmade.net</div>
        <div
          style={{
            fontSize: 66,
            fontWeight: 700,
            color: "#2a1f18",
            lineHeight: 1.1,
            maxWidth: 940,
          }}
        >
          AI optimalizace listingů pro Etsy, Amazon a Fler
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
        <div style={{ fontSize: 30, color: "#5a4a3a", marginTop: 28, maxWidth: 940 }}>
          Lepší název, popis, klíčová slova a cena. Prodáváte dál sami.
        </div>
      </div>
    ),
    { ...size },
  );
}
