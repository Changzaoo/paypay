import { Check, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useOrderStore } from "../store/orderStore";

const labels = {
  account: "Base",
  entry: "Entrada",
  route: "Rota",
  settlement: "Liquidação"
};

const allNetworks = ["bitcoin", "ethereum", "arbitrum", "base", "polygon", "bsc"];

export default function Settings() {
  const account = useAuthStore((state) => state.account);
  const config = useOrderStore((state) => state.config);
  const settings = useOrderStore((state) => state.settings);
  const loadConfig = useOrderStore((state) => state.loadConfig);
  const loadSettings = useOrderStore((state) => state.loadSettings);
  const saveSettings = useOrderStore((state) => state.saveSettings);
  const ping = useOrderStore((state) => state.ping);
  const [mode, setMode] = useState("manual");
  const [enabled, setEnabled] = useState(allNetworks);
  const [testing, setTesting] = useState("");
  const [ok, setOk] = useState("");
  useEffect(() => {
    loadConfig();
    loadSettings();
  }, [loadConfig, loadSettings]);
  useEffect(() => {
    if (settings?.intermediateMode?.mode) setMode(settings.intermediateMode.mode);
    if (settings?.enabledNetworks?.networks) setEnabled(settings.enabledNetworks.networks);
  }, [settings]);
  const toggle = (network) => {
    setEnabled((current) => current.includes(network) ? current.filter((item) => item !== network) : [...current, network]);
  };
  const test = async (name) => {
    setTesting(name);
    setOk("");
    try {
      if (name === "account") await loadConfig();
      else await ping();
      setOk(name);
    } finally {
      setTesting("");
    }
  };
  const save = async () => {
    await saveSettings({
      intermediateMode: { mode },
      enabledNetworks: { networks: enabled }
    });
  };
  return (
    <div className="space-y-6">
      <section className="ios-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Configurações</h2>
            <p className="mt-1 text-sm text-slate-500">Parâmetros operacionais do painel.</p>
          </div>
          {account?.isAdmin && (
            <button type="button" onClick={save} className="ios-button-primary inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold transition hover:bg-slate-100">
              <Save size={16} />
              Salvar
            </button>
          )}
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">URL backend</span>
          <input readOnly value={import.meta.env.VITE_API_URL || config?.backendUrl || ""} className="ios-control h-11 w-full px-3 text-sm text-slate-300 outline-none" />
        </label>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        {Object.entries(labels).map(([key, label]) => (
          <div key={key} className="ios-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className={`mt-1 text-xs ${config?.status?.[key] ? "text-emerald-300" : "text-amber-300"}`}>{config?.status?.[key] ? "Ativo" : "Pendente"}</div>
              </div>
              {ok === key && <Check size={18} className="text-emerald-300" />}
            </div>
            <button type="button" onClick={() => test(key)} className="ios-button-secondary inline-flex h-9 items-center gap-2 px-3 text-sm font-medium transition hover:bg-white/10">
              <RefreshCw size={15} className={testing === key ? "animate-spin" : ""} />
              Testar
            </button>
          </div>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="ios-surface p-5">
          <h3 className="text-base font-semibold text-white">Redes habilitadas</h3>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {allNetworks.map((network) => (
              <button
                key={network}
                type="button"
                onClick={() => account?.isAdmin && toggle(network)}
                className={`h-10 rounded-full border px-3 text-sm font-medium capitalize transition ${enabled.includes(network) ? "border-blue-200/35 bg-blue-300/10 text-blue-100" : "border-white/10 bg-white/[0.045] text-slate-500"}`}
              >
                {network}
              </button>
            ))}
          </div>
        </div>
        <div className="ios-surface p-5">
          <h3 className="text-base font-semibold text-white">Modo intermediário</h3>
          <div className="ios-control mt-4 inline-grid grid-cols-2 overflow-hidden p-1">
            {["manual", "automatic"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => account?.isAdmin && setMode(item)}
                className={`h-10 min-w-28 rounded-full px-3 text-sm font-semibold transition ${mode === item ? "brand-gradient text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
              >
                {item === "manual" ? "Manual" : "Automático"}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
