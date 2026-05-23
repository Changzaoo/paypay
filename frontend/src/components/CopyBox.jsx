import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CopyBox({ value, label = "Código" }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setDone(true);
    window.setTimeout(() => setDone(false), 1400);
  };
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="ios-control flex min-h-12 items-stretch overflow-hidden">
        <div className="min-w-0 flex-1 px-3 py-3 text-sm text-slate-200">
          <div className="truncate">{value || "-"}</div>
        </div>
        <button
          type="button"
          onClick={copy}
          className="grid w-12 place-items-center border-l border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white"
          title="Copiar"
        >
          {done ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>
    </div>
  );
}
