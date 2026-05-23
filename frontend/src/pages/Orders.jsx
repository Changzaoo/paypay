import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import OrderFilters from "../components/OrderFilters";
import OrderTable from "../components/OrderTable";
import { useOrderStore } from "../store/orderStore";

export default function Orders() {
  const items = useOrderStore((state) => state.items);
  const loading = useOrderStore((state) => state.loading);
  const load = useOrderStore((state) => state.load);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Operações</h2>
          <p className="mt-1 text-sm text-slate-500">Busca e acompanhamento do histórico.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-medium text-slate-100 transition hover:bg-white/10">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>
      <OrderFilters />
      <OrderTable items={items} />
    </div>
  );
}
