import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FleteYa | Marketplace de fletes en AMBA",
  description:
    "Publicá tu envío en minutos. Los fleteros se postulan y FleteYa asigna por cercanía y reputación para que pagues un precio claro.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
