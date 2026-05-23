import { BarChart3, MessageCircle, Plus, Table2 } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useViewport } from "../hooks/useViewport";
import Sidebar from "./Sidebar";

const mobile = [
  { to: "/", label: "Painel", icon: BarChart3 },
  { to: "/new", label: "Nova", icon: Plus },
  { to: "/orders", label: "Historico", icon: Table2 },
  { to: "/whatsapp", label: "WhatsApp", icon: MessageCircle }
];

export default function Layout() {
  const viewport = useViewport();
  return (
    <div className="min-h-screen bg-transparent" data-screen={viewport.kind}>
      <Sidebar mode="desktop" />
      <div className="min-h-screen lg:pl-72">
        <main className="px-3 py-4 pb-28 sm:px-4 lg:px-8 lg:py-4 lg:pb-4">
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
                  <span className={`grid h-8 w-10 place-items-center rounded-full transition ${isActive ? "brand-gradient text-white" : "text-slate-500"}`}>
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
