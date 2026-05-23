const tone = {
  CREATED: "border-slate-500/40 bg-slate-500/10 text-slate-200",
  WAITING_PAYMENT: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  PAYMENT_CONFIRMED: "border-blue-400/40 bg-blue-400/10 text-blue-200",
  WAITING_INTERMEDIATE_SETTLEMENT: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  INTERMEDIATE_RECEIVED: "border-blue-400/40 bg-blue-400/10 text-blue-200",
  WAITING_MANUAL_STEP: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  INTERMEDIATE_CONVERSION_STARTED: "border-blue-400/40 bg-blue-400/10 text-blue-200",
  INTERMEDIATE_CONVERSION_DONE: "border-blue-400/40 bg-blue-400/10 text-blue-200",
  FINAL_SHIFT_CREATED: "border-blue-400/40 bg-blue-400/10 text-blue-200",
  WAITING_FINAL_DEPOSIT: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  FINAL_PROCESSING: "border-blue-400/40 bg-blue-400/10 text-blue-200",
  COMPLETED: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  FAILED: "border-red-400/40 bg-red-400/10 text-red-200",
  EXPIRED: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  REFUNDED: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  CANCELLED: "border-slate-500/40 bg-slate-500/10 text-slate-300"
};

const label = {
  CREATED: "Criado",
  WAITING_PAYMENT: "Pendente",
  PAYMENT_CONFIRMED: "Confirmado",
  WAITING_INTERMEDIATE_SETTLEMENT: "Liquidação",
  INTERMEDIATE_RECEIVED: "Recebido",
  WAITING_MANUAL_STEP: "Manual",
  INTERMEDIATE_CONVERSION_STARTED: "Processando",
  INTERMEDIATE_CONVERSION_DONE: "Processado",
  FINAL_SHIFT_CREATED: "Destino",
  WAITING_FINAL_DEPOSIT: "Aguardando",
  FINAL_PROCESSING: "Processando",
  COMPLETED: "Concluído",
  FAILED: "Erro",
  EXPIRED: "Expirado",
  REFUNDED: "Estornado",
  CANCELLED: "Cancelado"
};

export default function StatusBadge({ value }) {
  return (
    <span className={`inline-flex min-w-24 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone[value] || tone.CREATED}`}>
      {label[value] || value || "-"}
    </span>
  );
}
