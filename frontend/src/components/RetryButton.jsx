import { RotateCw } from "lucide-react";
import { useState } from "react";

export default function RetryButton({ onRetry, disabled }) {
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      await onRetry();
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={submit}
      disabled={disabled || loading}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-base-850 px-3 text-sm font-medium text-slate-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RotateCw size={16} className={loading ? "animate-spin" : ""} />
      Tentar novamente
    </button>
  );
}
