import { BarChart3, LogOut, Plus, Settings, Table2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const links = [
  { to: "/", label: "Painel", icon: BarChart3 },
  { to: "/new", label: "Nova operação", icon: Plus },
  { to: "/orders", label: "Operações", icon: Table2 },
  { to: "/settings", label: "Configurações", icon: Settings }
];

export default function Sidebar() {
  const signOut = useAuthStore((state) => state.signOut);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-base-950 lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <div className="text-lg font-semibold text-white">Operações</div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
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
          onClick={signOut}
          className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
