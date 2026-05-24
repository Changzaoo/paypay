import { db, many, maybe, now, one } from "./treasuryDb.js";
import * as approvalService from "./approvalService.js";
import * as auditService from "./auditService.js";
import * as chainService from "./chainService.js";
import * as riskService from "./riskService.js";
import * as walletService from "./walletService.js";

const providers = {
  sideshift: { name: "SideShift", mode: "manual" },
  lifi: { name: "Li.Fi", mode: "planned" },
  socket: { name: "Socket", mode: "planned" }
};

export const listProviders = () => providers;

export const listRequests = async (filters = {}) => {
  let query = db().from("bridge_requests").select("*, source:wallets!bridge_requests_source_wallet_id_fkey(name,address), destination:wallets!bridge_requests_destination_wallet_id_fkey(name,address)").order("created_at", { ascending: false }).limit(500);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.provider) query = query.eq("provider", filters.provider);
  if (filters.chainId) query = query.or(`source_chain_id.eq.${filters.chainId},destination_chain_id.eq.${filters.chainId}`);
  if (filters.walletId) query = query.or(`source_wallet_id.eq.${filters.walletId},destination_wallet_id.eq.${filters.walletId}`);
  if (filters.token) query = query.or(`source_token_symbol.eq.${String(filters.token).toUpperCase()},destination_token_symbol.eq.${String(filters.token).toUpperCase()}`);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
  return many(query);
};

export const getRequest = async (id) => {
  const row = await maybe(db().from("bridge_requests").select("*").eq("id", id));
  if (!row) {
    const error = new Error("Bridge nao encontrada");
    error.status = 404;
    throw error;
  }
  return row;
};

export const createRequest = async ({ actor, payload, ip }) => {
  const sourceWallet = await walletService.getWallet(payload.sourceWalletId);
  const destinationWallet = await walletService.getWallet(payload.destinationWalletId);
  const check = await riskService.checkBridge({ sourceWallet, destinationWallet, amount: payload.amount, reason: payload.reason });
  if (!check.allowed) {
    const error = new Error(check.reason);
    error.status = 400;
    throw error;
  }
  const sourceToken = await chainService.getToken({ chainId: sourceWallet.chain_id, symbol: payload.sourceToken });
  const destinationToken = await chainService.getToken({ chainId: destinationWallet.chain_id, symbol: payload.destinationToken });
  const provider = providers[payload.provider] ? payload.provider : "sideshift";
  const quote = {
    provider,
    mode: providers[provider].mode,
    slippageBps: payload.slippageBps,
    manualExecution: true
  };
  const row = await one(db().from("bridge_requests").insert({
    requester_id: actor.id,
    requester_email: actor.email,
    source_wallet_id: sourceWallet.id,
    destination_wallet_id: destinationWallet.id,
    source_chain_id: sourceWallet.chain_id,
    destination_chain_id: destinationWallet.chain_id,
    source_token_id: sourceToken.id,
    destination_token_id: destinationToken.id,
    source_token_symbol: sourceToken.symbol,
    destination_token_symbol: destinationToken.symbol,
    amount: payload.amount,
    provider,
    quote,
    fee_estimate: payload.feeEstimate,
    slippage_bps: payload.slippageBps,
    reason: payload.reason,
    status: "pending_approval"
  }).select("*"));
  await one(db().from("bridge_steps").insert({
    bridge_request_id: row.id,
    step_type: "quote",
    status: "recorded",
    payload: quote
  }).select("*"));
  await approvalService.createApproval({ actor, entityType: "bridge_request", entityId: row.id, ip });
  await auditService.log({ actor, action: "bridge.create", entityType: "bridge_request", entityId: row.id, payload, ip });
  return row;
};

export const approveRequest = async ({ actor, id, decision, note, ip }) => {
  await approvalService.decide({ actor, entityType: "bridge_request", entityId: id, decision, note, ip });
  if (decision !== "approved") {
    return one(db().from("bridge_requests").update({ status: "rejected" }).eq("id", id).select("*"));
  }
  await one(db().from("bridge_steps").insert({
    bridge_request_id: id,
    step_type: "approval",
    status: "approved",
    payload: { note }
  }).select("*"));
  const row = await one(db().from("bridge_requests").update({
    status: "approved",
    approved_by: actor.id,
    approved_at: now()
  }).eq("id", id).select("*"));
  await auditService.log({ actor, action: "bridge.approve", entityType: "bridge_request", entityId: id, payload: { decision }, ip });
  return row;
};

export const listSteps = async (id) => {
  return many(db().from("bridge_steps").select("*").eq("bridge_request_id", id).order("created_at", { ascending: true }));
};
