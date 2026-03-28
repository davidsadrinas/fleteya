type ChatMessage = {
  id: string;
  body: string;
  created_at: string;
};

type ChatPanelProps = {
  messages: ChatMessage[];
  chatText: string;
  quickMessages: string[];
  onChatTextChange: (value: string) => void;
  onSendMessage: (message: string, quickTag?: string) => void | Promise<void>;
};

export function ChatPanel({
  messages,
  chatText,
  quickMessages,
  onChatTextChange,
  onSendMessage,
}: ChatPanelProps) {
  return (
    <section className="rounded-xl border border-fy-border p-4 bg-brand-card/20 mt-4">
      <p className="text-sm font-semibold mb-2">Chat in-app</p>
      <div className="max-h-44 overflow-y-auto space-y-2 pr-1 mb-3">
        {messages.length ? (
          messages.map((msg) => (
            <div key={msg.id} className="rounded-md border border-fy-border p-2">
              <p className="text-xs text-fy-text">{msg.body}</p>
              <p className="text-[10px] text-fy-dim">
                {new Date(msg.created_at).toLocaleTimeString("es-AR")}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-fy-dim">Todavía no hay mensajes.</p>
        )}
      </div>
      <div className="flex gap-2 mb-2">
        {quickMessages.map((quick) => (
          <button
            key={quick}
            type="button"
            className="rounded-md border border-fy-border px-2 py-1 text-[11px] text-fy-soft"
            onClick={() => void onSendMessage(quick, quick)}
          >
            {quick}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={chatText}
          onChange={(e) => onChatTextChange(e.target.value)}
          placeholder="Escribí un mensaje"
          className="input flex-1 text-xs py-2"
        />
        <button
          type="button"
          className="rounded-md border border-brand-teal/30 bg-brand-teal/10 px-3 py-1.5 text-xs"
          onClick={() => void onSendMessage(chatText)}
        >
          Enviar
        </button>
      </div>
    </section>
  );
}
