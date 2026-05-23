import { CheckCheck, FileText, Image, MessageCircle, Paperclip, Phone, Plus, RefreshCw, Search, Send, User, Video, Volume2, Wifi, WifiOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { compactDate } from "../lib/format";
import { createChannelThread, getChannelMessages, getChannelStatus, getChannelThreads, markChannelRead, sendChannelMessage } from "../lib/api";

const quickReplies = [
  "Ola, posso ajudar?",
  "Recebemos sua solicitacao.",
  "Sua operacao esta em acompanhamento.",
  "Ja retorno com a atualizacao."
];

const mediaTypes = [
  { id: "image", label: "Imagem", icon: Image },
  { id: "video", label: "Video", icon: Video },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "document", label: "Documento", icon: FileText }
];

const cleanPhone = (value) => String(value || "").replace(/\D/g, "").slice(0, 16);

function StateDot({ active }) {
  return (
    <span className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold ${active ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/[0.04] text-slate-400"}`}>
      {active ? <Wifi size={14} /> : <WifiOff size={14} />}
      {active ? "Conectado" : "Desconectado"}
    </span>
  );
}

function ThreadRow({ item, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`w-full rounded-[20px] border p-3 text-left transition ${active ? "border-blue-300/35 bg-blue-400/10" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-blue-100">
          <User size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-white">{item.name || item.address}</span>
            <span className="shrink-0 text-[11px] text-slate-500">{compactDate(item.lastAt)}</span>
          </span>
          <span className="mt-1 block truncate text-xs text-slate-500">{item.lastText || item.address}</span>
        </span>
        {item.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-500 px-1.5 text-[11px] font-bold text-white">{item.unread}</span>}
      </div>
    </button>
  );
}

function MessageBubble({ item }) {
  const outbound = item.direction === "outbound";
  return (
    <div className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[86%] rounded-[22px] border px-4 py-3 shadow-[0_14px_40px_rgba(0,0,0,0.22)] ${outbound ? "border-blue-300/25 bg-blue-500/18 text-white" : "border-white/10 bg-white/[0.055] text-slate-100"}`}>
        {item.mediaUrl && (
          <a href={item.mediaUrl} target="_blank" rel="noreferrer" className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-1 text-xs text-blue-100">
            <Paperclip size={13} />
            Midia
          </a>
        )}
        <div className="whitespace-pre-wrap text-sm leading-6">{item.body || item.type || "-"}</div>
        <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-slate-400">
          <span>{compactDate(item.createdAt)}</span>
          {outbound && <CheckCheck size={14} className={item.status === "read" ? "text-blue-200" : "text-slate-500"} />}
        </div>
      </div>
    </div>
  );
}

