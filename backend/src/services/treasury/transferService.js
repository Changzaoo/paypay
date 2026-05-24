import { Contract, HDNodeWallet, Wallet, parseUnits } from "ethers";
import { db, many, maybe, now, one } from "./treasuryDb.js";
import * as approvalService from "./approvalService.js";
import * as auditService from "./auditService.js";
import * as chainService from "./chainService.js";
import * as riskService from "./riskService.js";
import * as walletService from "./walletService.js";

const erc20Abi = ["function transfer(address to,uint256 value) returns (bool)"];
const locks = new Set();

const keyEnv = (keyRef) => `TREASURY_KEY_${String(keyRef || "").replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;

const signerFor = (wallet, chain) => {
  if (!wallet.key_ref) {
    const error = new Error("Assinador ausente");
    error.status = 409;
    throw error;
  }
  const provider = chainService.providerFor(chain);
  const key = process.env[keyEnv(wallet.key_ref)];
  if (key) return new Wallet(key, provider);
  if (String(wallet.key_ref).startsWith("HD_") && process.env.TREASURY_DEFAULT_MNEMONIC) {
    const path = Buffer.from(String(wallet.key_ref).slice(3), "base64url").toString("utf8");
    return HDNodeWallet.fromPhrase(process.env.TREASURY_DEFAULT_MNEMONIC, undefined, path).connect(provider);
  }
  const error = new Error("Chave operacional ausente");
  error.status = 409;
  throw error;
};

export const listRequests = async (filters = {}) => {
  let query = db().from("transfer_requests").select("*, source:wallets!transfer_requests_source_wallet_id_fkey(name,address), destination:wallets!transfer_requests_destination_wallet_id_fkey(name,address), chain_configs(chain_key,name), token_configs(symbol,decimals)").order("created_at", { ascending: false }).limit(500);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.chainId) query = query.eq("chain_id", Number(filters.chainId));
  if (filters.walletId) query = query.or(`source_wallet_id.eq.${filters.walletId},destination_wallet_id.eq.${filters.walletId}`);
  if (filters.token) query = query.eq("token_symbol", String(filters.token).toUpperCase());
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
  return many(query);
};

export const getRequest = async (id) => {
  const row = await maybe(db().from("transfer_requests").select("*").eq("id", id));
  if (!row) {
    const error = new Error("Solicitacao nao encontrada");
    error.status = 404;
    throw error;
  }
  return row;
};

export const createRequest = async ({ actor, payload, ip }) => {
  const sourceWallet = await walletService.getWallet(payload.sourceWalletId);
  const destinationWallet = await walletService.getWallet(payload.destinationWalletId);
  const token = await chainService.getToken({ chainId: sourceWallet.chain_id, symbol: payload.token });
  const check = await riskService.checkTransfer({ sourceWallet, destinationWallet, token: token.symbol, amount: payload.amount, reason: payload.reason });
  if (!check.allowed) {
    const error = new Error(check.reason);
    error.status = 400;
    throw error;
  }
  const row = await one(db().from("transfer_requests").insert({
    requester_id: actor.id,
    requester_email: actor.email,
    source_wallet_id: sourceWallet.id,
    destination_wallet_id: destinationWallet.id,
    chain_id: sourceWallet.chain_id,
    token_id: token.id,
    token_symbol: token.symbol,
    amount: payload.amount,
    reason: payload.reason,
    status: "pending_approval",
    risk_result: check
  }).select("*"));
  await approvalService.createApproval({ actor, entityType: "transfer_request", entityId: row.id, ip });
  await auditService.log({ actor, action: "transfer.create", entityType: "transfer_request", entityId: row.id, payload, ip });
  return row;
};

export const approveRequest = async ({ actor, id, decision, note, ip }) => {
  const request = await getRequest(id);
  if (!["pending_approval", "rejected"].includes(request.status) && decision === "approved") {
    const error = new Error("Status invalido");
    error.status = 400;
    throw error;
  }
  await approvalService.decide({ actor, entityType: "transfer_request", entityId: id, decision, note, ip });
  if (decision !== "approved") {
    return one(db().from("transfer_requests").update({ status: "rejected" }).eq("id", id).select("*"));
  }
  const updated = await one(db().from("transfer_requests").update({ status: "approved", approved_by: actor.id, approved_at: now() }).eq("id", id).select("*"));
  await one(db().from("transfer_transactions").insert({
    transfer_request_id: id,
    chain_id: request.chain_id,
    token_id: request.token_id,
    from_wallet_id: request.source_wallet_id,
    to_wallet_id: request.destination_wallet_id,
    amount: request.amount,
    status: "queued",
    attempts: 0,
    max_attempts: 3
  }).select("*"));
  await auditService.log({ actor, action: "transfer.queue", entityType: "transfer_request", entityId: id, payload: { decision }, ip });
  return updated;
};

export const listTransactions = async (filters = {}) => {
  let query = db().from("transfer_transactions").select("*, transfer_requests(reason,requester_email), chain_configs(chain_key,name), token_configs(symbol)").order("created_at", { ascending: false }).limit(500);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.chainId) query = query.eq("chain_id", Number(filters.chainId));
  if (filters.walletId) query = query.or(`from_wallet_id.eq.${filters.walletId},to_wallet_id.eq.${filters.walletId}`);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
  return many(query);
};

export const retryTransaction = async ({ actor, id, ip }) => {
  const tx = await maybe(db().from("transfer_transactions").select("*").eq("id", id));
  if (!tx) {
    const error = new Error("Transacao nao encontrada");
    error.status = 404;
    throw error;
  }
  if (!["failed", "pending"].includes(tx.status) || Number(tx.attempts || 0) >= Number(tx.max_attempts || 3)) {
    const error = new Error("Retry nao permitido");
    error.status = 400;
    throw error;
  }
  const row = await one(db().from("transfer_transactions").update({ status: "queued", error_message: null }).eq("id", id).select("*"));
  await auditService.log({ actor, action: "transfer.retry", entityType: "transfer_transaction", entityId: id, payload: {}, ip });
  return row;
};

const executeTransaction = async (tx) => {
  const source = await walletService.getWallet(tx.from_wallet_id);
  const destination = await walletService.getWallet(tx.to_wallet_id);
  const chain = await chainService.getChain(tx.chain_id);
  const token = await maybe(db().from("token_configs").select("*").eq("id", tx.token_id));
  const lock = `${chain.chain_id}:${source.address}`;
  if (locks.has(lock)) return null;
  locks.add(lock);
  try {
    const signer = signerFor(source, chain);
    const amount = parseUnits(String(tx.amount), Number(token?.decimals || chain.native_decimals || 18));
    const nonce = await signer.getNonce("pending");
    await db().from("transfer_transactions").update({ status: "signing", attempts: Number(tx.attempts || 0) + 1, nonce }).eq("id", tx.id);
    const sent = token?.is_native
      ? await signer.sendTransaction({ to: destination.address, value: amount, nonce })
      : await new Contract(token.contract_address, erc20Abi, signer).transfer(destination.address, amount, { nonce });
    return one(db().from("transfer_transactions").update({
      status: "pending",
      tx_hash: sent.hash,
      sent_at: now(),
      raw: { nonce }
    }).eq("id", tx.id).select("*"));
  } catch (error) {
    return one(db().from("transfer_transactions").update({
      status: Number(tx.attempts || 0) + 1 >= Number(tx.max_attempts || 3) ? "failed" : "failed",
      error_message: error.message
    }).eq("id", tx.id).select("*"));
  } finally {
    locks.delete(lock);
  }
};

export const processQueue = async () => {
  const queued = await many(db().from("transfer_transactions").select("*").in("status", ["queued"]).order("created_at", { ascending: true }).limit(10));
  const results = [];
  for (const tx of queued) {
    const result = await executeTransaction(tx);
    if (result) results.push(result);
  }
  return results;
};
