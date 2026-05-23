import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useViewport } from "../hooks/useViewport";
import { compactDate, money, shortHash, shortId } from "../lib/format";
import StatusBadge from "./StatusBadge";

export default function OrderTable({ items = [] }) {
  const viewport = useViewport();
  const rows = Array.isArray(items) ? items : [];
  if (viewport.isMobile) {
    return (
      <div className="space-y-3">
        {rows.map((item) => (
          <article key={item.id} className="ios-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-xs text-slate-500">{shortId(item.publicId)}</div>
                <div className="mt-1 text-lg font-semibold text-white">{money(item.amountBrl)}</div>
              </div>
              <StatusBadge value={item.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Ativo</div>
                <div className="mt-1 text-slate-200">{item.outputAsset || "-"}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Rede</div>
                <div className="mt-1 capitalize text-slate-200">{item.outputNetwork || "-"}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Data</div>
                <div className="mt-1 text-slate-200">{compactDate(item.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Tx final</div>
                <div className="mt-1 font-mono text-xs text-slate-200">{shortHash(item.settlement?.txid)}</div>
              </div>
            </div>
            <Link to={`/orders/${item.publicId || item.id}`} className="ios-button-secondary mt-4 inline-flex h-10 w-full items-center justify-center gap-2 text-sm font-medium transition hover:bg-white/10">
              Detalhes
              <ExternalLink size={16} />
            </Link>
          </article>
        ))}
        {!rows.length && (
          <div className="ios-surface px-4 py-10 text-center text-sm text-slate-500">Nenhuma operacao encontrada</div>
        )}
      </div>
    );
  }
  return (
    <div className="ios-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Ativo</th>
              <th className="px-4 py-3 font-medium">Rede</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Tx final</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((item) => (
              <tr key={item.id} className="text-slate-300">
                <td className="px-4 py-3 font-mono text-xs text-white">{shortId(item.publicId)}</td>
                <td className="px-4 py-3">{money(item.amountBrl)}</td>
                <td className="px-4 py-3">{item.outputAsset}</td>
                <td className="px-4 py-3 capitalize">{item.outputNetwork}</td>
                <td className="px-4 py-3"><StatusBadge value={item.status} /></td>
                <td className="px-4 py-3">{compactDate(item.createdAt)}</td>
                <td className="px-4 py-3 font-mono text-xs">{shortHash(item.settlement?.txid)}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/orders/${item.publicId || item.id}`} className="ios-button-secondary inline-grid h-9 w-9 place-items-center text-slate-300 transition hover:bg-white/10 hover:text-white" title="Detalhes">
                    <ExternalLink size={16} />
                  </Link>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan="8" className="px-4 py-10 text-center text-sm text-slate-500">Nenhuma operacao encontrada</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
