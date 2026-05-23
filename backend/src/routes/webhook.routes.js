import { Router } from "express";
import { handleProviderEvent } from "../services/flow.service.js";
import * as db from "../services/db.service.js";
import * as provider from "../services/providerD.service.js";

const router = Router();

const missingStorage = (error) => {
  const text = `${error?.message || ""} ${error?.code || ""}`.toLowerCase();
  return text.includes("internal_threads") || text.includes("internal_messages") || text.includes("schema cache") || text.includes("does not exist") || text.includes("42p01") || text.includes("pgrst205");
};

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
      last_event_at: now,
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

router.post("/pixgo", async (req, res, next) => {
  try {
    await handleProviderEvent({
      headers: req.headers,
      rawBody: req.rawBody,
      body: req.body
    });
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/channel", (req, res) => {
  if (!provider.verifyQuery(req.query)) {
    res.sendStatus(403);
    return;
  }
  res.status(200).send(String(req.query["hub.challenge"] || ""));
});

router.post("/channel", async (req, res, next) => {
  try {
    if (!provider.validateWebhook(req.headers, req.rawBody)) {
      res.sendStatus(401);
      return;
    }
    const events = provider.readWebhook(req.body);
    for (const item of events.messages) {
      const thread = await touchThread({
        phone: item.from,
        name: item.name,
        lastText: item.body || item.type,
        raw: item.raw,
        unread: 1
      });
      await db.insertChannelMessage({
        thread_id: thread.id,
        provider: "channel",
        provider_ref: item.id,
        direction: "inbound",
        kind: item.type,
        body: item.body,
        media_url: item.mediaId,
        status: "received",
        payload: item.raw || {},
        created_at: item.timestamp
      });
    }
    for (const item of events.statuses) {
      await db.updateChannelMessageByProviderRef(item.id, {
        status: item.status,
        payload: item.raw || {}
      });
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    if (missingStorage(error)) {
      res.status(200).json({ ok: true, storage: false });
      return;
    }
    next(error);
  }
});

export default router;
