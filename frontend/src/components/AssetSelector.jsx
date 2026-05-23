const assets = ["ETH", "BTC", "USDT"];

export default function AssetSelector({ value, onChange }) {
  return (
    <div className="ios-control inline-grid grid-cols-3 overflow-hidden p-1">
      {assets.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`h-9 min-w-20 rounded-full px-3 text-sm font-semibold transition ${value === item ? "bg-white text-base-950 shadow-[0_8px_24px_rgba(255,255,255,0.12)]" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
