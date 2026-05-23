import { BarChart3, LogOut, Plus, Settings, Table2, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const links = [
  { to: "/", label: "Painel", icon: BarChart3 },
  { to: "/new", label: "Nova operacao", icon: Plus },
  { to: "/orders", label: "Operacoes", icon: Table2 },
  { to: "/settings", label: "Configuracoes", icon: Settings }
];

function Content({ onNavigate }) {
  const signOut = useAuthStore((state) => state.signOut);
  return (
    <>
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <div className="text-lg font-semibold text-white">Operacoes</div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) => `flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${isActive ? "bg-white text-base-950" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            signOut();
          }}
          className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </>
  );
}

export default function Sidebar({ mode = "desktop", open = false, onClose }) {
  if (mode === "mobile") {
    return (
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={onClose}
          className={`absolute inset-0 bg-black/70 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside className={`absolute inset-y-0 left-0 flex w-[min(84vw,320px)] flex-col border-r border-white/10 bg-base-950 shadow-panel transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Fechar menu"
          >
            <X size={19} />
          </button>
          <Content onNavigate={onClose} />
        </aside>
      </div>
    );
  }
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-base-950 lg:flex lg:flex-col">
      <Content />
    </aside>
  );
}
