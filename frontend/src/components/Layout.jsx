import { BarChart3, Plus, Settings, Table2 } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const hideTopbar = location.pathname === "/new";
  useEffect(() => {
    if (viewport.isDesktop) setMenuOpen(false);
  }, [viewport.isDesktop]);
  return (
    <div className="min-h-screen bg-transparent" data-screen={viewport.kind}>
      <Sidebar mode="desktop" />
      <Sidebar mode="mobile" open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-h-screen lg:pl-72">
        {!hideTopbar && <Topbar onMenu={() => setMenuOpen(true)} />}
        <main className="px-3 py-4 pb-28 sm:px-4 sm:py-5 lg:px-8 lg:py-7">
          <Outlet />
        </main>
      </div>
      <nav className="ios-dock fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 px-2 lg:hidden">
        {mobile.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition ${isActive ? "text-white" : "text-slate-500"}`}>
              {({ isActive }) => (
                <>
                  <span className={`grid h-8 w-10 place-items-center rounded-full transition ${isActive ? "bg-white text-base-950" : "text-slate-500"}`}>
                    <Icon size={18} />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
