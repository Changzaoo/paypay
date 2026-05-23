import { Check, Copy, ExternalLink, Pencil, QrCode, ReceiptText, Wallet } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ManualStepModal from "../components/ManualStepModal";
import RetryButton from "../components/RetryButton";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import { compactDate, money, shortHash } from "../lib/format";
import { useAuthStore } from "../store/authStore";
import { useOrderStore } from "../store/orderStore";

function Metric({ label, value }) {
  return (
    <div className="ios-surface px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-100">{value || "-"}</div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-b border-white/10 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`min-w-0 break-words text-sm text-slate-200 sm:max-w-[70%] sm:text-right ${mono ? "font-mono text-xs" : ""}`}>{value || "-"}</div>
    </div>
  );
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <section className="ios-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-blue-200">
              <Icon size={15} />
            </span>
          )}
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(id);
    const timer = window.setInterval(() => fetchStatus(id), 4000);
    return () => window.clearInterval(timer);
  }, [id, fetch, fetchStatus]);

  if (!current) {
    return <div className="ios-surface p-5 text-sm text-slate-500">Carregando operacao...</div>;
  }

  const qrCode = current.input?.qrCode || current.qrCode;
  const qrImageUrl = current.input?.qrImageUrl || current.qrImageUrl;
  const expiresAt = current.input?.expiresAt || current.expiresAt;
  const canRetry = account?.isAdmin && ["FAILED", "WAITING_INTERMEDIATE_SETTLEMENT", "WAITING_MANUAL_STEP", "FINAL_SHIFT_CREATED", "WAITING_FINAL_DEPOSIT", "FINAL_PROCESSING"].includes(current.status);

  const copyCode = async () => {
    if (!qrCode) return;
    await navigator.clipboard.writeText(qrCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="ios-surface p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Detalhes</span>
              <span className="font-mono">{current.publicId}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{money(current.amountBrl)}</h2>
              <StatusBadge value={current.status} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {account?.isAdmin && (
              <button type="button" onClick={() => setModal(true)} className="ios-button-secondary inline-flex h-10 items-center gap-2 px-4 text-sm font-medium transition hover:bg-white/10">
                <Pencil size={16} />
                Marcar etapa
              </button>
            )}
            {canRetry && <RetryButton onRetry={() => retry(current.publicId)} />}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
        <section className="space-y-4">
          <Section title="Entrada PIX" icon={QrCode}>
            <div className="grid gap-4 sm:grid-cols-[170px_minmax(0,1fr)] xl:grid-cols-1">
              <div className="mx-auto grid h-[170px] w-[170px] place-items-center rounded-[24px] border border-white/10 bg-white p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                {qrCode ? <QRCodeCanvas value={qrCode} size={142} includeMargin /> : qrImageUrl ? <img src={qrImageUrl} alt="QR" className="h-36 w-36 object-contain" /> : <div className="text-sm text-slate-500">QR</div>}
              </div>
              <div className="min-w-0 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Valor</div>
                    <div className="mt-1 text-base font-semibold text-white">{money(current.amountBrl)}</div>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Expira</div>
                    <div className="mt-1 text-sm text-slate-200">{compactDate(expiresAt)}</div>
                  </div>
                </div>
                <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Copia e cola</div>
                  <div className="mt-2 truncate font-mono text-xs text-slate-300">{qrCode || "-"}</div>
                  <button type="button" onClick={copyCode} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-medium text-white transition hover:bg-white/10">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copiado" : "Copiar codigo"}
                  </button>
                </div>
              </div>
            </div>
          </Section>

          {current.error && <div className="rounded-[22px] border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">{current.error}</div>}
        </section>

        <section className="space-y-4">
          <Section title="Progresso" icon={ReceiptText}>
            <Timeline items={current.timeline} flow={current} variant="compact" />
          </Section>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Bruto" value={money(current.amountBrl)} />
            <Metric label="Liquido estimado" value={current.settlement?.settleAmount || "-"} />
            <Metric label="Rede" value={current.outputNetwork} />
            <Metric label="Criado" value={compactDate(current.createdAt)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Destino" icon={Wallet}>
              <DetailRow label="Ativo" value={current.outputAsset || current.settlement?.outputAsset} />
              <DetailRow label="Rede" value={current.outputNetwork || current.settlement?.outputNetwork} />
              <DetailRow label="Endereco" value={current.outputAddress || current.settlement?.outputAddress} mono />
            </Section>

            <Section
              title="Rastreamento"
              icon={ExternalLink}
              action={
                current.settlement?.explorerUrl ? (
                  <a href={current.settlement.explorerUrl} target="_blank" rel="noreferrer" className="ios-button-secondary inline-flex h-8 items-center gap-2 px-3 text-xs font-medium transition hover:bg-white/10">
                    Abrir
                    <ExternalLink size={13} />
                  </a>
                ) : null
              }
            >
              <DetailRow label="Entrada" value={current.input?.providerId} mono />
              <DetailRow label="Intermediario" value={current.intermediate?.txid} mono />
              <DetailRow label="Tx final" value={shortHash(current.settlement?.txid)} mono />
            </Section>
          </div>
        </section>
      </div>

      <ManualStepModal open={modal} onClose={() => setModal(false)} onSubmit={(payload) => manual(current.publicId, payload)} />
    </div>
  );
}
