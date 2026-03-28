"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportErrorSync } from "@/lib/error-reporting";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportErrorSync(error, { tags: { boundary: "app-error-page" } });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-xl font-display font-bold text-fy-text">Algo salió mal</h2>
      <p className="text-sm text-fy-soft text-center max-w-md">
        {error.message || "Ocurrió un error inesperado."}
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary text-sm">
          Intentar de nuevo
        </button>
        <Link href="/dashboard" className="btn-secondary text-sm">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
