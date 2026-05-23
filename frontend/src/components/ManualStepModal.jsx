import { X } from "lucide-react";
import { useState } from "react";

export default function ManualStepModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    intermediateReceivedAmount: "",
    intermediateTxid: "",
    intermediateNote: ""
  });
  const [loading, setLoading] = useState(false);
  if (!open) return null;
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        intermediateReceivedAmount: Number(form.intermediateReceivedAmount)
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-lg border border-white/10 bg-base-900 p-5 shadow-panel">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-white">Atualizar etapa</div>
            <div className="text-sm text-slate-500">Informe os dados recebidos para continuar.</div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white" title="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Valor recebido</span>
            <input
              type="number"
              step="0.00000001"
              min="0"
              required
              value={form.intermediateReceivedAmount}
              onChange={(event) => change("intermediateReceivedAmount", event.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-base-950 px-3 text-sm text-white outline-none focus:border-blue-400/60"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Comprovante</span>
            <input
              required
              value={form.intermediateTxid}
              onChange={(event) => change("intermediateTxid", event.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-base-950 px-3 text-sm text-white outline-none focus:border-blue-400/60"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Observação</span>
            <textarea
              value={form.intermediateNote}
              onChange={(event) => change("intermediateNote", event.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-base-950 px-3 py-3 text-sm text-white outline-none focus:border-blue-400/60"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-white/10 px-4 text-sm font-medium text-slate-300 transition hover:bg-white/5">Cancelar</button>
          <button type="submit" disabled={loading} className="h-10 rounded-lg bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
