import { ImageResponse } from "next/og";
import { loadOgFonts } from "@/lib/og-fonts";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
// Generar en runtime (evita "Invalid URL" en prerender estático)
export const dynamic = "force-dynamic";

// Apple touch icon (iOS homescreen). Esmalte dibujado con divs (Satori-safe).
export default async function AppleIcon() {
  const fonts = await loadOgFonts();
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #C89EFF 0%, #8B5CF6 100%)"
        }}
      >
        <NailPolish scale={1.5} />
      </div>
    ),
    { ...size, fonts }
  );
}

// Frasco de esmalte con corazón — construido con flexbox (sin SVG ni img).
function NailPolish({ scale = 1 }: { scale?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      {/* Tapa */}
      <div
        style={{
          width: 22 * scale,
          height: 30 * scale,
          background: "#ffffff",
          borderRadius: 6 * scale
        }}
      />
      {/* Cuello */}
      <div
        style={{
          width: 13 * scale,
          height: 9 * scale,
          background: "#ffffff"
        }}
      />
      {/* Cuerpo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 42 * scale,
          height: 76 * scale,
          background: "#ffffff",
          borderRadius: 12 * scale
        }}
      >
        <div
          style={{
            fontSize: 26 * scale,
            color: "#8B5CF6",
            lineHeight: 1
          }}
        >
          ♥
        </div>
      </div>
    </div>
  );
}
