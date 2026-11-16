import { ImageResponse } from "next/og";

// Apple touch icon (home screen iOS). PNG nejde dodat staticky brandované bez
// rasterizéru, tak ho vygeneruje next/og z téhož motivu jako app/icon.svg.
// iOS si rohy zaobluje sám → kreslíme plné hnědé pozadí přes celou plochu.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2a1f18",
        }}
      >
        <svg width="128" height="128" viewBox="0 0 32 32">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00CED1" />
              <stop offset="100%" stopColor="#00A86B" />
            </linearGradient>
          </defs>
          <path
            d="M16 4.5 L18.7 13.3 L27.5 16 L18.7 18.7 L16 27.5 L13.3 18.7 L4.5 16 L13.3 13.3 Z"
            fill="url(#g)"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
