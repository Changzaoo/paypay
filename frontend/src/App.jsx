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
  const error = useAuthStore((state) => state.error);
  const signOut = useAuthStore((state) => state.signOut);
  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-base-950 text-sm text-slate-500">Carregando...</div>;
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!account) {
    return (
      <div className="grid min-h-screen place-items-center bg-base-950 px-4">
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-base-900 p-5 text-center">
          <div className="text-base font-semibold text-white">Conexão indisponível</div>
          <div className="mt-2 text-sm text-slate-500">{error || "Verifique a URL da API."}</div>
          <button type="button" onClick={signOut} className="mt-5 h-10 rounded-lg border border-white/10 px-4 text-sm font-medium text-slate-200 transition hover:bg-white/5">
            Sair
          </button>
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
