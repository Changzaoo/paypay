import { BarChart3, Plus, Settings, Table2 } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const mobile = [
  { to: "/", label: "Painel", icon: BarChart3 },
  { to: "/new", label: "Nova", icon: Plus },
  { to: "/orders", label: "Histórico", icon: Table2 },
  { to: "/settings", label: "Ajustes", icon: Settings }
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-base-950">
      <Sidebar />
      <div className="min-h-screen lg:pl-64">
        <Topbar />
        <main className="px-4 py-6 pb-24 lg:px-8">
          <Outlet />
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/10 bg-base-950 lg:hidden">
        {mobile.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${isActive ? "text-white" : "text-slate-500"}`}>
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
