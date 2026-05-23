import axios from "axios";
import { supabase } from "./supabase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  timeout: 25000
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const checkSession = async () => {
  const { data } = await api.post("/api/auth/session-check", undefined, { timeout: 8000 });
  return data;
};

export const getOrders = async (params) => {
  const { data } = await api.get("/api/flow", { params });
  return Array.isArray(data.items) ? data.items : [];
};

export const createOrder = async (payload) => {
  const { data } = await api.post("/api/flow/create", payload);
  return data;
};

export const getOrder = async (id) => {
  const { data } = await api.get(`/api/flow/${id}`);
  return data;
};

export const getOrderStatus = async (id) => {
  const { data } = await api.get(`/api/flow/${id}/status`);
  return data;
};

export const retryOrder = async (id, payload = {}) => {
  const { data } = await api.post(`/api/flow/${id}/retry`, payload);
  return data;
};

export const manualOrder = async (id, payload) => {
  const { data } = await api.post(`/api/flow/${id}/manual-update`, payload);
  return data;
};

export const getConfig = async () => {
  const { data } = await api.get("/api/config/public");
  return data;
};

export const getSettlementOptions = async () => {
  const { data } = await api.get("/api/config/settlement-options");
  return data;
};

export const getChannelStatus = async () => {
  const { data } = await api.get("/api/channel/status");
  return data;
};

export const getChannelThreads = async (params) => {
  const { data } = await api.get("/api/channel/threads", { params });
  return Array.isArray(data.items) ? data.items : [];
};

export const createChannelThread = async (payload) => {
  const { data } = await api.post("/api/channel/threads", payload);
  return data;
};

export const getChannelMessages = async (id) => {
  const { data } = await api.get(`/api/channel/threads/${id}/messages`);
  return Array.isArray(data.items) ? data.items : [];
};

export const sendChannelMessage = async (payload) => {
  const { data } = await api.post("/api/channel/messages", payload);
  return data;
};

export const markChannelRead = async (id) => {
  const { data } = await api.post(`/api/channel/messages/${id}/read`);
  return data;
};

export const ping = async () => {
  const { data } = await api.get("/api/health");
  return data;
};
