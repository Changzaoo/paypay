import axios from "axios";
import crypto from "crypto";

const graphVersion = () => process.env.WHATSAPP_GRAPH_VERSION || "v23.0";
const baseUrl = () => (process.env.WHATSAPP_API_URL || `https://graph.facebook.com/${graphVersion()}`).replace(/\/$/, "");
const token = () => process.env.WHATSAPP_ACCESS_TOKEN || "";
const phoneNumberId = () => process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const mediaKinds = new Set(["image", "video", "audio", "document"]);

const client = () => axios.create({
  baseURL: baseUrl(),
  timeout: 25000,
  headers: {
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json"
  }
});

const requireReady = () => {
  if (!token() || !phoneNumberId()) {
    const error = new Error("Canal desconectado");
    error.status = 503;
    throw error;
  }
};

const mask = (value) => {
  const text = String(value || "");
  if (text.length <= 6) return text;
  return `${text.slice(0, 3)}...${text.slice(-3)}`;
};

export const status = () => ({
  connected: Boolean(token() && phoneNumberId()),
  phoneNumberId: mask(phoneNumberId()),
  webhookUrl: process.env.BACKEND_PUBLIC_URL ? `${process.env.BACKEND_PUBLIC_URL.replace(/\/$/, "")}/api/webhooks/channel` : "",
  graphVersion: graphVersion()
});

export const sendText = async ({ to, body }) => {
  requireReady();
  const { data } = await client().post(`/${phoneNumberId()}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: true,
      body
    }
  });
  return data;
};

export const sendMedia = async ({ to, type, link, caption }) => {
  requireReady();
  if (!mediaKinds.has(type)) {
    const error = new Error("Tipo invalido");
    error.status = 400;
    throw error;
  }
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type,
    [type]: {
      link
    }
  };
  if (caption && type !== "audio") payload[type].caption = caption;
  const { data } = await client().post(`/${phoneNumberId()}/messages`, payload);
  return data;
};

export const markRead = async (messageId) => {
  requireReady();
  const { data } = await client().post(`/${phoneNumberId()}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId
  });
  return data;
};

export const verifyQuery = (query = {}) => {
  return query["hub.mode"] === "subscribe" && query["hub.verify_token"] === process.env.WHATSAPP_VERIFY_TOKEN;
};

export const validateWebhook = (headers = {}, rawBody = "") => {
  const secret = process.env.WHATSAPP_APP_SECRET || "";
  if (!secret) return true;
  const signature = String(headers["x-hub-signature-256"] || "");
  if (!signature.startsWith("sha256=")) return false;
  const digest = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const left = Buffer.from(signature);
  const right = Buffer.from(digest);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

export const readWebhook = (payload = {}) => {
  const messages = [];
  const statuses = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const contactById = new Map((value.contacts || []).map((item) => [item.wa_id, item]));
      for (const item of value.messages || []) {
        const contact = contactById.get(item.from) || {};
        const profile = contact.profile || {};
        const kind = item.type || "text";
        const content = item.text?.body || item.button?.text || item.interactive?.button_reply?.title || item.interactive?.list_reply?.title || item[kind]?.caption || "";
        messages.push({
          id: item.id,
          from: item.from,
          name: profile.name,
          type: kind,
          body: content,
          mediaId: item[kind]?.id,
          timestamp: item.timestamp ? new Date(Number(item.timestamp) * 1000).toISOString() : new Date().toISOString(),
          raw: item
        });
      }
      for (const item of value.statuses || []) {
        statuses.push({
          id: item.id,
          status: item.status,
          recipient: item.recipient_id,
          timestamp: item.timestamp ? new Date(Number(item.timestamp) * 1000).toISOString() : new Date().toISOString(),
          raw: item
        });
      }
    }
  }
  return { messages, statuses };
};
