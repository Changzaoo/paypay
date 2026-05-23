const tone = {
  CREATED: "border-white/10 bg-white/[0.06] text-slate-100",
  WAITING_PAYMENT: "border-amber-200/25 bg-amber-300/10 text-amber-100",
  PAYMENT_CONFIRMED: "border-blue-200/25 bg-blue-300/10 text-blue-100",
  WAITING_INTERMEDIATE_SETTLEMENT: "border-amber-200/25 bg-amber-300/10 text-amber-100",
  INTERMEDIATE_RECEIVED: "border-blue-200/25 bg-blue-300/10 text-blue-100",
  WAITING_MANUAL_STEP: "border-amber-200/25 bg-amber-300/10 text-amber-100",
  INTERMEDIATE_CONVERSION_STARTED: "border-blue-200/25 bg-blue-300/10 text-blue-100",
  INTERMEDIATE_CONVERSION_DONE: "border-blue-200/25 bg-blue-300/10 text-blue-100",
  FINAL_SHIFT_CREATED: "border-blue-200/25 bg-blue-300/10 text-blue-100",
  WAITING_FINAL_DEPOSIT: "border-amber-200/25 bg-amber-300/10 text-amber-100",
  FINAL_PROCESSING: "border-blue-200/25 bg-blue-300/10 text-blue-100",
  COMPLETED: "border-emerald-200/25 bg-emerald-300/10 text-emerald-100",
  FAILED: "border-red-200/25 bg-red-300/10 text-red-100",
  EXPIRED: "border-white/10 bg-white/[0.05] text-slate-300",
  REFUNDED: "border-white/10 bg-white/[0.05] text-slate-300",
  CANCELLED: "border-white/10 bg-white/[0.05] text-slate-300"
};

const label = {
  CREATED: "Criado",
  WAITING_PAYMENT: "Pendente",
  PAYMENT_CONFIRMED: "Confirmado",
  WAITING_INTERMEDIATE_SETTLEMENT: "Liquidacao",
  INTERMEDIATE_RECEIVED: "Recebido",
  WAITING_MANUAL_STEP: "Manual",
  INTERMEDIATE_CONVERSION_STARTED: "Processando",
  INTERMEDIATE_CONVERSION_DONE: "Processado",
  FINAL_SHIFT_CREATED: "Destino",
  WAITING_FINAL_DEPOSIT: "Aguardando",
  FINAL_PROCESSING: "Processando",
  COMPLETED: "Concluido",
  FAILED: "Erro",
  EXPIRED: "Expirado",
  REFUNDED: "Estornado",
  CANCELLED: "Cancelado"
};

export default function StatusBadge({ value }) {
  return (
    <span className={`inline-flex min-w-24 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl ${tone[value] || tone.CREATED}`}>
      {label[value] || value || "-"}
    </span>
  );
}
