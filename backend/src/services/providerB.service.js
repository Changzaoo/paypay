import axios from "axios";

const baseURL = () => process.env.PROVIDER_B_API_URL;

const client = () => {
  if (!baseURL()) {
    const error = new Error("Rota indisponível");
    error.status = 503;
    throw error;
  }
  return axios.create({
    baseURL: baseURL(),
    timeout: 25000,
    headers: {
      "Content-Type": "application/json"
    }
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

export const signSwap = async () => {
  const error = new Error("Assinatura indisponível");
  error.status = 501;
  throw error;
};

export const broadcastSwap = async () => {
  const error = new Error("Envio indisponível");
  error.status = 501;
  throw error;
};
