import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ingresar | FleteYa",
  description: "Ingresá a FleteYa para publicar, gestionar y seguir tus envíos.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
