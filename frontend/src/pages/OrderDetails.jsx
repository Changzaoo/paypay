import { ExternalLink, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CopyBox from "../components/CopyBox";
import ManualStepModal from "../components/ManualStepModal";
import QRPaymentCard from "../components/QRPaymentCard";
import RetryButton from "../components/RetryButton";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import { compactDate, money, shortHash } from "../lib/format";
import { useAuthStore } from "../store/authStore";
import { useOrderStore } from "../store/orderStore";

function Field({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-base-900 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 break-words text-sm text-slate-200">{value || "-"}</div>
    </div>
  );
}

export default function OrderDetails() {
  const { id } = useParams();
  const account = useAuthStore((state) => state.account);
  const current = useOrderStore((state) => state.current);
  const fetch = useOrderStore((state) => state.fetch);
  const fetchStatus = useOrderStore((state) => state.fetchStatus);
  const retry = useOrderStore((state) => state.retry);
  const manual = useOrderStore((state) => state.manual);
  const [modal, setModal] = useState(false);
  useEffect(() => {
    fetch(id);
    const timer = window.setInterval(() => fetchStatus(id), 4000);
    return () => window.clearInterval(timer);
  }, [id, fetch, fetchStatus]);
  if (!current) {
    return <div className="rounded-lg border border-white/10 bg-base-900 p-5 text-sm text-slate-500">Carregando operação...</div>;
  }
  const canRetry = account?.isAdmin && ["FAILED", "WAITING_INTERMEDIATE_SETTLEMENT", "WAITING_MANUAL_STEP", "FINAL_SHIFT_CREATED", "WAITING_FINAL_DEPOSIT", "FINAL_PROCESSING"].includes(current.status);
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="font-mono text-sm text-slate-500">{current.publicId}</div>
          <h2 className="mt-1 text-xl font-semibold text-white">{money(current.amountBrl)}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={current.status} />
          {account?.isAdmin && (
            <button type="button" onClick={() => setModal(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-base-850 px-3 text-sm font-medium text-slate-100 transition hover:bg-white/5">
              <Pencil size={16} />
              Marcar etapa
            </button>
          )}
          {canRetry && <RetryButton onRetry={() => retry(current.publicId)} />}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-base-900 p-5">
            <h3 className="mb-4 text-base font-semibold text-white">Progresso</h3>
            <Timeline items={current.timeline} />
          </div>
          {current.error && <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{current.error}</div>}
        </section>
        <section className="space-y-5">
          <QRPaymentCard order={current} />
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Valor bruto" value={money(current.amountBrl)} />
            <Field label="Taxas" value="-" />
            <Field label="Valor líquido estimado" value={current.settlement?.settleAmount || "-"} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Rede final" value={current.outputNetwork} />
            <Field label="Endereço final" value={current.outputAddress} />
            <Field label="Entrada" value={current.input?.providerId} />
            <Field label="Intermediário" value={current.intermediate?.txid} />
            <Field label="Tx final" value={shortHash(current.settlement?.txid)} />
            <Field label="Criado em" value={compactDate(current.createdAt)} />
          </div>
          <CopyBox value={current.input?.qrCode} label="Copia e cola" />
          {current.settlement?.explorerUrl && (
            <a href={current.settlement.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-base-850 px-3 text-sm font-medium text-slate-100 transition hover:bg-white/5">
              <ExternalLink size={16} />
              Comprovante
            </a>
          )}
        </section>
      </div>
      <ManualStepModal open={modal} onClose={() => setModal(false)} onSubmit={(payload) => manual(current.publicId, payload)} />
    </div>
  );
}
