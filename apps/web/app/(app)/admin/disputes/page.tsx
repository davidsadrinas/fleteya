"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-fetch";

type DisputeRow = {
  id: string;
  shipment_id: string;
  reason: string;
  description: string | null;
  evidence_urls: string[];
  status: string;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  profiles: { name: string; email: string } | null;
};

const TABS = [
  { id: "open", label: "Abiertas" },
  { id: "under_review", label: "En revisión" },
  { id: "resolved", label: "Resueltas" },
  { id: "rejected", label: "Rechazadas" },
  { id: "all", label: "Todas" },
];

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-500/20 text-red-400",
  under_review: "bg-amber-500/20 text-amber-400",
  resolved: "bg-green-500/20 text-green-400",
  rejected: "bg-gray-500/20 text-gray-400",
};

export default function AdminDisputesPage() {
  const [tab, setTab] = useState("open");
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/disputes?status=${tab}&page=${page}&limit=20`);
    const data = await res.json();
    setDisputes(data.disputes ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [tab, page]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleAction = async (disputeId: string, status: string) => {
    await apiFetch(`/api/admin/disputes/${disputeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        resolution_note: resolveNote || undefined,
      }),
    });
    setResolvingId(null);
    setResolveNote("");
    fetchDisputes();
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-display font-bold text-fy-text mb-4">Disputas</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? "bg-brand-teal/20 text-brand-teal-light"
                : "bg-brand-card text-fy-soft hover:text-fy-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-fy-dim py-12 animate-pulse">Cargando...</div>
      ) : disputes.length === 0 ? (
        <div className="text-center text-fy-soft py-12">No hay disputas.</div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d.id} className="card !p-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-heading font-bold text-fy-text text-sm">
                      Envío #{d.shipment_id.slice(0, 8)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status] ?? ""}`}>
                      {d.status}
                    </span>
                  </div>
                  <div className="text-sm text-fy-soft mb-1">
                    Reportado por: {d.profiles?.name ?? "—"} ({d.profiles?.email ?? ""})
                  </div>
                  <div className="text-sm text-fy-text mb-1">
                    <strong>Motivo:</strong> {d.reason}
                  </div>
                  {d.description && (
                    <div className="text-sm text-fy-soft">{d.description}</div>
                  )}
                  {d.evidence_urls?.length > 0 && (
                    <div className="flex gap-2 mt-2 text-xs text-brand-teal-light">
                      {d.evidence_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="underline">
                          Evidencia {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  {d.resolution_note && (
                    <div className="mt-2 text-xs text-fy-dim border-t border-fy-border pt-2">
                      Resolución: {d.resolution_note}
                    </div>
                  )}
                  <div className="text-xs text-fy-dim mt-1">
                    {new Date(d.created_at).toLocaleDateString("es-AR")}
                  </div>
                </div>

                {(d.status === "open" || d.status === "under_review") && (
                  <div className="flex flex-col gap-2 shrink-0">
                    {d.status === "open" && (
                      <button
                        onClick={() => handleAction(d.id, "under_review")}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg"
                      >
                        En revisión
                      </button>
                    )}
                    {resolvingId === d.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={resolveNote}
                          onChange={(e) => setResolveNote(e.target.value)}
                          placeholder="Nota de resolución..."
                          className="input text-xs !py-1.5 w-48"
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAction(d.id, "resolved")}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded"
                          >
                            Resolver
                          </button>
                          <button
                            onClick={() => handleAction(d.id, "rejected")}
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded"
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => { setResolvingId(null); setResolveNote(""); }}
                            className="px-2 py-1 bg-brand-card text-fy-soft text-xs rounded"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingId(d.id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg"
                      >
                        Resolver / Rechazar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm bg-brand-card text-fy-soft rounded-lg disabled:opacity-30"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-fy-dim">
            Pág {page} de {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm bg-brand-card text-fy-soft rounded-lg disabled:opacity-30"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
