import axios from "axios";
import { hmac256, safeEqual } from "../utils/crypto.js";

const baseURL = () => process.env.PIXGO_API_URL || "https://pixgo.org/api/v1";

const client = () => {
  if (!process.env.PIXGO_API_KEY) {
    const error = new Error("Configuração ausente");
    error.status = 500;
    throw error;
  }
  return axios.create({
    baseURL: baseURL(),
    timeout: 20000,
    headers: {
      "X-API-Key": process.env.PIXGO_API_KEY,
      "Content-Type": "application/json"
    }
  });
};

export const createPayment = async (payload) => {
  const { data } = await client().post("/payment/create", payload);
  return data;
};

export const getPayment = async (paymentId) => {
  const { data } = await client().get(`/payment/${encodeURIComponent(paymentId)}`);
  return data;
};

export const getPaymentStatus = async (paymentId) => {
  const { data } = await client().get(`/payment/${encodeURIComponent(paymentId)}/status`);
  return data;
};

export const validateWebhook = ({ headers, rawBody }) => {
  const event = headers["x-webhook-event"];
  const signature = headers["x-webhook-signature"];
  const timestamp = headers["x-webhook-timestamp"];
  if (!event || !signature || !timestamp || !rawBody) return false;
  const secret = process.env.PIXGO_WEBHOOK_SECRET || process.env.PIXGO_API_KEY;
  if (!secret) return false;
  const expected = hmac256(secret, `${timestamp}.${rawBody}`);
  const normalized = String(signature).replace(/^sha256=/i, "").trim().toLowerCase();
  return safeEqual(expected, normalized);
};
