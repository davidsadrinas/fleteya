type ShipmentDispute = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
};

type DisputesPanelProps = {
  disputes: ShipmentDispute[];
  disputeReason: string;
  disputeDetail: string;
  onReasonChange: (value: string) => void;
  onDetailChange: (value: string) => void;
  onReport: () => void | Promise<void>;
};

export function DisputesPanel({
  disputes,
  disputeReason,
  disputeDetail,
  onReasonChange,
  onDetailChange,
  onReport,
}: DisputesPanelProps) {
  return (
    <section className="rounded-xl border border-fy-border p-4 bg-brand-card/20 mt-4">
      <p className="text-sm font-semibold mb-2">Reportar problema / disputa</p>
      <div className="space-y-2">
        <select
          className="input text-xs"
          value={disputeReason}
          onChange={(e) => onReasonChange(e.target.value)}
        >
          <option>Diferencia de precio</option>
          <option>Carga dañada</option>
          <option>Fletero no se presentó</option>
          <option>Demora excesiva</option>
          <option>Otro</option>
        </select>
        <textarea
          className="input min-h-20 text-xs"
          placeholder="Describí el problema"
          value={disputeDetail}
          onChange={(e) => onDetailChange(e.target.value)}
        />
        <button
          type="button"
          className="rounded-md border border-brand-error/40 bg-brand-error/10 px-3 py-1.5 text-xs text-brand-error"
          onClick={() => void onReport()}
        >
          Reportar problema
        </button>
      </div>
      <div className="mt-3 space-y-2 max-h-28 overflow-y-auto">
        {disputes.length ? (
          disputes.map((ticket) => (
            <div key={ticket.id} className="rounded-md border border-fy-border p-2">
              <p className="text-xs text-fy-text">{ticket.reason}</p>
              <p className="text-[10px] text-fy-dim">
                {ticket.status} · {new Date(ticket.created_at).toLocaleString("es-AR")}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-fy-dim">Sin tickets activos.</p>
        )}
      </div>
    </section>
  );
}
