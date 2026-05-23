import axios from "axios";

const baseURL = () => process.env.SIDESHIFT_API_URL || "https://sideshift.ai/api/v2";

const headers = (ip) => {
  if (!process.env.SIDESHIFT_SECRET) {
    const error = new Error("Configuração ausente");
    error.status = 500;
    throw error;
  }
  return {
    "Content-Type": "application/json",
    "x-sideshift-secret": process.env.SIDESHIFT_SECRET,
    "x-user-ip": ip || "127.0.0.1"
  };
};

const client = (ip) => axios.create({
  baseURL: baseURL(),
  timeout: 30000,
  headers: headers(ip)
});

const withAffiliate = (payload) => {
  if (!process.env.SIDESHIFT_AFFILIATE_ID) return payload;
  return { ...payload, affiliateId: process.env.SIDESHIFT_AFFILIATE_ID };
};

export const getCoins = async (ip) => {
  const { data } = await client(ip).get("/coins");
  return data;
};

export const getPermissions = async (ip) => {
  const { data } = await client(ip).get("/permissions");
  return data;
};

export const getPair = async ({ from, to, ip }) => {
  const { data } = await client(ip).get(`/pair/${encodeURIComponent(from)}/${encodeURIComponent(to)}`);
  return data;
};

export const createQuote = async (payload, ip) => {
  const { data } = await client(ip).post("/quotes", withAffiliate(payload));
  return data;
};

export const createFixedShift = async (payload, ip) => {
  const { data } = await client(ip).post("/shifts/fixed", withAffiliate(payload));
  return data;
};

export const createVariableShift = async (payload, ip) => {
  const { data } = await client(ip).post("/shifts/variable", withAffiliate(payload));
  return data;
};

export const getShift = async (id, ip) => {
  const { data } = await client(ip).get(`/shifts/${encodeURIComponent(id)}`);
  return data;
};
