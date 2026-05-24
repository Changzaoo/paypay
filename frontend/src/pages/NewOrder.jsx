import { ArrowRight, Badge, Banknote, ChevronDown, Loader2, LockKeyhole, Mail, Phone, RotateCcw, Search, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import QRPaymentCard from "../components/QRPaymentCard";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import { useOrderStore } from "../store/orderStore";

const sourceDefault = { coin: "BTC", network: "liquid", label: "LBTC Liquid" };
const recentKey = "paypay_recent_routes";

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

function readRecentRoutes() {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(recentKey) || "[]");
    return Array.isArray(value) ? value.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function writeRecentRoutes(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(recentKey, JSON.stringify(items.slice(0, 6)));
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
  const [openSelect, setOpenSelect] = useState("");
  const [assetQuery, setAssetQuery] = useState("");
  const [networkQuery, setNetworkQuery] = useState("");
  const [recentRoutes, setRecentRoutes] = useState(() => readRecentRoutes());
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    amountBrl: "",
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
    const text = assetQuery.trim().toLowerCase();
    if (!text) return options;
    return options.filter((item) => `${item.coin} ${item.name}`.toLowerCase().includes(text));
  }, [options, assetQuery]);
  const filteredNetworks = useMemo(() => {
    const text = networkQuery.trim().toLowerCase();
    const rows = selectedAsset?.networks || [];
    if (!text) return rows;
    return rows.filter((item) => `${item.id} ${item.label}`.toLowerCase().includes(text));
  }, [selectedAsset, networkQuery]);
  const hydratedRecentRoutes = useMemo(() => recentRoutes.map((item) => {
    const asset = options.find((option) => option.coin === item.asset);
    const network = asset?.networks?.find((route) => route.id === item.network);
    if (!asset || !network) return null;
    return { asset, network };
  }).filter(Boolean), [recentRoutes, options]);
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
    setAssetQuery("");
    setNetworkQuery("");
    setOpenSelect("");
  };
  const changeRoute = (asset, network) => {
    setForm((current) => ({ ...current, outputAsset: asset.coin, outputNetwork: network.id }));
    rememberRoute(asset, network);
    setAssetQuery("");
    setNetworkQuery("");
    setOpenSelect("");
  };
  const rememberRoute = (asset, network) => {
    if (!asset?.coin || !network?.id) return;
    const next = [{ asset: asset.coin, network: network.id }, ...recentRoutes.filter((item) => item.asset !== asset.coin || item.network !== network.id)].slice(0, 6);
    setRecentRoutes(next);
    writeRecentRoutes(next);
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
    rememberRoute(selectedAsset, selectedNetwork);
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
          <div className="max-w-md">
            <Field icon={Banknote} label="Valor">
              <Input value={form.amountBrl} onChange={(value) => change("amountBrl", value)} type="number" inputMode="decimal" required placeholder="0,00 BRL" />
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
            <div className="grid gap-3 md:grid-cols-2">
              <div className="relative space-y-2">
                <span className="text-sm font-medium text-slate-300">Moeda de saida</span>
                <button
                  type="button"
                  onClick={() => setOpenSelect((value) => value === "asset" ? "" : "asset")}
                  className="ios-control flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{selectedAsset?.coin || form.outputAsset}</span>
                    <span className="block truncate text-xs text-slate-500">{selectedAsset?.name || "Moeda"}</span>
                  </span>
                  <ChevronDown size={17} className={`shrink-0 text-slate-500 transition ${openSelect === "asset" ? "rotate-180" : ""}`} />
                </button>
                {openSelect === "asset" && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[22px] border border-white/10 bg-[#111418]/95 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
                    <div className="ios-control flex h-10 items-center gap-2 px-3">
                      <Search size={15} className="shrink-0 text-slate-500" />
                      <input value={assetQuery} onChange={(event) => setAssetQuery(event.target.value)} placeholder="Buscar moeda" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
                    </div>
                    {hydratedRecentRoutes.length > 0 && (
                      <div className="mt-3">
                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Ultimas usadas</div>
                        <div className="flex flex-wrap gap-2">
                          {hydratedRecentRoutes.map(({ asset, network }) => (
                            <button key={`${asset.coin}-${network.id}`} type="button" onClick={() => changeRoute(asset, network)} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10">
                              {asset.coin} / {network.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-3 grid max-h-60 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {filteredOptions.map((item) => (
                        <button key={item.coin} type="button" onClick={() => changeAsset(item)} className={`rounded-[16px] border px-3 py-2 text-left transition ${form.outputAsset === item.coin ? "border-white/20 brand-gradient text-white" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                          <span className="block text-sm font-semibold">{item.coin}</span>
                          <span className="block truncate text-xs opacity-70">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative space-y-2">
                <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-300">
                  Rede de saida
                  <Wallet size={17} className="text-slate-500" />
                </span>
                <button
                  type="button"
                  onClick={() => setOpenSelect((value) => value === "network" ? "" : "network")}
                  className="ios-control flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{selectedNetwork?.label || form.outputNetwork}</span>
                    <span className="block truncate text-xs text-slate-500">{selectedNetwork?.id || "rede"}</span>
                  </span>
                  <ChevronDown size={17} className={`shrink-0 text-slate-500 transition ${openSelect === "network" ? "rotate-180" : ""}`} />
                </button>
                {openSelect === "network" && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[22px] border border-white/10 bg-[#111418]/95 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
                    <div className="ios-control flex h-10 items-center gap-2 px-3">
                      <Search size={15} className="shrink-0 text-slate-500" />
                      <input value={networkQuery} onChange={(event) => setNetworkQuery(event.target.value)} placeholder="Buscar rede" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
                    </div>
                    <div className="mt-3 grid max-h-60 gap-2 overflow-y-auto pr-1">
                      {filteredNetworks.map((network) => (
                        <button key={network.id} type="button" onClick={() => changeRoute(selectedAsset, network)} className={`rounded-[16px] border px-3 py-2 text-left transition ${form.outputNetwork === network.id ? "border-blue-200/35 bg-blue-300/10 text-blue-100" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                          <span className="text-sm font-semibold">{network.label}</span>
                          <span className="ml-2 text-xs text-slate-500">{network.id}</span>
                          {network.hasMemo && <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-slate-300">memo</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">Endereco final</span>
            <div className="ios-control px-3 py-2">
              <textarea
                required
                value={form.outputAddress}
                onChange={(event) => change("outputAddress", event.target.value)}
                placeholder="Cole o endereco de recebimento"
                rows={2}
                className="min-h-12 w-full resize-none bg-transparent py-1 text-sm text-white outline-none placeholder:text-slate-600"
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
