import axios from "axios";
import { isLiquidAddress } from "../utils/address.js";

const baseUrl = () => String(process.env.LIQUID_RPC_URL || "").replace(/\/$/, "");
const walletName = () => String(process.env.LIQUID_RPC_WALLET || "").trim();
const enabled = () => String(process.env.LIQUID_AUTO_SEND || "").toLowerCase() === "true";

const rpcUrl = () => {
  const base = baseUrl();
  if (!base) {
    const error = new Error("RPC Liquid ausente");
    error.status = 503;
    throw error;
  }
  const wallet = walletName();
  if (!wallet || base.includes("/wallet/")) return base;
  return `${base}/wallet/${encodeURIComponent(wallet)}`;
};

const auth = () => {
  const username = process.env.LIQUID_RPC_USER;
  const password = process.env.LIQUID_RPC_PASSWORD;
  return username || password ? { username, password } : undefined;
};

export const isAutoSendEnabled = () => enabled();

export const call = async (method, params = []) => {
  const { data } = await axios.post(rpcUrl(), {
    jsonrpc: "1.0",
    id: `paypay-${Date.now()}`,
    method,
    params
  }, {
    timeout: 30000,
    auth: auth(),
    headers: { "Content-Type": "application/json" }
  });
  if (data?.error) {
    const error = new Error(data.error.message || "Falha RPC Liquid");
    error.status = 502;
    throw error;
  }
  return data?.result;
};

export const validate = async (address) => {
  if (!isLiquidAddress(address)) return false;
  try {
    const result = await call("validateaddress", [address]);
    return Boolean(result?.isvalid);
  } catch {
    return false;
  }
};

export const getBalance = async () => {
  return call("getbalance", []);
};

export const sendLBtc = async ({ address, amount }) => {
  if (!enabled()) {
    const error = new Error("Envio Liquid desativado");
    error.status = 409;
    throw error;
  }
  if (!await validate(address)) {
    const error = new Error("Endereco Liquid invalido");
    error.status = 400;
    throw error;
  }
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    const error = new Error("Valor Liquid invalido");
    error.status = 400;
    throw error;
  }
  return call("sendtoaddress", [address, value]);
};
