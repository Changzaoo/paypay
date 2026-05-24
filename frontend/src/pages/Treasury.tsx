import { AlertTriangle, ArrowRightLeft, Check, Clock3, Download, FileText, Gauge, GitBranch, History, Layers, Lock, Network, Plus, RefreshCw, ShieldCheck, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ButtonHTMLAttributes, FormEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { treasuryApi } from "../lib/treasury";

type Row = Record<string, any>;

const tabs = [
  { id: "dashboard", label: "Visao", icon: Gauge },
  { id: "wallets", label: "Carteiras", icon: Wallet },
  { id: "transfers", label: "Transferencias", icon: ArrowRightLeft },
  { id: "bridges", label: "Bridge", icon: GitBranch },
  { id: "history", label: "On-chain", icon: History },
  { id: "audit", label: "Auditoria", icon: FileText },
  { id: "risk", label: "Risco", icon: ShieldCheck },
  { id: "config", label: "Config", icon: Network }
];

const statuses: Record<string, string> = {
  approved: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  active: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  pending_approval: "border-amber-300/25 bg-amber-400/10 text-amber-100",
  queued: "border-blue-300/25 bg-blue-400/10 text-blue-100",
  signing: "border-blue-300/25 bg-blue-400/10 text-blue-100",
  pending_tx: "border-blue-300/25 bg-blue-400/10 text-blue-100",
  pending: "border-blue-300/25 bg-blue-400/10 text-blue-100",
  failed: "border-red-300/25 bg-red-400/10 text-red-100",
  rejected: "border-red-300/25 bg-red-400/10 text-red-100",
  disabled: "border-slate-300/20 bg-white/[0.04] text-slate-300"
};

const initialWallet = { name: "", chainId: "", address: "", purpose: "operational", dailyLimit: "0", tags: "" };
const initialTransfer = { sourceWalletId: "", destinationWalletId: "", token: "", amount: "", reason: "" };
const initialBridge = { sourceWalletId: "", destinationWalletId: "", sourceToken: "", destinationToken: "", amount: "", provider: "sideshift", feeEstimate: "", slippageBps: "50", reason: "" };
const initialChain = { chainKey: "", chainId: "", name: "", rpcUrl: "", explorerUrl: "", nativeSymbol: "ETH", nativeDecimals: "18", status: "active" };
const initialToken = { chainId: "", symbol: "", name: "", contractAddress: "", decimals: "18", isNative: false, status: "active" };
const initialRule = { ruleType: "blocked_address", chainId: "", value: "", reason: "", status: "active" };

function short(value?: string) {
  if (!value) return "-";
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

function chainName(chains: Row[], id?: string | number) {
  const chain = chains.find((item) => Number(item.chain_id) === Number(id));
  return chain?.name || chain?.chain_key || id || "-";
}

function tokenRows(tokens: Row[], chainId?: string | number) {
  return tokens.filter((item) => !chainId || Number(item.chain_id) === Number(chainId));
}

function explorer(chains: Row[], chainId?: string | number, hash?: string) {
  const chain = chains.find((item) => Number(item.chain_id) === Number(chainId));
  const base = String(chain?.explorer_url || "").replace(/\/$/, "");
  if (!base || !hash) return "";
  return `${base}/tx/${hash}`;
}

function asNumber(value: string) {
  const normalized = String(value || "").replace(",", ".");
  return normalized ? Number(normalized) : undefined;
}

function StatusPill({ value }: { value?: string }) {
  const key = String(value || "pending").toLowerCase();
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statuses[key] || statuses.disabled}`}>{value || "-"}</span>;
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`ios-surface overflow-hidden ${className}`}>{children}</section>;
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: ReactNode }) {
  return (
    <div className="ios-list-cell p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-[14px] border border-white/10 bg-white/[0.04] text-slate-300">
          <Icon size={17} />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`ios-control h-11 w-full px-3 text-sm text-white outline-none placeholder:text-slate-600 ${props.className || ""}`} />;
}

function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`ios-control min-h-20 w-full resize-none px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 ${props.className || ""}`} />;
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`ios-control h-11 w-full px-3 text-sm text-white outline-none ${props.className || ""}`} />;
}

function PrimaryButton({ children, busy, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button {...props} disabled={props.disabled || busy} className={`ios-button-primary inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold transition hover:opacity-95 disabled:opacity-50 ${props.className || ""}`}>
      {busy ? <RefreshCw size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`ios-button-secondary inline-flex h-10 items-center justify-center gap-2 px-3 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50 ${props.className || ""}`}>
      {children}
    </button>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-slate-500">{label}</div>;
}

export default function Treasury() {
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [summary, setSummary] = useState<Row>({});
  const [chains, setChains] = useState<Row[]>([]);
  const [tokens, setTokens] = useState<Row[]>([]);
  const [wallets, setWallets] = useState<Row[]>([]);
  const [transfers, setTransfers] = useState<Row[]>([]);
  const [transactions, setTransactions] = useState<Row[]>([]);
  const [bridges, setBridges] = useState<Row[]>([]);
  const [providers, setProviders] = useState<Row>({});
  const [audits, setAudits] = useState<Row[]>([]);
  const [rules, setRules] = useState<Row[]>([]);
  const [reconciliation, setReconciliation] = useState<Row[]>([]);
  const [walletForm, setWalletForm] = useState<Row>(initialWallet);
  const [transferForm, setTransferForm] = useState<Row>(initialTransfer);
  const [bridgeForm, setBridgeForm] = useState<Row>(initialBridge);
  const [chainForm, setChainForm] = useState<Row>(initialChain);
  const [tokenForm, setTokenForm] = useState<Row>(initialToken);
  const [ruleForm, setRuleForm] = useState<Row>(initialRule);

  const approvedWallets = useMemo(() => wallets.filter((item) => item.status === "approved" || item.status === "active"), [wallets]);
  const transferSource = wallets.find((item) => item.id === transferForm.sourceWalletId);
  const bridgeSource = wallets.find((item) => item.id === bridgeForm.sourceWalletId);
  const bridgeDest = wallets.find((item) => item.id === bridgeForm.destinationWalletId);
  const availableTransferTokens = tokenRows(tokens, transferSource?.chain_id);
  const sourceBridgeTokens = tokenRows(tokens, bridgeSource?.chain_id);
  const destBridgeTokens = tokenRows(tokens, bridgeDest?.chain_id);

  const load = async () => {
    setLoading(true);
    setNotice("");
    try {
      const [nextSummary, nextChains, nextTokens, nextWallets, nextTransfers, nextTransactions, nextBridgeData, nextAudits, nextRules, nextReconciliation] = await Promise.all([
        treasuryApi.summary(),
        treasuryApi.chains(),
        treasuryApi.tokens(),
        treasuryApi.wallets(),
        treasuryApi.transfers(),
        treasuryApi.transactions(),
        treasuryApi.bridges(),
        treasuryApi.audit().catch(() => []),
        treasuryApi.rules(),
        treasuryApi.reconciliation().catch(() => [])
      ]);
      setSummary(nextSummary || {});
      setChains(nextChains);
      setTokens(nextTokens);
      setWallets(nextWallets);
      setTransfers(nextTransfers);
      setTransactions(nextTransactions);
      setBridges(Array.isArray(nextBridgeData.items) ? nextBridgeData.items : []);
      setProviders(nextBridgeData.providers || {});
      setAudits(nextAudits);
      setRules(nextRules);
      setReconciliation(nextReconciliation);
    } catch (error: any) {
      setNotice(error?.response?.data?.error || error?.message || "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  };

  const run = async (key: string, action: () => Promise<unknown>, after?: () => void) => {
    setBusy(key);
    setNotice("");
    try {
      await action();
      after?.();
      await load();
    } catch (error: any) {
      setNotice(error?.response?.data?.error || error?.message || "Falha operacional");
    } finally {
      setBusy("");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!transferForm.token && availableTransferTokens[0]?.symbol) {
      setTransferForm((current) => ({ ...current, token: availableTransferTokens[0].symbol }));
    }
  }, [availableTransferTokens, transferForm.token]);

  useEffect(() => {
    if (!bridgeForm.sourceToken && sourceBridgeTokens[0]?.symbol) {
      setBridgeForm((current) => ({ ...current, sourceToken: sourceBridgeTokens[0].symbol }));
    }
    if (!bridgeForm.destinationToken && destBridgeTokens[0]?.symbol) {
      setBridgeForm((current) => ({ ...current, destinationToken: destBridgeTokens[0].symbol }));
    }
  }, [sourceBridgeTokens, destBridgeTokens, bridgeForm.sourceToken, bridgeForm.destinationToken]);

  const createWallet = (event: FormEvent) => {
    event.preventDefault();
    run("wallet", () => treasuryApi.createWallet({
      ...walletForm,
      chainId: Number(walletForm.chainId),
      dailyLimit: asNumber(walletForm.dailyLimit) || 0,
      tags: String(walletForm.tags || "").split(",").map((item) => item.trim()).filter(Boolean)
    }), () => setWalletForm(initialWallet));
  };

  const createTransfer = (event: FormEvent) => {
    event.preventDefault();
    run("transfer", () => treasuryApi.createTransfer({
      ...transferForm,
      amount: asNumber(transferForm.amount)
    }), () => setTransferForm(initialTransfer));
  };

  const createBridge = (event: FormEvent) => {
    event.preventDefault();
    run("bridge", () => treasuryApi.createBridge({
      ...bridgeForm,
      amount: asNumber(bridgeForm.amount),
      feeEstimate: asNumber(bridgeForm.feeEstimate),
      slippageBps: Number(bridgeForm.slippageBps || 50)
    }), () => setBridgeForm(initialBridge));
  };

  const createChain = (event: FormEvent) => {
    event.preventDefault();
    run("chain", () => treasuryApi.createChain({
      ...chainForm,
      chainId: Number(chainForm.chainId),
      nativeDecimals: Number(chainForm.nativeDecimals || 18)
    }), () => setChainForm(initialChain));
  };

  const createToken = (event: FormEvent) => {
    event.preventDefault();
    run("token", () => treasuryApi.createToken({
      ...tokenForm,
      chainId: Number(tokenForm.chainId),
      decimals: Number(tokenForm.decimals || 18),
      isNative: Boolean(tokenForm.isNative)
    }), () => setTokenForm(initialToken));
  };

  const createRule = (event: FormEvent) => {
    event.preventDefault();
    run("rule", () => treasuryApi.createRule({
      ...ruleForm,
      chainId: ruleForm.chainId ? Number(ruleForm.chainId) : undefined
    }), () => setRuleForm(initialRule));
  };

  const exportCsv = async () => {
    setBusy("csv");
    try {
      const blob = await treasuryApi.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tesouro-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setNotice(error?.response?.data?.error || error?.message || "Falha ao exportar");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">Tesouraria multi-chain</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Tesouro</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton onClick={load} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Atualizar
            </SecondaryButton>
            <SecondaryButton onClick={exportCsv} disabled={busy === "csv"}>
              <Download size={16} />
              CSV
            </SecondaryButton>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto p-3">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition ${active ? "border-white/20 brand-gradient text-white" : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white"}`}>
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </Panel>

      {notice ? <div className="rounded-[18px] border border-red-300/20 bg-red-500/10 p-4 text-sm font-medium text-red-100">{notice}</div> : null}

      {tab === "dashboard" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Stat icon={Wallet} label="Carteiras" value={summary.wallets || 0} />
            <Stat icon={ShieldCheck} label="Aprovadas" value={summary.approvedWallets || 0} />
            <Stat icon={Clock3} label="Transferencias" value={summary.pendingTransfers || 0} />
            <Stat icon={GitBranch} label="Bridges" value={summary.pendingBridges || 0} />
            <Stat icon={Layers} label="Fila" value={summary.queuedTransactions || 0} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Panel className="p-5">
              <h2 className="text-lg font-semibold text-white">Saldos por chain</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(summary.byChain || {}).length ? Object.entries(summary.byChain || {}).map(([key, value]) => (
                  <div key={key} className="ios-list-cell p-4">
                    <div className="text-sm font-medium text-slate-500">{key}</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{String(value)}</div>
                  </div>
                )) : <Empty label="Sem saldos registrados" />}
              </div>
            </Panel>
            <Panel className="p-5">
              <h2 className="text-lg font-semibold text-white">Divergencias</h2>
              <div className="mt-4 space-y-2">
                {reconciliation.length ? reconciliation.slice(0, 5).map((item) => (
                  <div key={item.walletId} className="ios-list-cell flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{item.name}</div>
                      <div className="truncate text-xs text-slate-500">{short(item.address)}</div>
                    </div>
                    <StatusPill value={item.divergent ? "divergente" : "ok"} />
                  </div>
                )) : <Empty label="Reconciliacao aguardando RPC" />}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === "wallets" && (
        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-white">Nova carteira</h2>
            <form onSubmit={createWallet} className="mt-4 grid gap-3">
              <Field label="Nome"><Input required value={walletForm.name} onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })} /></Field>
              <Field label="Chain">
                <Select required value={walletForm.chainId} onChange={(e) => setWalletForm({ ...walletForm, chainId: e.target.value })}>
                  <option value="">Selecione</option>
                  {chains.map((item) => <option key={item.id} value={item.chain_id}>{item.name}</option>)}
                </Select>
              </Field>
              <Field label="Endereco"><Input required value={walletForm.address} onChange={(e) => setWalletForm({ ...walletForm, address: e.target.value })} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Finalidade">
                  <Select value={walletForm.purpose} onChange={(e) => setWalletForm({ ...walletForm, purpose: e.target.value })}>
                    <option value="main">Principal</option>
                    <option value="operational">Operacional</option>
                    <option value="treasury">Tesouro</option>
                    <option value="settlement">Liquidacao</option>
                    <option value="audit">Auditoria</option>
                  </Select>
                </Field>
                <Field label="Limite diario"><Input inputMode="decimal" value={walletForm.dailyLimit} onChange={(e) => setWalletForm({ ...walletForm, dailyLimit: e.target.value })} /></Field>
              </div>
              <Field label="Tags"><Input value={walletForm.tags} onChange={(e) => setWalletForm({ ...walletForm, tags: e.target.value })} placeholder="ops, evm" /></Field>
              <PrimaryButton busy={busy === "wallet"}><Plus size={16} />Cadastrar</PrimaryButton>
            </form>
          </Panel>
          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-white">Carteiras</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {wallets.length ? wallets.map((item) => (
                <div key={item.id} className="ios-list-cell p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-white">{item.name}</div>
                      <div className="mt-1 truncate text-xs text-slate-500">{short(item.address)}</div>
                    </div>
                    <StatusPill value={item.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <span>{chainName(chains, item.chain_id)}</span>
                    <span>{item.purpose}</span>
                    <span>Limite {item.daily_limit || 0}</span>
                    <span>{Array.isArray(item.tags) ? item.tags.join(", ") : ""}</span>
                  </div>
                  {item.status !== "approved" && item.status !== "active" ? (
                    <SecondaryButton className="mt-4 w-full" onClick={() => run(`wallet-${item.id}`, () => treasuryApi.updateWallet(item.id, { status: "approved" }))}>
                      <Check size={15} />
                      Aprovar
                    </SecondaryButton>
                  ) : null}
                </div>
              )) : <Empty label="Nenhuma carteira cadastrada" />}
            </div>
          </Panel>
        </div>
      )}

      {tab === "transfers" && (
        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-white">Solicitar transferencia</h2>
            <form onSubmit={createTransfer} className="mt-4 grid gap-3">
              <Field label="Origem">
                <Select required value={transferForm.sourceWalletId} onChange={(e) => setTransferForm({ ...transferForm, sourceWalletId: e.target.value, token: "" })}>
                  <option value="">Selecione</option>
                  {approvedWallets.map((item) => <option key={item.id} value={item.id}>{item.name} / {chainName(chains, item.chain_id)}</option>)}
                </Select>
              </Field>
              <Field label="Destino">
                <Select required value={transferForm.destinationWalletId} onChange={(e) => setTransferForm({ ...transferForm, destinationWalletId: e.target.value })}>
                  <option value="">Selecione</option>
                  {approvedWallets.filter((item) => !transferSource || item.chain_id === transferSource.chain_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Token">
                  <Select required value={transferForm.token} onChange={(e) => setTransferForm({ ...transferForm, token: e.target.value })}>
                    <option value="">Token</option>
                    {availableTransferTokens.map((item) => <option key={item.id} value={item.symbol}>{item.symbol}</option>)}
                  </Select>
                </Field>
                <Field label="Valor"><Input required inputMode="decimal" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} /></Field>
              </div>
              <Field label="Motivo"><Textarea required value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })} /></Field>
              <PrimaryButton busy={busy === "transfer"}><Plus size={16} />Criar</PrimaryButton>
            </form>
          </Panel>
          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-white">Solicitacoes</h2>
            <div className="mt-4 space-y-3">
              {transfers.length ? transfers.map((item) => (
                <div key={item.id} className="ios-list-cell p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-white">{item.amount} {item.token_symbol}</div>
                      <div className="mt-1 truncate text-xs text-slate-500">{item.source?.name} {"->"} {item.destination?.name}</div>
                    </div>
                    <StatusPill value={item.status} />
                  </div>
                  <div className="mt-3 text-sm text-slate-400">{item.reason}</div>
                  {item.risk_result?.repeatedAmount ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
                      <AlertTriangle size={14} />
                      Valor repetido em revisao
                    </div>
                  ) : null}
                  {item.status === "pending_approval" ? (
                    <div className="mt-4 flex gap-2">
                      <SecondaryButton onClick={() => run(`approve-${item.id}`, () => treasuryApi.decideTransfer(item.id, { decision: "approved" }))}><Check size={15} />Aprovar</SecondaryButton>
                      <SecondaryButton onClick={() => run(`reject-${item.id}`, () => treasuryApi.decideTransfer(item.id, { decision: "rejected" }))}><X size={15} />Recusar</SecondaryButton>
                    </div>
                  ) : null}
                </div>
              )) : <Empty label="Sem solicitacoes" />}
            </div>
          </Panel>
        </div>
      )}

      {tab === "bridges" && (
        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-white">Solicitar bridge</h2>
            <form onSubmit={createBridge} className="mt-4 grid gap-3">
              <Field label="Origem">
                <Select required value={bridgeForm.sourceWalletId} onChange={(e) => setBridgeForm({ ...bridgeForm, sourceWalletId: e.target.value, sourceToken: "" })}>
                  <option value="">Selecione</option>
                  {approvedWallets.map((item) => <option key={item.id} value={item.id}>{item.name} / {chainName(chains, item.chain_id)}</option>)}
                </Select>
              </Field>
              <Field label="Destino">
                <Select required value={bridgeForm.destinationWalletId} onChange={(e) => setBridgeForm({ ...bridgeForm, destinationWalletId: e.target.value, destinationToken: "" })}>
                  <option value="">Selecione</option>
                  {approvedWallets.filter((item) => !bridgeSource || item.chain_id !== bridgeSource.chain_id).map((item) => <option key={item.id} value={item.id}>{item.name} / {chainName(chains, item.chain_id)}</option>)}
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Token origem">
                  <Select required value={bridgeForm.sourceToken} onChange={(e) => setBridgeForm({ ...bridgeForm, sourceToken: e.target.value })}>
                    <option value="">Token</option>
                    {sourceBridgeTokens.map((item) => <option key={item.id} value={item.symbol}>{item.symbol}</option>)}
                  </Select>
                </Field>
                <Field label="Token destino">
                  <Select required value={bridgeForm.destinationToken} onChange={(e) => setBridgeForm({ ...bridgeForm, destinationToken: e.target.value })}>
                    <option value="">Token</option>
                    {destBridgeTokens.map((item) => <option key={item.id} value={item.symbol}>{item.symbol}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Valor"><Input required inputMode="decimal" value={bridgeForm.amount} onChange={(e) => setBridgeForm({ ...bridgeForm, amount: e.target.value })} /></Field>
                <Field label="Provedor">
                  <Select value={bridgeForm.provider} onChange={(e) => setBridgeForm({ ...bridgeForm, provider: e.target.value })}>
                    {Object.entries(providers).length ? Object.entries(providers).map(([key, provider]) => <option key={key} value={key}>{(provider as Row).name}</option>) : <option value="sideshift">SideShift</option>}
                  </Select>
                </Field>
              </div>
              <Field label="Motivo"><Textarea required value={bridgeForm.reason} onChange={(e) => setBridgeForm({ ...bridgeForm, reason: e.target.value })} /></Field>
              <PrimaryButton busy={busy === "bridge"}><Plus size={16} />Criar</PrimaryButton>
            </form>
          </Panel>
          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-white">Bridges</h2>
            <div className="mt-4 space-y-3">
              {bridges.length ? bridges.map((item) => (
                <div key={item.id} className="ios-list-cell p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-white">{item.amount} {item.source_token_symbol} {"->"} {item.destination_token_symbol}</div>
                      <div className="mt-1 truncate text-xs text-slate-500">{item.source?.name} {"->"} {item.destination?.name}</div>
                    </div>
                    <StatusPill value={item.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">{item.provider}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">{item.slippage_bps || 0} bps</span>
                    {item.risk_result?.repeatedAmount ? <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-amber-100">Valor repetido</span> : null}
                  </div>
                  {item.status === "pending_approval" ? (
                    <div className="mt-4 flex gap-2">
                      <SecondaryButton onClick={() => run(`bridge-approve-${item.id}`, () => treasuryApi.decideBridge(item.id, { decision: "approved" }))}><Check size={15} />Aprovar</SecondaryButton>
                      <SecondaryButton onClick={() => run(`bridge-reject-${item.id}`, () => treasuryApi.decideBridge(item.id, { decision: "rejected" }))}><X size={15} />Recusar</SecondaryButton>
                    </div>
                  ) : null}
                </div>
              )) : <Empty label="Sem bridges" />}
            </div>
          </Panel>
        </div>
      )}

      {tab === "history" && (
        <Panel className="p-5">
          <h2 className="text-lg font-semibold text-white">Historico on-chain</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3">Chain</th>
                  <th className="py-3 pr-3">Token</th>
                  <th className="py-3 pr-3">Valor</th>
                  <th className="py-3 pr-3">Hash</th>
                  <th className="py-3 pr-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {transactions.map((item) => {
                  const href = explorer(chains, item.chain_id, item.tx_hash);
                  return (
                    <tr key={item.id}>
                      <td className="py-3 pr-3"><StatusPill value={item.status} /></td>
                      <td className="py-3 pr-3 text-slate-300">{chainName(chains, item.chain_id)}</td>
                      <td className="py-3 pr-3 text-slate-300">{item.token_configs?.symbol || "-"}</td>
                      <td className="py-3 pr-3 text-white">{item.amount}</td>
                      <td className="py-3 pr-3">{href ? <a href={href} target="_blank" rel="noreferrer" className="text-blue-200 hover:text-blue-100">{short(item.tx_hash)}</a> : <span className="text-slate-500">{short(item.tx_hash)}</span>}</td>
                      <td className="py-3 pr-3 text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!transactions.length ? <Empty label="Nenhuma transacao registrada" /> : null}
          </div>
        </Panel>
      )}

      {tab === "audit" && (
        <Panel className="p-5">
          <h2 className="text-lg font-semibold text-white">Auditoria</h2>
          <div className="mt-4 space-y-3">
            {audits.length ? audits.map((item) => (
              <div key={item.id} className="ios-list-cell flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{item.action}</div>
                  <div className="mt-1 truncate text-xs text-slate-500">{item.actor_email || "-"} / {item.entity_type || "-"}</div>
                </div>
                <div className="text-xs text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</div>
              </div>
            )) : <Empty label="Sem eventos" />}
          </div>
        </Panel>
      )}

      {tab === "risk" && (
        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-white">Nova regra</h2>
            <form onSubmit={createRule} className="mt-4 grid gap-3">
              <Field label="Tipo">
                <Select value={ruleForm.ruleType} onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}>
                  <option value="blocked_address">Endereco bloqueado</option>
                  <option value="velocity_limit">Velocidade</option>
                  <option value="manual_review">Revisao manual</option>
                </Select>
              </Field>
              <Field label="Chain">
                <Select value={ruleForm.chainId} onChange={(e) => setRuleForm({ ...ruleForm, chainId: e.target.value })}>
                  <option value="">Todas</option>
                  {chains.map((item) => <option key={item.id} value={item.chain_id}>{item.name}</option>)}
                </Select>
              </Field>
              <Field label="Valor"><Input required value={ruleForm.value} onChange={(e) => setRuleForm({ ...ruleForm, value: e.target.value })} /></Field>
              <Field label="Motivo"><Textarea value={ruleForm.reason} onChange={(e) => setRuleForm({ ...ruleForm, reason: e.target.value })} /></Field>
              <PrimaryButton busy={busy === "rule"}><Lock size={16} />Salvar</PrimaryButton>
            </form>
          </Panel>
          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-white">Regras</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {rules.length ? rules.map((item) => (
                <div key={item.id} className="ios-list-cell p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{item.rule_type}</div>
                      <div className="mt-1 truncate text-xs text-slate-500">{item.value}</div>
                    </div>
                    <StatusPill value={item.status} />
                  </div>
                  <div className="mt-3 text-xs text-slate-400">{item.reason || "-"}</div>
                </div>
              )) : <Empty label="Sem regras" />}
            </div>
          </Panel>
        </div>
      )}

      {tab === "config" && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-white">Rede EVM</h2>
            <form onSubmit={createChain} className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Chave"><Input required value={chainForm.chainKey} onChange={(e) => setChainForm({ ...chainForm, chainKey: e.target.value })} /></Field>
                <Field label="Chain ID"><Input required inputMode="numeric" value={chainForm.chainId} onChange={(e) => setChainForm({ ...chainForm, chainId: e.target.value })} /></Field>
              </div>
              <Field label="Nome"><Input required value={chainForm.name} onChange={(e) => setChainForm({ ...chainForm, name: e.target.value })} /></Field>
              <Field label="RPC"><Input required value={chainForm.rpcUrl} onChange={(e) => setChainForm({ ...chainForm, rpcUrl: e.target.value })} /></Field>
              <Field label="Explorer"><Input value={chainForm.explorerUrl} onChange={(e) => setChainForm({ ...chainForm, explorerUrl: e.target.value })} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nativo"><Input required value={chainForm.nativeSymbol} onChange={(e) => setChainForm({ ...chainForm, nativeSymbol: e.target.value })} /></Field>
                <Field label="Decimais"><Input inputMode="numeric" value={chainForm.nativeDecimals} onChange={(e) => setChainForm({ ...chainForm, nativeDecimals: e.target.value })} /></Field>
              </div>
              <PrimaryButton busy={busy === "chain"}><Plus size={16} />Salvar rede</PrimaryButton>
            </form>
          </Panel>
          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-white">Token</h2>
            <form onSubmit={createToken} className="mt-4 grid gap-3">
              <Field label="Chain">
                <Select required value={tokenForm.chainId} onChange={(e) => setTokenForm({ ...tokenForm, chainId: e.target.value })}>
                  <option value="">Selecione</option>
                  {chains.map((item) => <option key={item.id} value={item.chain_id}>{item.name}</option>)}
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Simbolo"><Input required value={tokenForm.symbol} onChange={(e) => setTokenForm({ ...tokenForm, symbol: e.target.value })} /></Field>
                <Field label="Nome"><Input required value={tokenForm.name} onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })} /></Field>
              </div>
              <Field label="Contrato"><Input value={tokenForm.contractAddress} onChange={(e) => setTokenForm({ ...tokenForm, contractAddress: e.target.value })} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Decimais"><Input inputMode="numeric" value={tokenForm.decimals} onChange={(e) => setTokenForm({ ...tokenForm, decimals: e.target.value })} /></Field>
                <label className="ios-control mt-6 flex h-11 items-center gap-3 px-3 text-sm text-slate-300">
                  <input type="checkbox" checked={Boolean(tokenForm.isNative)} onChange={(e) => setTokenForm({ ...tokenForm, isNative: e.target.checked })} />
                  Nativo
                </label>
              </div>
              <PrimaryButton busy={busy === "token"}><Plus size={16} />Salvar token</PrimaryButton>
            </form>
          </Panel>
          <Panel className="p-5 xl:col-span-2">
            <h2 className="text-lg font-semibold text-white">Redes e tokens</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {chains.map((chain) => (
                <div key={chain.id} className="ios-list-cell p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-white">{chain.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{chain.chain_key} / {chain.chain_id}</div>
                    </div>
                    <StatusPill value={chain.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tokenRows(tokens, chain.chain_id).map((token) => <span key={token.id} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">{token.symbol}</span>)}
                  </div>
                </div>
              ))}
              {!chains.length ? <Empty label="Nenhuma rede configurada" /> : null}
            </div>
          </Panel>
        </div>
      )}

      {loading && <div className="fixed inset-x-0 bottom-24 z-20 mx-auto w-fit rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-xl lg:bottom-6">Carregando tesouro</div>}
      {tab !== "dashboard" && wallets.length === 0 && tab !== "config" ? (
        <div className="rounded-[18px] border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          Cadastre redes, tokens e carteiras aprovadas para operar.
        </div>
      ) : null}
      {tab === "transfers" && transactions.some((item) => item.status === "failed") ? (
        <div className="rounded-[18px] border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-100">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} />Transacoes com erro</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {transactions.filter((item) => item.status === "failed").slice(0, 5).map((item) => (
              <SecondaryButton key={item.id} onClick={() => run(`retry-${item.id}`, () => treasuryApi.retryTransaction(item.id))}>
                Retry {short(item.id)}
              </SecondaryButton>
            ))}
          </div>
        </div>
      ) : null}
      <div className="h-2" />
    </div>
  );
}
