import { BarChart3, Plus, Settings, Table2 } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useViewport } from "../hooks/useViewport";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const mobile = [
  { to: "/", label: "Painel", icon: BarChart3 },
  { to: "/new", label: "Nova", icon: Plus },
  { to: "/orders", label: "Historico", icon: Table2 },
  { to: "/settings", label: "Ajustes", icon: Settings }
];

export default function Layout() {
  const viewport = useViewport();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (viewport.isDesktop) setMenuOpen(false);
  }, [viewport.isDesktop]);
  return (
    <div className="min-h-screen bg-base-950" data-screen={viewport.kind}>
      <Sidebar mode="desktop" />
      <Sidebar mode="mobile" open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-h-screen lg:pl-64">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="px-3 py-4 pb-24 sm:px-4 sm:py-5 lg:px-8 lg:py-6">
          <Outlet />
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/10 bg-base-950/95 backdrop-blur lg:hidden">
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
