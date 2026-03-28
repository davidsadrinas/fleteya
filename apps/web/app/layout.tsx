import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { getPublicSiteUrl } from "@/lib/content/site-url";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteUrl()),
  title: "FleteYa — Tu flete, simple y rápido.",
  description:
    "Marketplace de fletes en AMBA: publicás el envío, los fleteros se postulan y FleteYa asigna por cercanía y reputación. Retornos y tramos encadenados para pagar menos.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  keywords: [
    "flete", "mudanza", "transporte", "AMBA", "Buenos Aires",
    "envío", "flete barato", "mudanza económica", "fletero",
  ],
  category: "logistics",
  openGraph: {
    title: "FleteYa — Tu flete, simple y rápido.",
    description: "Postulaciones, asignación inteligente y viajes de retorno en AMBA.",
    url: "https://fletaya.com.ar",
    siteName: "FleteYa",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "FleteYa marketplace de fletes en AMBA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FleteYa — Tu flete, simple y rápido.",
    description: "Publicás, se postulan fleteros y FleteYa asigna por cercanía y reputación.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="overflow-x-hidden">
      <body className="bg-fy-bg text-fy-text font-body min-h-dvh min-h-[100dvh] antialiased">
        {children}
      </body>
    </html>
  );
}
