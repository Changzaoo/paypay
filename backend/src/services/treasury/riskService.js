import { isAddress, getAddress } from "ethers";
import { db, many, maybe, one } from "./treasuryDb.js";
import * as walletService from "./walletService.js";

export const listRules = async () => {
  return many(db().from("risk_rules").select("*").order("created_at", { ascending: false }));
};

export const createRule = async (payload) => {
  return one(db().from("risk_rules").insert(payload).select("*"));
};

export const checkAddress = async ({ chainId, address }) => {
  if (!isAddress(address)) {
    return { allowed: false, reason: "Endereco invalido" };
  }
  const normalized = getAddress(address);
  const blocked = await maybe(db().from("risk_rules")
    .select("*")
    .eq("rule_type", "blocked_address")
    .eq("status", "active")
    .or(`chain_id.is.null,chain_id.eq.${chainId}`)
    .eq("value", normalized));
  if (blocked) return { allowed: false, reason: blocked.reason || "Destino bloqueado" };
  const wallet = await walletService.getWalletByAddress({ chainId, address: normalized });
  if (!wallet) return { allowed: false, reason: "Destino fora da whitelist" };
  if (wallet.status !== "approved" && wallet.status !== "active") return { allowed: false, reason: "Destino nao aprovado" };
  return { allowed: true, wallet };
};

export const checkTransfer = async ({ sourceWallet, destinationWallet, amount, reason }) => {
  if (!reason || String(reason).trim().length < 8) return { allowed: false, reason: "Justificativa obrigatoria" };
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return { allowed: false, reason: "Valor invalido" };
  if (!sourceWallet || sourceWallet.status !== "approved") return { allowed: false, reason: "Origem nao aprovada" };
  if (!destinationWallet || destinationWallet.status !== "approved") return { allowed: false, reason: "Destino nao aprovado" };
  if (sourceWallet.chain_id !== destinationWallet.chain_id) return { allowed: false, reason: "Chains diferentes exigem bridge" };
  const sourceCheck = await checkAddress({ chainId: sourceWallet.chain_id, address: sourceWallet.address });
  if (!sourceCheck.allowed) return { allowed: false, reason: `Origem: ${sourceCheck.reason}` };
  const destinationCheck = await checkAddress({ chainId: destinationWallet.chain_id, address: destinationWallet.address });
  if (!destinationCheck.allowed) return { allowed: false, reason: `Destino: ${destinationCheck.reason}` };
  const limit = Number(sourceWallet.daily_limit || 0);
  if (limit > 0 && Number(amount) > limit) return { allowed: false, reason: "Limite diario excedido" };
  return { allowed: true };
};

export const checkBridge = async ({ sourceWallet, destinationWallet, amount, reason }) => {
  if (!reason || String(reason).trim().length < 8) return { allowed: false, reason: "Justificativa obrigatoria" };
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return { allowed: false, reason: "Valor invalido" };
  if (!sourceWallet || sourceWallet.status !== "approved") return { allowed: false, reason: "Origem nao aprovada" };
  if (!destinationWallet || destinationWallet.status !== "approved") return { allowed: false, reason: "Destino nao aprovado" };
  if (sourceWallet.chain_id === destinationWallet.chain_id) return { allowed: false, reason: "Use transferencia para mesma chain" };
  const sourceCheck = await checkAddress({ chainId: sourceWallet.chain_id, address: sourceWallet.address });
  if (!sourceCheck.allowed) return { allowed: false, reason: `Origem: ${sourceCheck.reason}` };
  const destinationCheck = await checkAddress({ chainId: destinationWallet.chain_id, address: destinationWallet.address });
  if (!destinationCheck.allowed) return { allowed: false, reason: `Destino: ${destinationCheck.reason}` };
  return { allowed: true };
};
