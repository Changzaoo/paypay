import { BadgeCheck, Check, Circle, Clock3, CreditCard, Loader2, Radio, ReceiptText, RefreshCw, Send, ShieldCheck, X } from "lucide-react";

const meta = {
  CREATED: { icon: ReceiptText, caption: "Registro iniciado" },
  WAITING_PAYMENT: { icon: CreditCard, caption: "Aguardando entrada" },
  PAYMENT_CONFIRMED: { icon: BadgeCheck, caption: "Entrada confirmada" },
  WAITING_INTERMEDIATE_SETTLEMENT: { icon: Clock3, caption: "Aguardando liquidacao" },
  INTERMEDIATE_CONVERSION_STARTED: { icon: RefreshCw, caption: "Processamento em andamento" },
  INTERMEDIATE_CONVERSION_DONE: { icon: RefreshCw, caption: "Processamento concluido" },
  FINAL_SHIFT_CREATED: { icon: Radio, caption: "Destino preparado" },
  WAITING_FINAL_DEPOSIT: { icon: Send, caption: "Envio em andamento" },
  FINAL_PROCESSING: { icon: Send, caption: "Envio em processamento" },
  WAITING_MANUAL_STEP: { icon: Clock3, caption: "Aguardando acao" },
  COMPLETED: { icon: ShieldCheck, caption: "Operacao finalizada" }
};

const stateStyle = {
  done: {
    card: "border-white/15 bg-white/[0.07]",
    icon: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200",
    text: "text-white",
    caption: "text-emerald-200/80",
    chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
    mark: <Check size={14} />
  },
  current: {
    card: "border-blue-300/35 bg-blue-300/[0.08] shadow-[0_18px_50px_rgba(56,132,255,0.14)]",
    icon: "border-blue-300/40 bg-blue-300/15 text-blue-100",
    text: "text-white",
    caption: "text-blue-100/80",
    chip: "border-blue-300/35 bg-blue-300/10 text-blue-100",
    mark: <Loader2 size={14} className="animate-spin" />
  },
  pending: {
    card: "border-white/10 bg-white/[0.035]",
    icon: "border-white/10 bg-white/[0.04] text-slate-500",
    text: "text-slate-400",
    caption: "text-slate-600",
    chip: "border-white/10 bg-white/[0.03] text-slate-500",
    mark: <Circle size={14} />
  },
  error: {
    card: "border-red-300/35 bg-red-400/[0.08]",
    icon: "border-red-300/35 bg-red-400/15 text-red-100",
    text: "text-white",
    caption: "text-red-100/80",
    chip: "border-red-300/35 bg-red-400/10 text-red-100",
    mark: <X size={14} />
  }
};

const label = {
  done: "Concluido",
  current: "Agora",
  pending: "Pendente",
  error: "Atencao"
};

export default function Timeline({ items = [] }) {
  const rows = Array.isArray(items) ? items : [];
  const done = rows.filter((item) => item.state === "done").length;
  const current = rows.some((item) => item.state === "current") ? 1 : 0;
  const progress = rows.length ? Math.round(((done + current * 0.5) / rows.length) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="ios-surface p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Progresso</div>
            <div className="mt-1 text-2xl font-semibold text-white">{progress}%</div>
          </div>
          <div className="text-right text-sm text-slate-400">{done} de {rows.length} etapas</div>
        </div>
        <div className="timeline-track mt-4 h-3 rounded-full bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="timeline-fill h-full rounded-full brand-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {rows.map((item) => {
          const stage = meta[item.key] || { icon: Circle, caption: "Etapa operacional" };
          const Icon = stage.icon;
          const style = stateStyle[item.state] || stateStyle.pending;
          return (
            <article key={item.key || item.label} className={`rounded-[22px] border p-4 transition ${style.card} ${item.state === "current" ? "timeline-current" : ""}`}>
              <div className="flex items-start gap-3">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-[16px] border ${style.icon}`}>
                  <Icon size={21} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold ${style.text}`}>{item.label}</div>
                  <div className={`mt-1 text-xs ${style.caption}`}>{stage.caption}</div>
                </div>
                <div className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2 text-xs font-medium ${style.chip}`}>
                  {style.mark}
                  {label[item.state] || "Pendente"}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
