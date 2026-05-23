import { Lock } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const signIn = useAuthStore((state) => state.signIn);
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  if (session) return <Navigate to="/" replace />;
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await signIn(form);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid min-h-screen place-items-center bg-base-950 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-white/10 bg-base-900 p-6 shadow-panel">
        <div className="mb-8">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg border border-white/10 bg-base-950 text-blue-200">
            <Lock size={21} />
          </div>
          <h1 className="text-2xl font-semibold text-white">Acesso interno</h1>
          <p className="mt-2 text-sm text-slate-500">Entre com uma conta autorizada.</p>
        </div>
        <div className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="h-11 w-full rounded-lg border border-white/10 bg-base-950 px-3 text-sm text-white outline-none transition focus:border-blue-400/60"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Senha</span>
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="h-11 w-full rounded-lg border border-white/10 bg-base-950 px-3 text-sm text-white outline-none transition focus:border-blue-400/60"
            />
          </label>
          {error && <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</div>}
          <button
            type="submit"
            disabled={loading || busy}
            className="h-11 w-full rounded-lg bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60"
          >
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
}
