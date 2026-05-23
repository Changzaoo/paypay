import { Lock } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import BrandMark from "../components/BrandMark";
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
    <div className="grid min-h-screen place-items-center bg-transparent px-4">
      <form onSubmit={submit} className="ios-surface w-full max-w-md p-6">
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <BrandMark size="lg" />
            <div className="ios-control grid h-12 w-12 place-items-center text-cyan-200">
              <Lock size={21} />
            </div>
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
              className="ios-control h-11 w-full px-3 text-sm text-white outline-none transition"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Senha</span>
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="ios-control h-11 w-full px-3 text-sm text-white outline-none transition"
            />
          </label>
          {error && <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</div>}
          <button
            type="submit"
            disabled={loading || busy}
            className="ios-button-primary h-11 w-full text-sm font-semibold transition hover:bg-slate-100 disabled:opacity-60"
          >
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
}
