import { ArrowRight, Badge, Banknote, ChevronDown, Loader2, Mail, Phone, RotateCcw, User, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import QRPaymentCard from "../components/QRPaymentCard";
import StatusBadge from "../components/StatusBadge";
import { useOrderStore } from "../store/orderStore";

const routeMap = {
  ETH: ["ethereum", "arbitrum", "base"],
  BTC: ["bitcoin"],
  USDT: ["ethereum", "arbitrum", "base", "polygon", "bsc"]
};

const assetText = {
  ETH: "ETH",
  BTC: "BTC",
  USDT: "USDT"
};

const networkText = {
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
  arbitrum: "Arbitrum",
  base: "Base",
  polygon: "Polygon",
  bsc: "BSC"
};

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <div className="ios-control flex min-h-12 items-center gap-3 px-3">
        <Icon size={18} className="shrink-0 text-slate-500" />
        {children}
      </div>
    </label>
  );
}

function Input({ value, onChange, type = "text", required = false, placeholder = "", inputMode }) {
  return (
    <input
      type={type}
      required={required}
      value={value}
      inputMode={inputMode}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
    />
  );
}

export default function NewOrder() {
  const create = useOrderStore((state) => state.create);
  const fetchStatus = useOrderStore((state) => state.fetchStatus);
  const loading = useOrderStore((state) => state.loading);
  const error = useOrderStore((state) => state.error);
  const [advanced, setAdvanced] = useState(false);
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
  const changeAsset = (value) => {
    setForm((current) => ({ ...current, outputAsset: value, outputNetwork: routeMap[value][0] }));
  };
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
      <form onSubmit={submit} className="ios-surface overflow-hidden">
        <div className="border-b border-white/10 p-5">
          <div className="text-sm font-medium text-slate-500">Entrada</div>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white">Nova operacao</h2>
        </div>
        <div className="grid gap-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field icon={Banknote} label="Valor">
              <Input value={form.amountBrl} onChange={(value) => change("amountBrl", value)} type="number" inputMode="decimal" required placeholder="0,00 BRL" />
            </Field>
            <Field icon={User} label="Cliente">
              <Input value={form.customerName} onChange={(value) => change("customerName", value)} placeholder="Nome opcional" />
            </Field>
          </div>
          <section className="ios-list-cell p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Destino</div>
                <div className="text-xs text-slate-500">{assetText[form.outputAsset]} em {networkText[form.outputNetwork]}</div>
              </div>
              <Wallet size={19} className="text-slate-500" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(routeMap).map((asset) => (
                <button
                  key={asset}
                  type="button"
                  onClick={() => changeAsset(asset)}
                  className={`h-12 rounded-full border text-sm font-semibold transition ${form.outputAsset === asset ? "border-white/30 bg-white text-base-950 shadow-[0_12px_36px_rgba(255,255,255,0.12)]" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white"}`}
                >
                  {assetText[asset]}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {allowed.map((network) => (
                <button
                  key={network}
                  type="button"
                  onClick={() => change("outputNetwork", network)}
                  className={`h-11 rounded-full border px-3 text-sm font-medium transition ${form.outputNetwork === network ? "border-blue-200/35 bg-blue-300/10 text-blue-100" : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white"}`}
                >
                  {networkText[network]}
                </button>
              ))}
            </div>
          </section>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">Endereco final</span>
            <div className="ios-control p-3">
              <textarea
                required
                value={form.outputAddress}
                onChange={(event) => change("outputAddress", event.target.value)}
                placeholder="Cole o endereco de recebimento"
                rows={3}
                className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </label>
          <button
            type="button"
            onClick={() => setAdvanced((value) => !value)}
            className="ios-button-secondary flex h-11 items-center justify-between px-4 text-sm font-medium text-slate-300 transition hover:bg-white/10"
          >
            Opcionais
            <ChevronDown size={17} className={`transition ${advanced ? "rotate-180" : ""}`} />
          </button>
          {advanced && (
            <div className="ios-list-cell grid gap-4 p-4 md:grid-cols-2">
              <Field icon={Mail} label="Email">
                <Input value={form.customerEmail} onChange={(value) => change("customerEmail", value)} type="email" />
              </Field>
              <Field icon={Badge} label="Documento">
                <Input value={form.customerDocument} onChange={(value) => change("customerDocument", value)} />
              </Field>
              <Field icon={Phone} label="Telefone">
                <Input value={form.customerPhone} onChange={(value) => change("customerPhone", value)} />
              </Field>
              <Field icon={RotateCcw} label="Retorno">
                <Input value={form.refundAddress} onChange={(value) => change("refundAddress", value)} />
              </Field>
            </div>
          )}
          {error && <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</div>}
          <button type="submit" disabled={loading} className="ios-button-primary inline-flex h-12 w-full items-center justify-center gap-2 px-5 text-sm font-semibold transition hover:bg-slate-100 disabled:opacity-60 sm:w-auto">
            {loading ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}
            Gerar cobranca
          </button>
        </div>
      </form>
      <aside className="space-y-4">
        {result ? (
          <>
            <div className="ios-surface flex items-center justify-between gap-3 p-4">
              <div className="font-mono text-sm text-white">{result.publicId}</div>
              <StatusBadge value={result.status} />
            </div>
            <QRPaymentCard order={result} />
            <Link to={`/orders/${result.publicId}`} className="ios-button-secondary inline-flex h-10 items-center gap-2 px-4 text-sm font-medium transition hover:bg-white/10">
              Abrir detalhe
              <ArrowRight size={16} />
            </Link>
          </>
        ) : (
          <div className="ios-surface p-5 text-sm text-slate-500">A cobranca sera exibida aqui.</div>
        )}
      </aside>
    </div>
  );
}
