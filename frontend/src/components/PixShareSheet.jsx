import { Check, Copy, ExternalLink, Image, Loader2, MessageCircle, QrCode, Send, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getChannelThreads, sendChannelMessage } from "../lib/api";
import { money } from "../lib/format";

const cleanPhone = (value) => String(value || "").replace(/\D/g, "").slice(0, 16);

export default function PixShareSheet({ open, onClose, order }) {
  const qrCode = order?.qrCode || order?.input?.qrCode || "";
  const qrImageUrl = order?.qrImageUrl || order?.input?.qrImageUrl || "";
  const [mode, setMode] = useState("code");
  const [threads, setThreads] = useState([]);
  const [threadId, setThreadId] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  const text = useMemo(() => {
    const lines = ["PIX", `Valor: ${money(order?.amountBrl)}`, "", "Copia e cola:", qrCode].filter(Boolean);
    if (mode === "qr" && qrImageUrl) lines.push("", `QR: ${qrImageUrl}`);
    return lines.join("\n");
  }, [mode, order?.amountBrl, qrCode, qrImageUrl]);

  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    setDone("");
    setError("");
    getChannelThreads()
      .then((items) => {
        if (!live) return;
        setThreads(items);
        if (!threadId && items[0]) setThreadId(items[0].id);
      })
      .catch(() => {
        if (live) setThreads([]);
      });
    return () => {
      live = false;
    };
  }, [open, threadId]);

  if (!open) return null;

  const sendInternal = async () => {
    const nextPhone = cleanPhone(phone);
    if (!threadId && !nextPhone) {
      setError("Informe uma conversa ou telefone");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        threadId: threadId || undefined,
        phone: threadId ? undefined : nextPhone,
        type: mode === "qr" && qrImageUrl ? "image" : "text",
        body: text,
        mediaUrl: mode === "qr" && qrImageUrl ? qrImageUrl : undefined
      };
      await sendChannelMessage(payload);
      setDone("Enviado");
    } catch (nextError) {
      setError(nextError.response?.data?.error || "Falha ao enviar");
    } finally {
      setBusy(false);
    }
  };

  const openNative = () => {
    const nextPhone = cleanPhone(phone);
    const base = nextPhone ? `https://wa.me/${nextPhone}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const shareNative = async () => {
    if (!navigator.share) {
      openNative();
      return;
    }
    try {
      const payload = { title: "PIX", text };
      if (mode === "qr" && qrImageUrl) payload.url = qrImageUrl;
      await navigator.share(payload);
      setDone("Compartilhado");
    } catch {
      setDone("");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setDone("Copiado");
  };

  return (
    <div className="ios-share-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-black/55 px-3 py-4 backdrop-blur-xl sm:items-center">
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 cursor-default" />
      <section className="ios-share-sheet ios-surface-strong relative w-full max-w-lg overflow-hidden p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-blue-100">
              <Share2 size={18} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Compartilhar PIX</h3>
              <div className="text-xs text-slate-500">{money(order?.amountBrl)}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="ios-button-secondary grid h-10 w-10 place-items-center text-slate-300 transition hover:bg-white/10">
            <X size={17} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-[22px] border border-white/10 bg-white/[0.035] p-2">
          <button type="button" onClick={() => setMode("code")} className={`flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${mode === "code" ? "brand-gradient text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}>
            <QrCode size={16} />
            Codigo
          </button>
          <button type="button" onClick={() => setMode("qr")} className={`flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${mode === "qr" ? "brand-gradient text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}>
            <Image size={16} />
            QR
          </button>
        </div>

        <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.035] p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Mensagem</div>
          <div className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-300">{text || "-"}</div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px]">
          <select value={threadId} onChange={(event) => setThreadId(event.target.value)} className="ios-control h-11 bg-transparent px-3 text-sm text-white outline-none">
            <option value="">Nova conversa</option>
            {threads.map((item) => (
              <option key={item.id} value={item.id}>{item.name || item.address}</option>
            ))}
          </select>
          <input value={phone} onChange={(event) => setPhone(cleanPhone(event.target.value))} placeholder="Telefone" className="ios-control h-11 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-600" />
        </div>

        {mode === "qr" && !qrImageUrl && <div className="mt-3 rounded-[18px] border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100">QR sem imagem publica. O envio usara o codigo PIX.</div>}
        {error && <div className="mt-3 rounded-[18px] border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-100">{error}</div>}
        {done && <div className="ios-share-done mt-3 flex items-center gap-2 rounded-[18px] border border-emerald-300/25 bg-emerald-400/10 p-3 text-sm text-emerald-100"><Check size={16} />{done}</div>}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={sendInternal} disabled={busy || !qrCode} className="ios-button-primary inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Enviar no app
          </button>
          <button type="button" onClick={openNative} disabled={!qrCode} className="ios-button-secondary inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-60">
            <MessageCircle size={16} />
            Abrir WhatsApp
          </button>
          <button type="button" onClick={shareNative} disabled={!qrCode} className="ios-button-secondary inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-60">
            <ExternalLink size={16} />
            Compartilhar
          </button>
          <button type="button" onClick={copy} disabled={!qrCode} className="ios-button-secondary inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-60">
            <Copy size={16} />
            Copiar
          </button>
        </div>
      </section>
    </div>
  );
}
