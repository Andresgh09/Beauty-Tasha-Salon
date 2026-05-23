import type { Metadata } from "next";
import { Inter, Playfair_Display, Cormorant } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap"
});

const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap"
});

const BASE_URL = "https://beautytashasalon.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Beauty Tasha Salón — Nail Studio en San José, Costa Rica",
    template: "%s | Beauty Tasha Salón"
  },
  description:
    "Manicure, pedicure, esmaltado semipermanente y extensiones de uñas en San José, Costa Rica. Reserva tu cita online con Tasha. Atención personalizada en un ambiente relajante.",
  keywords: [
    "manicure san jose costa rica",
    "pedicure san jose",
    "uñas gel x costa rica",
    "esmaltado semipermanente san jose",
    "nail studio costa rica",
    "salón de uñas san jose",
    "extensiones de uñas costa rica",
    "beauty tasha salon"
  ],
  authors: [{ name: "Beauty Tasha Salón" }],
  openGraph: {
    title: "Beauty Tasha Salón — Nail Studio en San José, Costa Rica",
    description:
      "Manicure, pedicure y extensiones de uñas en San José. Reserva tu cita online con Tasha.",
    url: BASE_URL,
    siteName: "Beauty Tasha Salón",
    locale: "es_CR",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Beauty Tasha Salón — Nail Studio Premium en Costa Rica"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Beauty Tasha Salón — Nail Studio en San José, Costa Rica",
    description:
      "Manicure, pedicure y extensiones de uñas en San José. Reserva tu cita online.",
    images: ["/og-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" }
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" }
    ],
    apple: "/apple-icon.png"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es-CR"
      className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
