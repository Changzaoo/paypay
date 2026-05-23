import { ArrowRight, Badge, Banknote, ChevronDown, Loader2, LockKeyhole, Mail, Phone, RotateCcw, Search, User, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import QRPaymentCard from "../components/QRPaymentCard";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import { useOrderStore } from "../store/orderStore";

const sourceDefault = { coin: "USDT", network: "liquid", label: "USDT Liquid" };

const fallbackOptions = [
  { coin: "ETH", name: "Ethereum", networks: [{ id: "ethereum", label: "Ethereum" }, { id: "arbitrum", label: "Arbitrum" }, { id: "base", label: "Base" }] },
  { coin: "BTC", name: "Bitcoin", networks: [{ id: "bitcoin", label: "Bitcoin" }] },
  { coin: "USDT", name: "Tether", networks: [{ id: "ethereum", label: "Ethereum" }, { id: "arbitrum", label: "Arbitrum" }, { id: "base", label: "Base" }, { id: "polygon", label: "Polygon" }, { id: "bsc", label: "BSC" }] }
];

const previewTimeline = [
  { key: "CREATED", label: "Criado" },
  { key: "WAITING_PAYMENT", label: "Aguardando pagamento" },
  { key: "PAYMENT_CONFIRMED", label: "Pagamento confirmado" },
  { key: "WAITING_INTERMEDIATE_SETTLEMENT", label: "Liquidacao" },
  { key: "INTERMEDIATE_CONVERSION_STARTED", label: "Conversao intermediaria" },
  { key: "FINAL_SHIFT_CREATED", label: "Conversao final" },
  { key: "WAITING_FINAL_DEPOSIT", label: "Envio" },
  { key: "COMPLETED", label: "Concluido" }
];

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

const stagePreview = (hasOrder) => previewTimeline.map((item, index) => ({
  ...item,
  state: hasOrder ? (index === 0 ? "done" : index === 1 ? "current" : "pending") : (index === 0 ? "current" : "pending")
}));

export default function NewOrder() {
  const create = useOrderStore((state) => state.create);
  const fetchStatus = useOrderStore((state) => state.fetchStatus);
  const loadSettlementOptions = useOrderStore((state) => state.loadSettlementOptions);
  const settlementOptions = useOrderStore((state) => state.settlementOptions);
  const loading = useOrderStore((state) => state.loading);
  const error = useOrderStore((state) => state.error);
  const [advanced, setAdvanced] = useState(false);
  const [query, setQuery] = useState("");
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
    outputMemo: "",
    refundAddress: ""
  });
  const options = useMemo(() => {
    const items = settlementOptions?.items;
    return Array.isArray(items) && items.length ? items : fallbackOptions;
  }, [settlementOptions]);
  const source = settlementOptions?.source || sourceDefault;
  const selectedAsset = options.find((item) => item.coin === form.outputAsset) || options[0];
  const selectedNetwork = selectedAsset?.networks?.find((item) => item.id === form.outputNetwork) || selectedAsset?.networks?.[0];
  const filteredOptions = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return options;
    return options.filter((item) => `${item.coin} ${item.name}`.toLowerCase().includes(text));
  }, [options, query]);
  const timelineItems = result?.timeline?.length ? result.timeline : stagePreview(Boolean(result));
  const timelineFlow = {
    ...result,
    outputAsset: result?.outputAsset || form.outputAsset,
    outputNetwork: result?.outputNetwork || form.outputNetwork,
    outputNetworkLabel: selectedNetwork?.label
  };
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const changeAsset = (item) => {
    const network = item.networks?.[0]?.id || "";
    setForm((current) => ({ ...current, outputAsset: item.coin, outputNetwork: network || current.outputNetwork }));
    setQuery("");
  };
  useEffect(() => {
    loadSettlementOptions();
  }, [loadSettlementOptions]);
  useEffect(() => {
    if (!selectedAsset || !selectedNetwork) return;
    if (selectedAsset.coin !== form.outputAsset || selectedNetwork.id !== form.outputNetwork) {
      setForm((current) => ({ ...current, outputAsset: selectedAsset.coin, outputNetwork: selectedNetwork.id }));
    }
  }, [selectedAsset, selectedNetwork, form.outputAsset, form.outputNetwork]);
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
    <div className="grid gap-6 lg:h-[calc(100vh-2rem)] xl:grid-cols-[minmax(0,1fr)_440px]">
      <form onSubmit={submit} className="ios-surface flex min-h-0 flex-col overflow-hidden lg:h-full">
        <div className="w-full border-b border-white/10 p-4 sm:p-5">
          <Timeline items={timelineItems} flow={timelineFlow} variant="compact" />
        </div>
        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field icon={Banknote} label="Valor">
              <Input value={form.amountBrl} onChange={(value) => change("amountBrl", value)} type="number" inputMode="decimal" required placeholder="0,00 BRL" />
            </Field>
            <Field icon={User} label="Cliente">
              <Input value={form.customerName} onChange={(value) => change("customerName", value)} placeholder="Nome opcional" />
            </Field>
          </div>
          <section className="ios-list-cell p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Destino</div>
                <div className="text-xs text-slate-500">{selectedAsset?.coin || form.outputAsset} em {selectedNetwork?.label || form.outputNetwork}</div>
              </div>
              <div className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 text-xs font-semibold text-slate-200">
                <LockKeyhole size={14} className="text-blue-200" />
                {source.label || `${source.coin} ${source.network}`}
              </div>
            </div>
            <div className="grid gap-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-300">Moeda de saida</span>
                <div className="ios-control flex h-11 items-center gap-2 px-3">
                  <Search size={16} className="shrink-0 text-slate-500" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar moeda"
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </label>
              <div className="grid max-h-52 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                {filteredOptions.map((item) => (
                  <button
                    key={item.coin}
                    type="button"
                    onClick={() => changeAsset(item)}
                    className={`min-h-14 rounded-[18px] border px-3 py-2 text-left transition ${form.outputAsset === item.coin ? "border-white/20 brand-gradient text-white shadow-[0_12px_36px_rgba(37,99,235,0.2)]" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white"}`}
                  >
                    <div className="text-sm font-semibold">{item.coin}</div>
                    <div className="truncate text-xs opacity-70">{item.name}</div>
                  </button>
                ))}
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-300">Rede de saida</div>
                  <Wallet size={17} className="text-slate-500" />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(selectedAsset?.networks || []).map((network) => (
                    <button
                      key={network.id}
                      type="button"
                      onClick={() => change("outputNetwork", network.id)}
                      className={`min-h-11 rounded-full border px-3 text-sm font-medium transition ${form.outputNetwork === network.id ? "border-blue-200/35 bg-blue-300/10 text-blue-100" : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white"}`}
                    >
                      <span>{network.label}</span>
                      {network.hasMemo && <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-slate-300">memo</span>}
                    </button>
                  ))}
                </div>
              </div>
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
          {selectedNetwork?.hasMemo && (
            <Field icon={Wallet} label="Memo">
              <Input value={form.outputMemo} onChange={(value) => change("outputMemo", value)} required placeholder="Informe o memo da rede" />
            </Field>
          )}
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
      <aside className="min-h-0 space-y-4 lg:h-full lg:overflow-y-auto">
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
          <>
            <div className="ios-surface p-5 text-sm text-slate-500">A cobranca sera exibida aqui.</div>
          </>
        )}
      </aside>
    </div>
  );
}
