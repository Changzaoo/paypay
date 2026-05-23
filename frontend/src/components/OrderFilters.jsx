import { CalendarDays, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useOrderStore } from "../store/orderStore";

const statuses = [
  ["", "Todos"],
  ["WAITING_PAYMENT", "Pendente"],
  ["PAYMENT_CONFIRMED", "Confirmado"],
  ["WAITING_MANUAL_STEP", "Manual"],
  ["FINAL_PROCESSING", "Processando"],
  ["COMPLETED", "Concluido"],
  ["FAILED", "Erro"]
];

const assets = [["", "Ativo"], ["BTC", "BTC"], ["ETH", "ETH"], ["USDT", "USDT"], ["USDC", "USDC"], ["SOL", "SOL"], ["XMR", "XMR"]];
const networks = [["", "Rede"], ["bitcoin", "Bitcoin"], ["ethereum", "Ethereum"], ["arbitrum", "Arbitrum"], ["base", "Base"], ["polygon", "Polygon"], ["bsc", "BSC"], ["solana", "Solana"], ["tron", "Tron"], ["liquid", "Liquid"]];

function SelectField({ value, onChange, options, label }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="ios-control h-11 w-full px-3 text-sm text-white outline-none focus:border-blue-300/60">
        {options.map(([next, text]) => <option key={next} value={next}>{text}</option>)}
      </select>
    </label>
  );
}

export default function OrderFilters() {
  const filters = useOrderStore((state) => state.filters);
  const setFilters = useOrderStore((state) => state.setFilters);
  const clearFilters = useOrderStore((state) => state.clearFilters);
  const load = useOrderStore((state) => state.load);
  const change = (key, value) => setFilters({ [key]: value });
  const submit = (event) => {
    event.preventDefault();
    load();
  };
  return (
    <form onSubmit={submit} className="ios-surface space-y-4 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1 space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Busca</span>
          <div className="ios-control flex h-12 items-center gap-2 px-3">
            <Search size={17} className="shrink-0 text-slate-500" />
            <input
              value={filters.search}
              onChange={(event) => change("search", event.target.value)}
              placeholder="ID, endereco ou cliente"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>
        </label>
        <div className="grid gap-3 sm:grid-cols-3 lg:w-[460px]">
          <SelectField label="Status" value={filters.status} onChange={(value) => change("status", value)} options={statuses} />
          <SelectField label="Ativo" value={filters.asset} onChange={(value) => change("asset", value)} options={assets} />
          <SelectField label="Rede" value={filters.network} onChange={(value) => change("network", value)} options={networks} />
        </div>
      </div>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <CalendarDays size={13} />
              Inicio
            </span>
            <input type="date" value={filters.dateFrom} onChange={(event) => change("dateFrom", event.target.value)} className="ios-control h-11 w-full px-3 text-sm text-white outline-none focus:border-blue-300/60" />
          </label>
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <CalendarDays size={13} />
              Fim
            </span>
            <input type="date" value={filters.dateTo} onChange={(event) => change("dateTo", event.target.value)} className="ios-control h-11 w-full px-3 text-sm text-white outline-none focus:border-blue-300/60" />
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="ios-button-primary inline-flex h-11 flex-1 items-center justify-center gap-2 px-5 text-sm font-semibold transition hover:opacity-95 sm:flex-none">
            <Filter size={16} />
            Filtrar
          </button>
          <button type="button" onClick={() => { clearFilters(); window.setTimeout(load, 0); }} className="ios-button-secondary inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/10" title="Limpar">
            <X size={16} />
            <span className="sm:hidden">Limpar</span>
          </button>
          <div className="hidden h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm text-slate-500 lg:inline-flex">
            <SlidersHorizontal size={16} />
            Filtros ativos
          </div>
        </div>
      </div>
    </form>
  );
}
