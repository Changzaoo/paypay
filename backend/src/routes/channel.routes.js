import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.js";
import * as db from "../services/db.service.js";
import * as provider from "../services/providerD.service.js";
import { parseBody } from "../utils/validators.js";

const router = Router();

const cleanText = (max = 500) => z.preprocess((value) => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next ? next.slice(0, max) : undefined;
}, z.string().max(max).optional());

const phoneValue = z.preprocess((value) => String(value || "").replace(/\D/g, ""), z.string().min(8).max(16));

const threadSchema = z.object({
  phone: phoneValue,
  name: cleanText(120)
});

const messageSchema = z.object({
  threadId: cleanText(80),
  phone: phoneValue.optional(),
  type: z.enum(["text", "image", "video", "audio", "document"]).default("text"),
  body: cleanText(4096),
  mediaUrl: cleanText(1000)
}).superRefine((value, context) => {
  if (!value.threadId && !value.phone) context.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "destino ausente" });
  if (value.type === "text" && !value.body) context.addIssue({ code: z.ZodIssueCode.custom, path: ["body"], message: "mensagem ausente" });
  if (value.type !== "text" && !value.mediaUrl) context.addIssue({ code: z.ZodIssueCode.custom, path: ["mediaUrl"], message: "midia ausente" });
});

const missingStorage = (error) => {
  const text = `${error?.message || ""} ${error?.code || ""}`.toLowerCase();
  return text.includes("internal_threads") || text.includes("internal_messages") || text.includes("schema cache") || text.includes("does not exist") || text.includes("42p01") || text.includes("pgrst205");
};

const providerError = (error) => {
  const remote = error.response?.data?.error;
  if (!remote) return error;
  const next = new Error(remote.message || "Falha no canal");
  next.status = error.response?.status || 502;
  return next;
};

const shapeThread = (row = {}) => ({
  id: row.id,
  name: row.display_name,
  address: row.address,
  lastText: row.last_text,
  lastAt: row.last_event_at || row.created_at,
  unread: Number(row.unread_count || 0),
  state: row.state || "open",
  tags: Array.isArray(row.tags) ? row.tags : []
});

const shapeMessage = (row = {}) => ({
  id: row.id,
  threadId: row.thread_id,
  providerId: row.provider_ref,
  direction: row.direction,
  type: row.kind,
  body: row.body,
  mediaUrl: row.media_url,
  status: row.status,
  createdAt: row.created_at
});

const touchThread = async ({ phone, name, lastText, raw, unread = 0 }) => {
  let existing = null;
  try {
    existing = await db.getChannelThread(phone);
  } catch (error) {
    if (error.status !== 404) throw error;
  }
  const now = new Date().toISOString();
  if (existing) {
    return db.updateChannelThread(existing.id, {
      display_name: name || existing.display_name,
      address: phone,
      last_text: lastText ?? existing.last_text,
      last_event_at: lastText ? now : existing.last_event_at,
      unread_count: Math.max(0, Number(existing.unread_count || 0) + unread),
      raw: raw || existing.raw
    });
  }
  return db.upsertChannelThread({
    provider: "channel",
    channel_ref: phone,
    display_name: name,
    address: phone,
    last_text: lastText,
    last_event_at: now,
    unread_count: Math.max(0, unread),
    state: "open",
    tags: [],
    raw: raw || {}
  });
};

router.use(requireAuth);

router.get("/status", async (req, res, next) => {
  try {
    let storage = true;
    try {
      await db.listChannelThreads({});
    } catch (error) {
      if (!missingStorage(error)) throw error;
      storage = false;
    }
    res.json({ ...provider.status(), storage });
  } catch (error) {
    next(error);
  }
});

router.get("/threads", async (req, res, next) => {
  try {
    try {
      const items = await db.listChannelThreads({ search: req.query.search });
      res.json({ items: items.map(shapeThread) });
    } catch (error) {
      if (!missingStorage(error)) throw error;
      res.json({ items: [] });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/threads", async (req, res, next) => {
  try {
    const body = parseBody(threadSchema, req.body);
    const thread = await touchThread({ phone: body.phone, name: body.name, lastText: "" });
    res.status(201).json({ thread: shapeThread(thread) });
  } catch (error) {
    next(error);
  }
});

router.get("/threads/:id/messages", async (req, res, next) => {
  try {
    const thread = await db.getChannelThread(req.params.id);
    const items = await db.listChannelMessages(thread.id);
    res.json({ items: items.map(shapeMessage) });
  } catch (error) {
    if (missingStorage(error)) {
      res.json({ items: [] });
      return;
    }
    next(error);
  }
});

router.post("/messages", async (req, res, next) => {
  try {
    const body = parseBody(messageSchema, req.body);
    const thread = body.threadId ? await db.getChannelThread(body.threadId) : await touchThread({ phone: body.phone, lastText: "" });
    const remote = body.type === "text"
      ? await provider.sendText({ to: thread.channel_ref, body: body.body })
      : await provider.sendMedia({ to: thread.channel_ref, type: body.type, link: body.mediaUrl, caption: body.body });
    const providerRef = remote?.messages?.[0]?.id;
    const message = await db.insertChannelMessage({
      thread_id: thread.id,
      provider: "channel",
      provider_ref: providerRef,
      direction: "outbound",
      kind: body.type,
      body: body.body,
      media_url: body.mediaUrl,
      status: remote?.messages?.[0]?.message_status || "sent",
      payload: remote || {}
    });
    await db.updateChannelThread(thread.id, {
      last_text: body.body || body.type,
      last_event_at: new Date().toISOString(),
      unread_count: 0
    });
    res.status(201).json({ message: shapeMessage(message), remote });
  } catch (error) {
    next(providerError(error));
  }
});

router.post("/messages/:id/read", async (req, res, next) => {
  try {
    const remote = await provider.markRead(req.params.id);
    const message = await db.updateChannelMessageByProviderRef(req.params.id, { status: "read" });
    res.json({ ok: true, message: message ? shapeMessage(message) : null, remote });
  } catch (error) {
    next(providerError(error));
  }
});

export default router;
