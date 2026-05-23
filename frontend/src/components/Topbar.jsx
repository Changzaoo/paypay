import { Plus } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const names = {
  "/": "Painel",
  "/new": "Nova operação",
  "/orders": "Operações",
  "/settings": "Configurações"
};

export default function Topbar() {
  const location = useLocation();
  const account = useAuthStore((state) => state.account);
  const title = names[location.pathname] || "Detalhes";
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-base-950/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div>
            <div className="text-lg font-semibold text-white">{title}</div>
            <div className="truncate text-xs text-slate-500">{account?.email || ""}</div>
          </div>
        </div>
        <NavLink to="/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white transition hover:bg-blue-400">
          <Plus size={17} />
          Nova
        </NavLink>
      </div>
    </header>
  );
}
