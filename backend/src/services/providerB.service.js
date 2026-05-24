import axios from "axios";

const baseURL = () => process.env.SIDESWAP_EXECUTOR_URL || process.env.PROVIDER_B_API_URL;

const client = () => {
  if (!baseURL()) {
    const error = new Error("Rota indisponivel");
    error.status = 503;
    throw error;
  }
  const headers = {
    "Content-Type": "application/json"
  };
  if (process.env.SIDESWAP_EXECUTOR_SECRET) headers["x-executor-secret"] = process.env.SIDESWAP_EXECUTOR_SECRET;
  return axios.create({
    baseURL: baseURL(),
    timeout: 30000,
    headers
  });
};

export const listMarkets = async () => {
  const { data } = await client().get("/markets");
  return data;
};

export const requestQuote = async (payload) => {
  const { data } = await client().post("/quote", payload);
  return data;
};

export const acceptQuote = async (quoteId) => {
  const { data } = await client().post(`/quote/${encodeURIComponent(quoteId)}/accept`);
  return data;
};

export const signSwap = async (payload) => {
  const { data } = await client().post("/sign", payload || {});
  return data;
};

export const broadcastSwap = async (payload) => {
  const { data } = await client().post("/broadcast", payload || {});
  return data;
};
