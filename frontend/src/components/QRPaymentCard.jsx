import { QRCodeCanvas } from "qrcode.react";
import CopyBox from "./CopyBox";
import { compactDate, money } from "../lib/format";

export default function QRPaymentCard({ order }) {
  const qrCode = order?.qrCode || order?.input?.qrCode;
  const qrImageUrl = order?.qrImageUrl || order?.input?.qrImageUrl;
  const expiresAt = order?.expiresAt || order?.input?.expiresAt;
  const amount = order?.amountBrl;
  return (
    <div className="ios-surface grid gap-5 p-5 lg:grid-cols-[220px_1fr]">
      <div className="grid place-items-center rounded-[22px] border border-white/20 bg-white p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
        {qrCode ? <QRCodeCanvas value={qrCode} size={190} includeMargin /> : qrImageUrl ? <img src={qrImageUrl} alt="QR" className="h-48 w-48 object-contain" /> : <div className="grid h-48 w-48 place-items-center text-sm text-slate-500">QR</div>}
      </div>
      <div className="min-w-0 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Valor</div>
            <div className="mt-1 text-2xl font-semibold text-white">{money(amount)}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Expiração</div>
            <div className="mt-1 text-sm text-slate-200">{compactDate(expiresAt)}</div>
          </div>
        </div>
        <CopyBox value={qrCode} label="Copia e cola" />
      </div>
    </div>
  );
}
