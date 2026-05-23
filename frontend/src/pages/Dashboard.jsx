import { useEffect, useMemo } from "react";
import BrandMark from "../components/BrandMark";
import OrderTable from "../components/OrderTable";
import StatCard from "../components/StatCard";
import { money } from "../lib/format";
import { useOrderStore } from "../store/orderStore";

export default function Dashboard() {
  const rawItems = useOrderStore((state) => state.items);
  const load = useOrderStore((state) => state.load);
  const items = Array.isArray(rawItems) ? rawItems : [];
  useEffect(() => {
    load();
  }, [load]);
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayItems = items.filter((item) => item.createdAt?.slice(0, 10) === today);
    const completed = items.filter((item) => item.status === "COMPLETED");
    const pending = items.filter((item) => !["COMPLETED", "FAILED", "EXPIRED", "REFUNDED", "CANCELLED"].includes(item.status));
    const failed = items.filter((item) => item.status === "FAILED");
    const totalToday = todayItems.reduce((sum, item) => sum + Number(item.amountBrl || 0), 0);
    const byNetwork = items.reduce((acc, item) => {
      const key = item.outputNetwork || "rede";
      acc[key] = (acc[key] || 0) + Number(item.amountBrl || 0);
      return acc;
    }, {});
    const volume = Object.entries(byNetwork).sort((a, b) => b[1] - a[1])[0];
    const avg = completed.length
      ? completed.reduce((sum, item) => sum + Math.max(0, new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime()), 0) / completed.length / 60000
      : 0;
    return { totalToday, completed, pending, failed, volume, avg };
  }, [items]);
  return (
    <div className="space-y-6">
      <section className="ios-surface flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">Visao geral</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Operacoes</h1>
        </div>
        <BrandMark className="h-12" />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total hoje" value={money(stats.totalToday)} accent="green" />
        <StatCard label="Pendentes" value={stats.pending.length} accent="yellow" />
        <StatCard label="Concluídas" value={stats.completed.length} accent="green" />
        <StatCard label="Com erro" value={stats.failed.length} accent="red" />
        <StatCard label="Volume destino" value={stats.volume ? money(stats.volume[1]) : "-"} detail={stats.volume?.[0]} accent="blue" />
        <StatCard label="Tempo médio" value={stats.avg ? `${Math.round(stats.avg)} min` : "-"} accent="slate" />
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Histórico recente</h2>
        </div>
        <OrderTable items={items.slice(0, 8)} />
      </section>
    </div>
  );
}
