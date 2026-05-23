import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AddressInput from "../components/AddressInput";
import AssetSelector from "../components/AssetSelector";
import NetworkSelector from "../components/NetworkSelector";
import QRPaymentCard from "../components/QRPaymentCard";
import StatusBadge from "../components/StatusBadge";
import { useOrderStore } from "../store/orderStore";

const routeMap = {
  ETH: ["ethereum", "arbitrum", "base"],
  BTC: ["bitcoin"],
  USDT: ["ethereum", "arbitrum", "base", "polygon", "bsc"]
};

export default function NewOrder() {
  const create = useOrderStore((state) => state.create);
  const fetchStatus = useOrderStore((state) => state.fetchStatus);
  const loading = useOrderStore((state) => state.loading);
  const error = useOrderStore((state) => state.error);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    amountBrl: "",
    customerName: "",
    customerEmail: "",
    customerDocument: "",
    customerPhone: "",
    outputAsset: "ETH",
    outputNetwork: "ethereum",
    outputAddress: "",
    refundAddress: ""
  });
  const allowed = useMemo(() => routeMap[form.outputAsset] || [], [form.outputAsset]);
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const changeAsset = (value) => setForm((current) => ({ ...current, outputAsset: value, outputNetwork: routeMap[value][0] }));
  useEffect(() => {
    if (!result?.publicId) return undefined;
    const timer = window.setInterval(async () => {
      const data = await fetchStatus(result.publicId);
      if (data) setResult(data);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [result?.publicId, fetchStatus]);
  const submit = async (event) => {
    event.preventDefault();
    const data = await create({ ...form, amountBrl: Number(form.amountBrl) });
    setResult(data);
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_520px]">
      <form onSubmit={submit} className="space-y-6 rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
        <div>
          <h2 className="text-lg font-semibold text-white">Nova operaÃ§Ã£o</h2>
          <p className="mt-1 text-sm text-slate-500">Preencha os dados necessÃ¡rios para gerar a entrada.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Valor em BRL</span>
            <input
              type="number"
              min="10"
              step="0.01"
              required
              value={form.amountBrl}
              onChange={(event) => change("amountBrl", event.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none transition focus:border-blue-300/60"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Cliente</span>
            <input value={form.customerName} onChange={(event) => change("customerName", event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none transition focus:border-blue-300/60" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Email</span>
            <input type="email" value={form.customerEmail} onChange={(event) => change("customerEmail", event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none transition focus:border-blue-300/60" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">CPF</span>
            <input value={form.customerDocument} onChange={(event) => change("customerDocument", event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none transition focus:border-blue-300/60" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-300">Telefone</span>
            <input value={form.customerPhone} onChange={(event) => change("customerPhone", event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none transition focus:border-blue-300/60" />
          </label>
        </div>
        <div className="grid gap-4">
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-300">Ativo final</span>
            <AssetSelector value={form.outputAsset} onChange={changeAsset} />
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-300">Rede final</span>
            <NetworkSelector value={form.outputNetwork} onChange={(value) => change("outputNetwork", value)} allowed={allowed} />
          </div>
          <AddressInput label="EndereÃ§o final" value={form.outputAddress} onChange={(value) => change("outputAddress", value)} />
          <AddressInput label="EndereÃ§o de retorno" value={form.refundAddress} onChange={(value) => change("refundAddress", value)} />
        </div>
        {error && <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        <button type="submit" disabled={loading} className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-base-950 shadow-[0_12px_36px_rgba(255,255,255,0.12)] transition hover:bg-slate-100 disabled:opacity-60">
          {loading ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}
          Gerar cobranÃ§a
        </button>
      </form>
      <aside className="space-y-4">
        {result ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-sm text-white">{result.publicId}</div>
              <StatusBadge value={result.status} />
            </div>
            <QRPaymentCard order={result} />
            <Link to={`/orders/${result.publicId}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-medium text-slate-100 transition hover:bg-white/10">
              Abrir detalhe
              <ArrowRight size={16} />
            </Link>
          </>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 text-sm text-slate-500 shadow-glass backdrop-blur-xl">A cobranÃ§a serÃ¡ exibida aqui.</div>
        )}
      </aside>
    </div>
  );
}
