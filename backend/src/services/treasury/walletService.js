import { HDNodeWallet, getAddress, isAddress } from "ethers";
import { db, many, maybe, one } from "./treasuryDb.js";

const normalizeTags = (tags) => Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 20) : [];
const walletFields = "id,name,chain_id,address,purpose,status,group_id,daily_limit,expected_balance,tags,created_by,approved_by,approved_at,created_at,updated_at";

export const listGroups = async () => {
  return many(db().from("wallet_groups").select("*").order("name", { ascending: true }));
};

export const createGroup = async (payload) => {
  return one(db().from("wallet_groups").insert(payload).select("*"));
};

export const listWallets = async (filters = {}) => {
  let query = db().from("wallets").select(`${walletFields}, chain_configs(chain_key,name)`).order("created_at", { ascending: false }).limit(500);
  if (filters.chainId) query = query.eq("chain_id", Number(filters.chainId));
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.purpose) query = query.eq("purpose", filters.purpose);
  return many(query);
};

export const getWallet = async (id) => {
  const wallet = await maybe(db().from("wallets").select("*").eq("id", id));
  if (!wallet) {
    const error = new Error("Carteira nao encontrada");
    error.status = 404;
    throw error;
  }
  return wallet;
};

export const getWalletByAddress = async ({ chainId, address }) => {
  return maybe(db().from("wallets").select("*").eq("chain_id", chainId).eq("address", getAddress(address)));
};

export const createWallet = async (payload, actor) => {
  if (!isAddress(payload.address)) {
    const error = new Error("Endereco invalido");
    error.status = 400;
    throw error;
  }
  return one(db().from("wallets").insert({
    name: payload.name,
    chain_id: payload.chainId,
    address: getAddress(payload.address),
    purpose: payload.purpose,
    status: payload.status || "pending",
    group_id: payload.groupId,
    daily_limit: payload.dailyLimit,
    tags: normalizeTags(payload.tags),
    key_ref: payload.keyRef,
    created_by: actor.id
  }).select(walletFields));
};

export const generateHdWallet = async (payload, actor) => {
  const phrase = process.env.TREASURY_DEFAULT_MNEMONIC;
  if (!phrase) {
    const error = new Error("Seed operacional ausente");
    error.status = 500;
    throw error;
  }
  const path = payload.path || `m/44'/60'/0'/0/${Date.now() % 1000000}`;
  const node = HDNodeWallet.fromPhrase(phrase, undefined, path);
  const keyRef = payload.keyRef || `HD_${Buffer.from(path).toString("base64url")}`;
  return createWallet({
    ...payload,
    address: node.address,
    keyRef,
    tags: [...normalizeTags(payload.tags), "hd"]
  }, actor);
};

export const updateWallet = async (id, payload, actor) => {
  const update = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    if (key === "dailyLimit") update.daily_limit = value;
    else if (key === "groupId") update.group_id = value;
    else if (key === "chainId") update.chain_id = value;
    else if (key === "keyRef") update.key_ref = value;
    else if (key === "tags") update.tags = normalizeTags(value);
    else update[key] = value;
  }
  if (update.status === "approved") {
    update.approved_by = actor?.id;
    update.approved_at = new Date().toISOString();
  }
  return one(db().from("wallets").update(update).eq("id", id).select(walletFields));
};
