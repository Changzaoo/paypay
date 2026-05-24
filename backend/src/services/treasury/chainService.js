import { JsonRpcProvider, formatUnits } from "ethers";
import { db, many, maybe, one } from "./treasuryDb.js";

const providers = new Map();
const chainFields = "id,chain_key,chain_id,name,explorer_url,native_symbol,native_decimals,status,created_at,updated_at";

export const listChains = async () => {
  return many(db().from("chain_configs").select(chainFields).order("chain_id", { ascending: true }));
};

export const getChain = async (key) => {
  const query = Number.isFinite(Number(key))
    ? db().from("chain_configs").select("*").eq("chain_id", Number(key))
    : db().from("chain_configs").select("*").eq("chain_key", String(key));
  const chain = await maybe(query);
  if (!chain) {
    const error = new Error("Chain invalida");
    error.status = 400;
    throw error;
  }
  return chain;
};

export const upsertChain = async (payload) => {
  return one(db().from("chain_configs").upsert(payload, { onConflict: "chain_key" }).select(chainFields));
};

export const listTokens = async () => {
  return many(db().from("token_configs").select("*, chain_configs(chain_key,name)").order("symbol", { ascending: true }));
};

export const getToken = async ({ chainId, symbol }) => {
  const token = await maybe(db().from("token_configs").select("*").eq("chain_id", chainId).eq("symbol", String(symbol).toUpperCase()));
  if (!token) {
    const error = new Error("Token invalido");
    error.status = 400;
    throw error;
  }
  return token;
};

export const upsertToken = async (payload) => {
  return one(db().from("token_configs").upsert(payload, { onConflict: "chain_id,symbol" }).select("*"));
};

export const providerFor = (chain) => {
  if (!chain?.rpc_url) {
    const error = new Error("RPC ausente");
    error.status = 500;
    throw error;
  }
  const key = `${chain.chain_id}:${chain.rpc_url}`;
  if (!providers.has(key)) providers.set(key, new JsonRpcProvider(chain.rpc_url, Number(chain.chain_id)));
  return providers.get(key);
};

export const getNativeBalance = async ({ chain, address }) => {
  const balance = await providerFor(chain).getBalance(address);
  return formatUnits(balance, Number(chain.native_decimals || 18));
};
