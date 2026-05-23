import { Menu, Plus } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const names = {
  "/": "Painel",
  "/new": "Nova operacao",
  "/orders": "Operacoes",
  "/settings": "Configuracoes"
};

export default function Topbar({ onMenu }) {
  const location = useLocation();
  const account = useAuthStore((state) => state.account);
  const title = names[location.pathname] || "Detalhes";
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-base-950/90 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-3 sm:h-16 sm:px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-white sm:text-lg">{title}</div>
            <div className="truncate text-xs text-slate-500">{account?.email || ""}</div>
          </div>
        </div>
        <NavLink to="/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white transition hover:bg-blue-400">
          <Plus size={17} />
          <span className="hidden sm:inline">Nova</span>
        </NavLink>
      </div>
    </header>
  );
}
