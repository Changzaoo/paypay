import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NewOrder from "./pages/NewOrder";
import OrderDetails from "./pages/OrderDetails";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import { useAuthStore } from "./store/authStore";

function Guard({ children }) {
  const session = useAuthStore((state) => state.session);
  const account = useAuthStore((state) => state.account);
  const loading = useAuthStore((state) => state.loading);
  const syncing = useAuthStore((state) => state.syncing);
  const error = useAuthStore((state) => state.error);
  const sync = useAuthStore((state) => state.sync);
  const signOut = useAuthStore((state) => state.signOut);
  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-transparent text-sm text-slate-500">Carregando...</div>;
  }
  if (!session) return <Navigate to="/login" replace />;
  if (syncing && !account) {
    return <div className="grid min-h-screen place-items-center bg-transparent text-sm text-slate-500">Validando acesso...</div>;
  }
  if (!account) {
    return (
      <div className="grid min-h-screen place-items-center bg-transparent px-4">
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.055] p-5 text-center shadow-glass backdrop-blur-xl">
          <div className="text-base font-semibold text-white">Conexao indisponivel</div>
          <div className="mt-2 text-sm text-slate-500">{error || "Verifique a URL da API."}</div>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" onClick={sync} className="h-10 rounded-lg bg-white px-4 text-sm font-semibold text-base-950 transition hover:bg-slate-100">
              Tentar novamente
            </button>
            <button type="button" onClick={signOut} className="h-10 rounded-lg border border-white/10 px-4 text-sm font-medium text-slate-200 transition hover:bg-white/10">
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }
  return children;
}

export default function App() {
  const init = useAuthStore((state) => state.init);
  useEffect(() => {
    init();
  }, [init]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Guard><Layout /></Guard>}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<NewOrder />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetails />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
