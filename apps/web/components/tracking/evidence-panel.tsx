type ShipmentEvidence = {
  id: string;
  stage: "pickup" | "delivery";
  file_url: string;
  created_at: string;
};

type EvidencePanelProps = {
  evidence: ShipmentEvidence[];
  onUploadEvidence: (stage: "pickup" | "delivery", file: File) => void | Promise<void>;
  onOpenEvidence: (pathOrUrl: string) => void | Promise<void>;
};

export function EvidencePanel({
  evidence,
  onUploadEvidence,
  onOpenEvidence,
}: EvidencePanelProps) {
  return (
    <section className="rounded-xl border border-fy-border p-4 bg-brand-card/20 mt-4">
      <p className="text-sm font-semibold mb-2">Evidencia pre / post carga</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="text-xs text-fy-soft">
          Retiro (pre-carga)
          <input
            type="file"
            accept="image/*"
            className="block mt-1 text-[11px]"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUploadEvidence("pickup", file);
            }}
          />
        </label>
        <label className="text-xs text-fy-soft">
          Entrega (post-carga)
          <input
            type="file"
            accept="image/*"
            className="block mt-1 text-[11px]"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUploadEvidence("delivery", file);
            }}
          />
        </label>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {evidence.length ? (
          evidence.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void onOpenEvidence(item.file_url)}
              className="block rounded-md border border-fy-border p-2 text-xs"
            >
              {item.stage === "pickup" ? "Pre-carga" : "Post-carga"} ·{" "}
              {new Date(item.created_at).toLocaleString("es-AR")}
            </button>
          ))
        ) : (
          <p className="text-xs text-fy-dim">Sin evidencia cargada.</p>
        )}
      </div>
    </section>
  );
}
