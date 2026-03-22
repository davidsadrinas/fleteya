import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "FleteYa — Tu flete, simple y rápido.",
  description:
    "Marketplace de fletes con optimización de retornos. Ahorrá hasta 40% aprovechando fleteros que vuelven vacíos. Mudanzas, mercadería y materiales en AMBA.",
  keywords: [
    "flete", "mudanza", "transporte", "AMBA", "Buenos Aires",
    "envío", "flete barato", "mudanza económica", "fletero",
  ],
  openGraph: {
    title: "FleteYa — Tu flete, simple y rápido.",
    description: "Ahorrá hasta 40% en fletes aprovechando viajes de retorno.",
    url: "https://fletaya.com.ar",
    siteName: "FleteYa",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-fy-bg text-fy-text font-body">{children}</body>
    </html>
  );
}
