const assets = ["ETH", "BTC", "USDT"];

export default function AssetSelector({ value, onChange }) {
  return (
    <div className="inline-grid grid-cols-3 overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      {assets.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`h-9 min-w-20 rounded-md px-3 text-sm font-semibold transition ${value === item ? "bg-white text-base-950 shadow-[0_8px_24px_rgba(255,255,255,0.12)]" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
