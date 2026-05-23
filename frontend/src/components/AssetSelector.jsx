const assets = ["ETH", "BTC", "USDT"];

export default function AssetSelector({ value, onChange }) {
  return (
    <div className="inline-grid grid-cols-3 overflow-hidden rounded-lg border border-white/10 bg-base-950 p-1">
      {assets.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`h-9 min-w-20 rounded-md px-3 text-sm font-semibold transition ${value === item ? "bg-white text-base-950" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
