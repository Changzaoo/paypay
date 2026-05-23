import { Check, Circle, Loader2, X } from "lucide-react";

const iconMap = {
  done: <Check size={16} />,
  current: <Loader2 size={16} className="animate-spin" />,
  pending: <Circle size={16} />,
  error: <X size={16} />
};

const colorMap = {
  done: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
  current: "border-blue-400/50 bg-blue-400/10 text-blue-200",
  pending: "border-white/10 bg-white/[0.03] text-slate-500",
  error: "border-red-400/50 bg-red-400/10 text-red-200"
};

export default function Timeline({ items = [] }) {
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <div key={item.key || item.label} className="grid grid-cols-[32px_1fr] gap-3">
          <div className="flex flex-col items-center">
            <div className={`grid h-8 w-8 place-items-center rounded-full border ${colorMap[item.state] || colorMap.pending}`}>
              {iconMap[item.state] || iconMap.pending}
            </div>
            {index < items.length - 1 && <div className="mt-2 h-6 w-px bg-white/10" />}
          </div>
          <div className="pt-1.5 text-sm font-medium text-slate-200">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
