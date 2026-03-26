import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "FleteYa — Tu flete, simple y rápido.",
  description:
    "Marketplace de fletes en AMBA: publicás el envío, los fleteros se postulan y FleteYa asigna por cercanía y reputación. Retornos y tramos encadenados para pagar menos.",
  keywords: [
    "flete", "mudanza", "transporte", "AMBA", "Buenos Aires",
    "envío", "flete barato", "mudanza económica", "fletero",
  ],
  openGraph: {
    title: "FleteYa — Tu flete, simple y rápido.",
    description: "Postulaciones, asignación inteligente y viajes de retorno en AMBA.",
    url: "https://fletaya.com.ar",
    siteName: "FleteYa",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark overflow-x-hidden">
      <body className="bg-fy-bg text-fy-text font-body min-h-dvh min-h-[100dvh] antialiased">
        {children}
      </body>
    </html>
  );
}
