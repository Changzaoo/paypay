import axios from "axios";
import crypto from "crypto";
import whatsapp from "whatsapp-web.js";

const { Client, LocalAuth, MessageMedia } = whatsapp;

const graphVersion = () => process.env.WHATSAPP_GRAPH_VERSION || "v23.0";
const baseUrl = () => (process.env.WHATSAPP_API_URL || `https://graph.facebook.com/${graphVersion()}`).replace(/\/$/, "");
const token = () => process.env.WHATSAPP_ACCESS_TOKEN || "";
const phoneNumberId = () => process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const mediaKinds = new Set(["image", "video", "audio", "document"]);
let webClient;
let webStarting = false;
let webReady = false;
let webQr = "";
let webError = "";
let webAccount = "";
let webHandler = async () => {};
const seen = new Set();

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

const webState = () => ({
  connected: webReady,
  starting: webStarting,
  qr: webQr,
  error: webError,
  account: mask(webAccount),
  state: webReady ? "connected" : webQr ? "qr" : webStarting ? "starting" : webError ? "error" : "idle"
});

export const status = () => ({
  connected: webReady || Boolean(token() && phoneNumberId()),
  phoneNumberId: mask(phoneNumberId()),
  connectUrl: process.env.WHATSAPP_CONNECT_URL || "https://web.whatsapp.com/",
  graphVersion: graphVersion(),
  web: webState()
});

const webArgs = () => String(process.env.WHATSAPP_WEB_CHROME_ARGS || "--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const phoneFromChat = (value) => String(value || "").replace(/@.+$/, "").replace(/\D/g, "");

const emitMessage = async (message) => {
  const id = message?.id?._serialized;
  if (!id || seen.has(id)) return;
  seen.add(id);
  if (seen.size > 800) seen.clear();
  const chatRef = message.fromMe ? message.to : message.from;
  if (!String(chatRef || "").endsWith("@c.us")) return;
  const contact = await message.getContact().catch(() => null);
  await webHandler({
    event: "message",
    id,
    phone: phoneFromChat(chatRef),
    name: contact?.pushname || contact?.name || contact?.number,
    direction: message.fromMe ? "outbound" : "inbound",
    type: message.type || "text",
    body: message.body || "",
    timestamp: message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : new Date().toISOString(),
    raw: {
      id,
      from: message.from,
      to: message.to,
      fromMe: message.fromMe,
      type: message.type,
      hasMedia: message.hasMedia
    }
  });
};

const ackStatus = (ack) => {
  if (ack >= 3) return "read";
  if (ack === 2) return "delivered";
  if (ack === 1) return "sent";
  return "pending";
};

export const startWebSession = async (handler) => {
  if (handler) webHandler = handler;
  if (webClient) return status();
  webStarting = true;
  webError = "";
  webQr = "";
  webClient = new Client({
    authStrategy: new LocalAuth({ dataPath: process.env.WHATSAPP_WEB_SESSION_PATH || ".wwebjs_auth" }),
    puppeteer: {
      headless: true,
      args: webArgs()
    }
  });
  webClient.on("qr", (qr) => {
    webQr = qr;
    webReady = false;
    webStarting = false;
    webError = "";
  });
  webClient.on("authenticated", () => {
    webQr = "";
    webError = "";
    webStarting = true;
  });
  webClient.on("ready", () => {
    webReady = true;
    webStarting = false;
    webQr = "";
    webError = "";
    webAccount = webClient.info?.wid?._serialized || webClient.info?.me?._serialized || "";
  });
  webClient.on("auth_failure", (message) => {
    webReady = false;
    webStarting = false;
    webQr = "";
    webError = String(message || "Falha de autenticacao");
  });
  webClient.on("disconnected", (reason) => {
    webReady = false;
    webStarting = false;
    webQr = "";
    webError = String(reason || "Desconectado");
    webClient = null;
  });
  webClient.on("message", (message) => {
    emitMessage(message).catch(() => {});
  });
  webClient.on("message_create", (message) => {
    if (message.fromMe) emitMessage(message).catch(() => {});
  });
  webClient.on("message_ack", (message, ack) => {
    const id = message?.id?._serialized;
    if (!id) return;
    webHandler({ event: "ack", id, status: ackStatus(ack) }).catch(() => {});
  });
  webClient.initialize().catch((error) => {
    webReady = false;
    webStarting = false;
    webQr = "";
    webError = error.message || "Falha ao iniciar";
    webClient = null;
  });
  return status();
};

export const disconnectWebSession = async () => {
  if (webClient) {
    await webClient.destroy().catch(() => {});
  }
  webClient = null;
  webStarting = false;
  webReady = false;
  webQr = "";
  webAccount = "";
  webError = "";
  return status();
};

export const sendText = async ({ to, body }) => {
  if (webReady && webClient) {
    const message = await webClient.sendMessage(`${String(to).replace(/\D/g, "")}@c.us`, body);
    return {
      messages: [{ id: message?.id?._serialized, message_status: "sent" }]
    };
  }
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
  if (webReady && webClient) {
    if (!mediaKinds.has(type)) {
      const error = new Error("Tipo invalido");
      error.status = 400;
      throw error;
    }
    const media = await MessageMedia.fromUrl(link, { unsafeMime: true });
    const message = await webClient.sendMessage(`${String(to).replace(/\D/g, "")}@c.us`, media, caption ? { caption } : {});
    return {
      messages: [{ id: message?.id?._serialized, message_status: "sent" }]
    };
  }
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
  if (webReady && webClient) {
    return { success: true, message_id: messageId };
  }
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
