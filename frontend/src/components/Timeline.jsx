import { BadgeCheck, Banknote, Check, Circle, Clock3, CreditCard, Loader2, QrCode, Repeat2, Send, ShieldCheck, X } from "lucide-react";

const networkName = {
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
  arbitrum: "Arbitrum",
  base: "Base",
  polygon: "Polygon",
  bsc: "BSC",
  optimism: "Optimism",
  avax: "Avalanche",
  solana: "Solana",
  tron: "Tron",
  liquid: "Liquid",
  litecoin: "Litecoin",
  dogecoin: "Dogecoin",
  bitcoincash: "Bitcoin Cash",
  monero: "Monero",
  zcash: "Zcash",
  dash: "Dash",
  xrp: "XRP",
  stellar: "Stellar",
  ton: "TON",
  aptos: "Aptos",
  cosmos: "Cosmos",
  polkadot: "Polkadot"
};

const statusMeta = {
  done: { label: "Concluido", mark: <Check size={13} />, chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100", node: "border-emerald-300/40 bg-emerald-400/15 text-emerald-100" },
  current: { label: "Agora", mark: <Loader2 size={13} className="animate-spin" />, chip: "border-blue-300/35 bg-blue-300/10 text-blue-100", node: "border-blue-300/45 bg-blue-400/15 text-blue-100" },
  pending: { label: "Pendente", mark: <Circle size={13} />, chip: "border-white/10 bg-white/[0.03] text-slate-500", node: "border-white/10 bg-white/[0.04] text-slate-500" },
  error: { label: "Atencao", mark: <X size={13} />, chip: "border-red-300/35 bg-red-400/10 text-red-100", node: "border-red-300/40 bg-red-400/15 text-red-100" }
};

const segmentColors = [
  "timeline-segment-slate",
  "timeline-segment-blue",
  "timeline-segment-cyan",
  "timeline-segment-yellow",
  "timeline-segment-violet",
  "timeline-segment-indigo",
  "timeline-segment-green",
  "timeline-segment-emerald"
];

const safeNetwork = (value) => networkName[String(value || "").toLowerCase()] || value || "rede final";

const shortValue = (value) => {
  const text = String(value || "");
  if (text.length <= 18) return text;
  return `${text.slice(0, 8)}...${text.slice(-6)}`;
};

const flowContext = (flow = {}) => {
  const asset = flow?.settlement?.outputAsset || flow?.outputAsset || "moeda final";
  const network = flow?.outputNetworkLabel || safeNetwork(flow?.settlement?.outputNetwork || flow?.outputNetwork);
  const finalRoute = `${asset} ${network}`.trim();
  const tx = flow?.settlement?.txid;
  return {
    asset,
    network,
    finalRoute,
    received: flow?.intermediate?.receivedAmount,
    settleAmount: flow?.settlement?.settleAmount,
    tx
  };
};

const stageInfo = (key, flow) => {
  const context = flowContext(flow);
  const info = {
    CREATED: {
      icon: QrCode,
      eyebrow: "PIX",
      title: "Cobranca criada",
      route: "BRL -> PIX",
      detail: "Registro interno criado e QR Code/copia e cola preparado."
    },
    WAITING_PAYMENT: {
      icon: CreditCard,
      eyebrow: "Entrada",
      title: "Aguardando pagamento",
      route: "PIX BRL",
      detail: "Cliente paga a cobranca em reais."
    },
    PAYMENT_CONFIRMED: {
      icon: BadgeCheck,
      eyebrow: "Confirmacao",
      title: "PIX recebido",
      route: "BRL confirmado",
      detail: "Webhook confirma o pagamento e a operacao avanca."
    },
    WAITING_INTERMEDIATE_SETTLEMENT: {
      icon: Banknote,
      eyebrow: "Liquidacao",
      title: "Entrada intermediaria",
      route: "BRL -> DePix",
      detail: "Sistema aguarda a liquidacao esperada do ativo intermediario."
    },
    INTERMEDIATE_CONVERSION_STARTED: {
      icon: Repeat2,
      eyebrow: "SideSwap",
      title: "Conversao intermediaria",
      route: `DePix -> USDT Liquid${context.received ? ` (${context.received})` : ""}`,
      detail: "DePix e convertido para USDT na Liquid."
    },
    INTERMEDIATE_CONVERSION_DONE: {
      icon: Repeat2,
      eyebrow: "SideSwap",
      title: "USDT Liquid pronto",
      route: `DePix -> USDT Liquid${context.received ? ` (${context.received})` : ""}`,
      detail: "A etapa intermediaria foi concluida."
    },
    FINAL_SHIFT_CREATED: {
      icon: Repeat2,
      eyebrow: "SideShift",
      title: "Conversao final",
      route: `USDT Liquid -> ${context.finalRoute}`,
      detail: "Shift final criado para a moeda e rede escolhidas."
    },
    WAITING_FINAL_DEPOSIT: {
      icon: Send,
      eyebrow: "Entrega",
      title: "Envio final",
      route: `${context.finalRoute} -> endereco`,
      detail: "Provedor processa a saida para o endereco informado."
    },
    FINAL_PROCESSING: {
      icon: Send,
      eyebrow: "Entrega",
      title: "Processando envio",
      route: `${context.finalRoute} -> endereco`,
      detail: "Transacao final em processamento na rede."
    },
    COMPLETED: {
      icon: ShieldCheck,
      eyebrow: "Final",
      title: "Operacao concluida",
      route: context.tx ? `Tx ${shortValue(context.tx)}` : context.finalRoute,
      detail: context.settleAmount ? `Valor final registrado: ${context.settleAmount}` : "Hash final registrado quando disponivel."
    },
    WAITING_MANUAL_STEP: {
      icon: Clock3,
      eyebrow: "Manual",
      title: "Aguardando acao",
      route: "DePix -> USDT Liquid",
      detail: "Operador informa a liquidacao intermediaria para continuar."
    }
  };
  return info[key] || {
    icon: Circle,
    eyebrow: "Etapa",
    title: "Processamento",
    route: context.finalRoute,
    detail: "Etapa operacional em andamento."
  };
};

export default function Timeline({ items = [], flow = {}, variant = "full" }) {
  const rows = Array.isArray(items) ? items : [];
  const done = rows.filter((item) => item.state === "done").length;
  const current = rows.some((item) => item.state === "current") ? 1 : 0;
  const progress = rows.length ? Math.round(((done + current * 0.5) / rows.length) * 100) : 0;
  const context = flowContext(flow);
  if (variant === "compact") {
    return (
      <div className="w-full">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Fluxo real</div>
            <div className="mt-1 break-words text-lg font-semibold text-white">{`PIX BRL -> DePix -> USDT Liquid -> ${context.finalRoute}`}</div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm font-semibold text-white">{progress}%</div>
            <div className="text-sm text-slate-500">{done}/{rows.length}</div>
          </div>
        </div>
        <div className="timeline-track mt-4 h-2.5 rounded-full bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="timeline-fill h-full rounded-full brand-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-8">
          {rows.map((item) => {
            const info = stageInfo(item.key, flow);
            const Icon = info.icon;
            const status = statusMeta[item.state] || statusMeta.pending;
            const tone = item.state === "done"
              ? "border-emerald-300/20 bg-emerald-400/[0.06]"
              : item.state === "current"
                ? "border-blue-300/30 bg-blue-400/[0.08] timeline-current"
                : item.state === "error"
                  ? "border-red-300/30 bg-red-400/[0.08]"
                  : "border-white/10 bg-white/[0.035]";
            return (
              <div key={item.key || item.label} className={`min-w-0 rounded-[18px] border p-2.5 ${tone}`}>
                <div className="flex min-w-0 items-center gap-2">
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${status.node}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-semibold uppercase text-blue-200">{info.eyebrow}</div>
                    <div className="truncate text-xs font-semibold text-white">{info.title}</div>
                  </div>
                </div>
                <div className="mt-2 break-words text-[11px] font-medium leading-4 text-slate-400">{info.route}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="ios-surface overflow-hidden p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Fluxo real</div>
          <div className="mt-1 text-xl font-semibold text-white">{progress}% concluido</div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">PIX BRL</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">DePix</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">USDT Liquid</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">{context.finalRoute}</span>
          </div>
        </div>
        <div className="text-sm text-slate-400">{done} de {rows.length} etapas</div>
      </div>
      <div className="timeline-infographic mt-5 overflow-x-auto pb-2">
        <div className="timeline-map" style={{ "--steps": rows.length || 1 }}>
          <div className="timeline-grid">
            {rows.map((item, index) => {
              const info = stageInfo(item.key, flow);
              const Icon = info.icon;
              const status = statusMeta[item.state] || statusMeta.pending;
              const isTop = index % 2 === 0;
              return (
                <article key={item.key || item.label || index} className="timeline-stage">
                  <div className={`timeline-slot ${isTop ? "items-end" : "items-start"}`}>
                    {isTop && (
                      <div className={`timeline-card ${item.state === "current" ? "timeline-current" : ""}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase text-blue-200">{info.eyebrow}</span>
                          <span className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-medium ${status.chip}`}>{status.mark}{status.label}</span>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-white">{info.title}</div>
                        <div className="mt-1 text-[13px] font-semibold text-slate-200">{info.route}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">{info.detail}</div>
                      </div>
                    )}
                  </div>
                  <div className="timeline-axis-row">
                    <div className={`timeline-segment ${segmentColors[index % segmentColors.length]} ${item.state === "pending" ? "timeline-segment-pending" : ""} ${item.state === "error" ? "timeline-segment-error" : ""}`} />
                    <div className={`timeline-node ${status.node}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                  <div className={`timeline-slot ${isTop ? "items-start" : "items-end"}`}>
                    {!isTop && (
                      <div className={`timeline-card ${item.state === "current" ? "timeline-current" : ""}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase text-blue-200">{info.eyebrow}</span>
                          <span className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-medium ${status.chip}`}>{status.mark}{status.label}</span>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-white">{info.title}</div>
                        <div className="mt-1 text-[13px] font-semibold text-slate-200">{info.route}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">{info.detail}</div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
