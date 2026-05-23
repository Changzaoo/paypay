import { Search, X } from "lucide-react";
import { useOrderStore } from "../store/orderStore";

const statuses = [
  ["", "Todos"],
  ["WAITING_PAYMENT", "Pendente"],
  ["PAYMENT_CONFIRMED", "Confirmado"],
  ["WAITING_MANUAL_STEP", "Manual"],
  ["FINAL_PROCESSING", "Processando"],
  ["COMPLETED", "Concluído"],
  ["FAILED", "Erro"]
];

const assets = [["", "Ativo"], ["ETH", "ETH"], ["BTC", "BTC"], ["USDT", "USDT"]];
const networks = [["", "Rede"], ["bitcoin", "Bitcoin"], ["ethereum", "Ethereum"], ["arbitrum", "Arbitrum"], ["base", "Base"], ["polygon", "Polygon"], ["bsc", "BSC"]];

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
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-white/10 bg-base-900 p-4 md:grid-cols-[1fr_150px_130px_130px_120px_120px_auto]">
      <label className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={filters.search}
          onChange={(event) => change("search", event.target.value)}
          placeholder="ID, endereço ou cliente"
          className="h-10 w-full rounded-lg border border-white/10 bg-base-950 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-400/60"
        />
      </label>
      <select value={filters.status} onChange={(event) => change("status", event.target.value)} className="h-10 rounded-lg border border-white/10 bg-base-950 px-3 text-sm text-white outline-none focus:border-blue-400/60">
        {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select value={filters.asset} onChange={(event) => change("asset", event.target.value)} className="h-10 rounded-lg border border-white/10 bg-base-950 px-3 text-sm text-white outline-none focus:border-blue-400/60">
        {assets.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select value={filters.network} onChange={(event) => change("network", event.target.value)} className="h-10 rounded-lg border border-white/10 bg-base-950 px-3 text-sm text-white outline-none focus:border-blue-400/60">
        {networks.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <input type="date" value={filters.dateFrom} onChange={(event) => change("dateFrom", event.target.value)} className="h-10 rounded-lg border border-white/10 bg-base-950 px-3 text-sm text-white outline-none focus:border-blue-400/60" />
      <input type="date" value={filters.dateTo} onChange={(event) => change("dateTo", event.target.value)} className="h-10 rounded-lg border border-white/10 bg-base-950 px-3 text-sm text-white outline-none focus:border-blue-400/60" />
      <div className="flex gap-2">
        <button type="submit" className="h-10 rounded-lg bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-400">Filtrar</button>
        <button type="button" onClick={() => { clearFilters(); window.setTimeout(load, 0); }} className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5" title="Limpar">
          <X size={16} />
        </button>
      </div>
    </form>
  );
}
