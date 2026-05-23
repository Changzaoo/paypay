import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { compactDate, money, shortHash, shortId } from "../lib/format";
import StatusBadge from "./StatusBadge";

export default function OrderTable({ items = [] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-base-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500">
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
            {items.map((item) => (
              <tr key={item.id} className="text-slate-300">
                <td className="px-4 py-3 font-mono text-xs text-white">{shortId(item.publicId)}</td>
                <td className="px-4 py-3">{money(item.amountBrl)}</td>
                <td className="px-4 py-3">{item.outputAsset}</td>
                <td className="px-4 py-3 capitalize">{item.outputNetwork}</td>
                <td className="px-4 py-3"><StatusBadge value={item.status} /></td>
                <td className="px-4 py-3">{compactDate(item.createdAt)}</td>
                <td className="px-4 py-3 font-mono text-xs">{shortHash(item.settlement?.txid)}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/orders/${item.publicId || item.id}`} className="inline-grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5 hover:text-white" title="Detalhes">
                    <ExternalLink size={16} />
                  </Link>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan="8" className="px-4 py-10 text-center text-sm text-slate-500">Nenhuma operação encontrada</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
