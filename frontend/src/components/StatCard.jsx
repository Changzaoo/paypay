export default function StatCard({ label, value, detail, accent = "blue" }) {
  const colors = {
    blue: "text-blue-100",
    green: "text-emerald-100",
    yellow: "text-amber-100",
    red: "text-red-100",
    slate: "text-white"
  };
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-glass backdrop-blur-xl">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-3 text-2xl font-semibold tracking-tight ${colors[accent] || colors.blue}`}>{value}</div>
      {detail && <div className="mt-2 text-sm text-slate-400">{detail}</div>}
    </div>
  );
}