export default function WhatsApp() {
  const bottomRef = useRef(null);
  const [status, setStatus] = useState(null);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });
  const [mediaOpen, setMediaOpen] = useState(false);
  const [media, setMedia] = useState({ type: "image", url: "", caption: "" });

  const selected = useMemo(() => threads.find((item) => item.id === selectedId), [threads, selectedId]);
  const lastInbound = useMemo(() => [...messages].reverse().find((item) => item.direction === "inbound" && item.providerId), [messages]);

  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const data = await getChannelStatus();
        if (live) setStatus(data);
      } catch (nextError) {
        if (live) setError(nextError.response?.data?.error || "Falha ao carregar conexao");
      }
    };
    load();
    return () => {
      live = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let live = true;
    const timer = window.setTimeout(async () => {
      try {
        const items = await getChannelThreads({ search });
        if (!live) return;
        setThreads(items);
        if (!selectedId && items[0]) setSelectedId(items[0].id);
      } catch (nextError) {
        if (live) setError(nextError.response?.data?.error || "Falha ao carregar conversas");
      }
    }, 180);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [search, refreshKey, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return undefined;
    }
    let live = true;
    const load = async () => {
      try {
        const items = await getChannelMessages(selectedId);
        if (live) setMessages(items);
      } catch (nextError) {
        if (live) setError(nextError.response?.data?.error || "Falha ao carregar mensagens");
      }
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [selectedId, refreshKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, selectedId]);

  const reload = () => setRefreshKey((value) => value + 1);

  const createThread = async (event) => {
    event.preventDefault();
    const phone = cleanPhone(newContact.phone);
    if (!phone) return;
    setBusy(true);
    setError("");
    try {
      const data = await createChannelThread({ phone, name: newContact.name });
      setThreads((items) => [data.thread, ...items.filter((item) => item.id !== data.thread.id)]);
      setSelectedId(data.thread.id);
      setNewContact({ name: "", phone: "" });
    } catch (nextError) {
      setError(nextError.response?.data?.error || "Falha ao criar conversa");
    } finally {
      setBusy(false);
    }
  };

  const sendText = async () => {
    const body = draft.trim();
    if (!selected || !body || sending) return;
    setSending(true);
    setError("");
    try {
      const data = await sendChannelMessage({ threadId: selected.id, type: "text", body });
      setMessages((items) => [...items, data.message]);
      setDraft("");
      reload();
    } catch (nextError) {
      setError(nextError.response?.data?.error || "Falha ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const sendMedia = async () => {
    if (!selected || !media.url.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const data = await sendChannelMessage({ threadId: selected.id, type: media.type, mediaUrl: media.url.trim(), body: media.caption.trim() });
      setMessages((items) => [...items, data.message]);
      setMedia({ type: media.type, url: "", caption: "" });
      setMediaOpen(false);
      reload();
    } catch (nextError) {
      setError(nextError.response?.data?.error || "Falha ao enviar midia");
    } finally {
      setSending(false);
    }
  };

  const read = async () => {
    if (!lastInbound) return;
    try {
      await markChannelRead(lastInbound.providerId);
      reload();
    } catch (nextError) {
      setError(nextError.response?.data?.error || "Falha ao marcar leitura");
    }
  };

  return (
    <div className="grid gap-4 lg:h-[calc(100vh-2rem)] xl:grid-cols-[360px_minmax(0,1fr)_310px]">
      <aside className="ios-surface flex min-h-[560px] flex-col overflow-hidden lg:min-h-0">
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">WhatsApp</h2>
              <div className="mt-1 text-xs text-slate-500">{status?.phoneNumberId || "Canal operacional"}</div>
            </div>
            <StateDot active={status?.connected} />
          </div>
          <div className="ios-control mt-4 flex h-11 items-center gap-2 px-3">
            <Search size={16} className="text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar conversa" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
          </div>
        </div>

        <form onSubmit={createThread} className="border-b border-white/10 p-4">
          <div className="grid gap-2">
            <div className="ios-control flex h-11 items-center gap-2 px-3">
              <Phone size={16} className="text-slate-500" />
              <input value={newContact.phone} onChange={(event) => setNewContact((item) => ({ ...item, phone: cleanPhone(event.target.value) }))} placeholder="Telefone com DDI" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
            </div>
            <div className="ios-control flex h-11 items-center gap-2 px-3">
              <User size={16} className="text-slate-500" />
              <input value={newContact.name} onChange={(event) => setNewContact((item) => ({ ...item, name: event.target.value }))} placeholder="Nome opcional" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
            </div>
            <button type="submit" disabled={busy} className="ios-button-primary inline-flex h-10 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:opacity-60">
              <Plus size={16} />
              Nova conversa
            </button>
          </div>
        </form>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {threads.map((item) => <ThreadRow key={item.id} item={item} active={item.id === selectedId} onClick={() => setSelectedId(item.id)} />)}
          {!threads.length && <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-center text-sm text-slate-500">Nenhuma conversa</div>}
        </div>
      </aside>

      <section className="ios-surface flex min-h-[640px] flex-col overflow-hidden lg:min-h-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-white">{selected?.name || selected?.address || "Selecione uma conversa"}</div>
            <div className="mt-1 truncate text-xs text-slate-500">{selected?.address || "Mensagens"}</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={read} disabled={!lastInbound} className="ios-button-secondary grid h-10 w-10 place-items-center text-slate-300 disabled:opacity-40" title="Marcar como lida">
              <CheckCheck size={17} />
            </button>
            <button type="button" onClick={reload} className="ios-button-secondary grid h-10 w-10 place-items-center text-slate-300" title="Atualizar">
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        {error && <div className="mx-4 mt-4 rounded-[18px] border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-100">{error}</div>}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((item) => <MessageBubble key={item.id || item.providerId} item={item} />)}
          {!messages.length && <div className="grid h-full place-items-center text-sm text-slate-500">Sem mensagens</div>}
          <div ref={bottomRef} />
        </div>

        {selected && (
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {quickReplies.map((item) => (
                <button key={item} type="button" onClick={() => setDraft(item)} className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
                  {item}
                </button>
              ))}
            </div>
            {mediaOpen && (
              <div className="mb-3 rounded-[22px] border border-white/10 bg-white/[0.035] p-3">
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {mediaTypes.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.id} type="button" onClick={() => setMedia((current) => ({ ...current, type: item.id }))} className={`flex h-10 items-center justify-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${media.type === item.id ? "border-blue-300/35 bg-blue-500/20 text-white" : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10"}`}>
                        <Icon size={14} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <div className="grid gap-2">
                  <input value={media.url} onChange={(event) => setMedia((item) => ({ ...item, url: event.target.value }))} placeholder="URL da midia" className="ios-control h-11 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-600" />
                  <input value={media.caption} onChange={(event) => setMedia((item) => ({ ...item, caption: event.target.value }))} placeholder="Legenda opcional" className="ios-control h-11 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-600" />
                  <button type="button" onClick={sendMedia} disabled={sending || !media.url.trim()} className="ios-button-primary h-10 px-4 text-sm font-semibold disabled:opacity-60">Enviar midia</button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2">
              <button type="button" onClick={() => setMediaOpen((value) => !value)} className="ios-button-secondary grid h-12 w-12 shrink-0 place-items-center text-slate-300">
                <Paperclip size={18} />
              </button>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendText();
                }
              }} placeholder="Mensagem" rows={1} className="ios-control max-h-32 min-h-12 flex-1 resize-none bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
              <button type="button" onClick={sendText} disabled={sending || !draft.trim()} className="ios-button-primary grid h-12 w-12 shrink-0 place-items-center disabled:opacity-60">
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </section>

      <aside className="ios-surface hidden min-h-0 flex-col overflow-hidden xl:flex">
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-blue-100">
              <MessageCircle size={17} />
            </span>
            <div>
              <div className="text-sm font-semibold text-white">Canal</div>
              <div className="text-xs text-slate-500">{status?.graphVersion || "Graph"}</div>
            </div>
          </div>
        </div>
        <div className="space-y-4 overflow-y-auto p-4">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Status</div>
            <div className="mt-3"><StateDot active={status?.connected} /></div>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Webhook</div>
            <div className="mt-2 break-all font-mono text-xs text-slate-300">{status?.webhookUrl || "-"}</div>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Contato</div>
            <div className="mt-3 text-sm font-semibold text-white">{selected?.name || "-"}</div>
            <div className="mt-1 break-all text-xs text-slate-500">{selected?.address || "-"}</div>
            <div className="mt-3 text-xs text-slate-500">Ultima atividade</div>
            <div className="mt-1 text-sm text-slate-300">{compactDate(selected?.lastAt)}</div>
          </div>
        </div>
      </aside>
    </div>
  );
}
