export default function StatCard({ label, value, detail, accent = "blue" }) {
  const colors = {
    blue: "text-blue-200",
    green: "text-emerald-200",
    yellow: "text-amber-200",
    red: "text-red-200",
    slate: "text-slate-200"
  };
  return (
    <div className="rounded-lg border border-white/10 bg-base-900 p-4 shadow-panel">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-3 text-2xl font-semibold ${colors[accent] || colors.blue}`}>{value}</div>
      {detail && <div className="mt-2 text-sm text-slate-400">{detail}</div>}
    </div>
  );
}
