import { ArrowUpRight, CalendarClock, CircleDollarSign, ExternalLink, Hash, Route, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useViewport } from "../hooks/useViewport";
import { compactDate, money, shortHash, shortId } from "../lib/format";
import { finalRoute, flowRoute, progressForStatus, stepForStatus } from "../lib/progress";
import StatusBadge from "./StatusBadge";

function ProgressLine({ item }) {
  const progress = progressForStatus(item.status);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-300">{stepForStatus(item.status)}</span>
        <span className="font-mono text-slate-500">{progress}%</span>
      </div>
      <div className="timeline-track h-2.5 rounded-full bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="timeline-fill h-full rounded-full brand-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="ios-surface grid min-h-64 place-items-center px-4 py-12 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-[18px] border border-white/10 bg-white/[0.04] text-slate-400">
          <Route size={22} />
        </div>
        <div className="mt-4 text-sm font-semibold text-white">Nenhuma operacao encontrada</div>
        <div className="mt-1 text-sm text-slate-500">Ajuste os filtros ou crie uma nova operacao.</div>
      </div>
    </div>
  );
}

function MobileCard({ item }) {
  return (
    <article className="ios-surface overflow-hidden">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
              <Hash size={13} />
              {shortId(item.publicId)}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{money(item.amountBrl)}</div>
            <div className="mt-1 truncate text-sm text-slate-500">{compactDate(item.createdAt)}</div>
          </div>
          <StatusBadge value={item.status} />
        </div>
        <div className="mt-4">
          <ProgressLine item={item} />
        </div>
      </div>
      <div className="grid gap-3 p-4">
        <div className="rounded-[18px] border border-white/10 bg-white/[0.035] p-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Route size={14} />
            Fluxo
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-100">{flowRoute(item)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[18px] border border-white/10 bg-white/[0.035] p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <Wallet size={14} />
              Destino
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-100">{finalRoute(item)}</div>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-white/[0.035] p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <ExternalLink size={14} />
              Tx final
            </div>
            <div className="mt-2 font-mono text-xs text-slate-100">{shortHash(item.settlement?.txid)}</div>
          </div>
        </div>
        <Link to={`/orders/${item.publicId || item.id}`} className="ios-button-secondary inline-flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold transition hover:bg-white/10">
          Detalhes
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}

export default function OrderTable({ items = [] }) {
  const viewport = useViewport();
  const rows = Array.isArray(items) ? items : [];
  if (!rows.length) return <EmptyState />;
  if (!viewport.isDesktop) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((item) => <MobileCard key={item.id || item.publicId} item={item} />)}
      </div>
    );
  }
  return (
    <div className="ios-surface overflow-hidden">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="grid grid-cols-[1.2fr_1.1fr_1.6fr_1.5fr_1fr_52px] gap-4 text-xs font-medium uppercase tracking-wide text-slate-500">
          <div>Operacao</div>
          <div>Valor</div>
          <div>Fluxo</div>
          <div>Progresso</div>
          <div>Registro</div>
          <div />
        </div>
      </div>
      <div className="divide-y divide-white/10">
        {rows.map((item) => (
          <article key={item.id || item.publicId} className="grid grid-cols-[1.2fr_1.1fr_1.6fr_1.5fr_1fr_52px] items-center gap-4 px-4 py-4 text-sm text-slate-300 transition hover:bg-white/[0.035]">
            <div className="min-w-0">
              <div className="font-mono text-xs text-white">{shortId(item.publicId)}</div>
              <div className="mt-2"><StatusBadge value={item.status} /></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-base font-semibold text-white">
                <CircleDollarSign size={17} className="text-slate-500" />
                {money(item.amountBrl)}
              </div>
              <div className="mt-1 text-xs text-slate-500">{item.customerName || "Cliente nao informado"}</div>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-100">{flowRoute(item)}</div>
              <div className="mt-1 truncate text-xs text-slate-500">{finalRoute(item)}</div>
            </div>
            <ProgressLine item={item} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CalendarClock size={14} />
                {compactDate(item.createdAt)}
              </div>
              <div className="mt-2 font-mono text-xs text-slate-300">{shortHash(item.settlement?.txid)}</div>
            </div>
            <div className="text-right">
              <Link to={`/orders/${item.publicId || item.id}`} className="ios-button-secondary inline-grid h-10 w-10 place-items-center text-slate-300 transition hover:bg-white/10 hover:text-white" title="Detalhes">
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
