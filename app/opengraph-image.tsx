import { ImageResponse } from "next/og";
import { loadOgFonts } from "@/lib/og-fonts";

export const alt = "Beauty Tasha Salón — Nail Studio en San José, Costa Rica";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Generar en runtime (evita "Invalid URL" en prerender estático)
export const dynamic = "force-dynamic";

// Imagen que se muestra al compartir el link en WhatsApp, Instagram, X, etc.
export default async function OpengraphImage() {
  const fonts = await loadOgFonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #FBF8FE 0%, #EADCF0 40%, #D9BDF8 100%)",
          position: "relative",
          fontFamily: "Inter"
        }}
      >
        {/* Glows decorativos */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -120,
            width: 400,
            height: 400,
            borderRadius: 400,
            background: "rgba(200,158,255,0.35)"
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -140,
            right: -100,
            width: 460,
            height: 460,
            borderRadius: 460,
            background: "rgba(139,92,246,0.22)"
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            fontSize: 24,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#8B5CF6",
            fontWeight: 600,
            marginBottom: 30
          }}
        >
          Nail Studio Premium
        </div>

        {/* Ícono de marca (esmalte sobre cuadro con gradiente) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 150,
            height: 150,
            marginBottom: 34,
            borderRadius: 34,
            background: "linear-gradient(135deg, #C89EFF 0%, #8B5CF6 100%)",
            boxShadow: "0 24px 60px rgba(109,63,203,0.35)"
          }}
        >
          {/* Esmalte con divs */}
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <div style={{ width: 30, height: 40, background: "#fff", borderRadius: 8 }} />
            <div style={{ width: 18, height: 12, background: "#fff" }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 58,
                height: 100,
                background: "#fff",
                borderRadius: 16
              }}
            >
              <div style={{ fontSize: 36, color: "#8B5CF6", lineHeight: 1 }}>♥</div>
            </div>
          </div>
        </div>

        {/* Nombre */}
        <div
          style={{
            fontSize: 82,
            fontWeight: 700,
            color: "#2D1B4E",
            lineHeight: 1.05,
            textAlign: "center"
          }}
        >
          Beauty Tasha Salón
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 34,
            color: "#6D3FCB",
            marginTop: 18,
            textAlign: "center"
          }}
        >
          San José, Costa Rica · Reservá tu cita online
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
