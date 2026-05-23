import { AlertTriangle, CheckCircle2, Loader2, Plus, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import OrderFilters from "../components/OrderFilters";
import OrderTable from "../components/OrderTable";
import { money } from "../lib/format";
import { useOrderStore } from "../store/orderStore";

const finalStatuses = ["COMPLETED", "FAILED", "EXPIRED", "REFUNDED", "CANCELLED"];

function SummaryCard({ icon: Icon, label, value, tone = "text-slate-100" }) {
  return (
    <div className="ios-list-cell p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
        <div className="grid h-9 w-9 place-items-center rounded-[14px] border border-white/10 bg-white/[0.04] text-slate-300">
          <Icon size={17} />
        </div>
      </div>
      <div className={`mt-3 text-2xl font-semibold tracking-tight ${tone}`}>{value}</div>
    </div>
  );
}

export default function Orders() {
  const rawItems = useOrderStore((state) => state.items);
  const loading = useOrderStore((state) => state.loading);
  const load = useOrderStore((state) => state.load);
  const items = Array.isArray(rawItems) ? rawItems : [];
  useEffect(() => {
    load();
  }, [load]);
  const stats = useMemo(() => {
    const pending = items.filter((item) => !finalStatuses.includes(item.status));
    const completed = items.filter((item) => item.status === "COMPLETED");
    const failed = items.filter((item) => item.status === "FAILED");
    const total = items.reduce((sum, item) => sum + Number(item.amountBrl || 0), 0);
    return { pending, completed, failed, total };
  }, [items]);
  return (
    <div className="space-y-5">
      <section className="ios-surface overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">Historico operacional</div>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white">Operacoes</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Acompanhe o fluxo de entrada, conversao intermediaria e entrega final.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={load} className="ios-button-secondary inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold transition hover:bg-white/10">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
            <Link to="/new" className="ios-button-primary inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold transition hover:opacity-95">
              <Plus size={16} />
              Nova
            </Link>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={TrendingUp} label="Volume filtrado" value={money(stats.total)} tone="text-white" />
          <SummaryCard icon={Loader2} label="Em andamento" value={stats.pending.length} tone="text-blue-100" />
          <SummaryCard icon={CheckCircle2} label="Concluidas" value={stats.completed.length} tone="text-emerald-100" />
          <SummaryCard icon={AlertTriangle} label="Com erro" value={stats.failed.length} tone="text-red-100" />
        </div>
      </section>
      <OrderFilters />
      <OrderTable items={items} />
    </div>
  );
}
