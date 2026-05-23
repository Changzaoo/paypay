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
      className="ios-button-secondary inline-flex h-10 items-center gap-2 px-4 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RotateCw size={16} className={loading ? "animate-spin" : ""} />
      Tentar novamente
    </button>
  );
}
