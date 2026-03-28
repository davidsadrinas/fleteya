import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
      <div className="text-5xl font-display font-bold text-fy-dim">404</div>
      <h2 className="text-xl font-display font-bold text-fy-text">Página no encontrada</h2>
      <p className="text-sm text-fy-soft text-center">La página que buscás no existe.</p>
      <Link href="/dashboard" className="btn-primary text-sm">
        Ir al inicio
      </Link>
    </div>
  );
}
