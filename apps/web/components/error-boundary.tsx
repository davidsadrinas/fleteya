"use client";

import React from "react";
import Link from "next/link";
import { reportErrorSync } from "@/lib/error-reporting";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportErrorSync(error, { tags: { boundary: "react-error-boundary", component: info.componentStack?.slice(0, 200) ?? "unknown" } });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-display font-bold text-fy-text">Algo salió mal</h2>
          <p className="text-sm text-fy-soft text-center max-w-md">
            Ocurrió un error inesperado. Intentá recargar la página.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary text-sm"
            >
              Intentar de nuevo
            </button>
            <Link href="/dashboard" className="btn-secondary text-sm">
              Volver al inicio
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
