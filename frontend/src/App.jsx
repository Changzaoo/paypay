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
  const loading = useAuthStore((state) => state.loading);
  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-base-950 text-sm text-slate-500">Carregando...</div>;
  }
  if (!session) return <Navigate to="/login" replace />;
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
