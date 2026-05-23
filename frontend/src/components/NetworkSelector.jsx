const networks = [
  { value: "bitcoin", label: "Bitcoin" },
  { value: "ethereum", label: "Ethereum" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "base", label: "Base" },
  { value: "polygon", label: "Polygon" },
  { value: "bsc", label: "BSC" }
];

export default function NetworkSelector({ value, onChange, allowed = networks.map((item) => item.value) }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {networks.filter((item) => allowed.includes(item.value)).map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`h-10 rounded-full border px-3 text-sm font-medium transition ${value === item.value ? "border-blue-200/35 bg-blue-300/10 text-blue-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "border-white/10 bg-white/[0.045] text-slate-300 hover:bg-white/10"}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
