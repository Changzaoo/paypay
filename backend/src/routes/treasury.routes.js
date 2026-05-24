import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { parseBody } from "../utils/validators.js";
import { bridgeSchema, chainSchema, decisionSchema, groupSchema, hdWalletSchema, querySchema, riskRuleSchema, tokenSchema, transferSchema, walletSchema } from "../utils/treasury.validators.js";
import * as approvalService from "../services/treasury/approvalService.js";
import * as auditService from "../services/treasury/auditService.js";
import * as bridgeService from "../services/treasury/bridgeService.js";
import * as chainService from "../services/treasury/chainService.js";
import * as rbacService from "../services/treasury/rbacService.js";
import * as riskService from "../services/treasury/riskService.js";
import * as transferService from "../services/treasury/transferService.js";
import * as walletService from "../services/treasury/walletService.js";

const router = Router();

const mapChain = (body) => ({
  chain_key: body.chainKey,
  chain_id: body.chainId,
  name: body.name,
  rpc_url: body.rpcUrl,
  explorer_url: body.explorerUrl,
  native_symbol: body.nativeSymbol,
  native_decimals: body.nativeDecimals,
  status: body.status
});

const mapToken = (body) => ({
  chain_id: body.chainId,
  symbol: body.symbol,
  name: body.name,
  contract_address: body.contractAddress,
  decimals: body.decimals,
  is_native: body.isNative,
  status: body.status
});

const role = (...roles) => (req, res, next) => {
  try {
    rbacService.ensureRole(req.actor, roles);
    next();
  } catch (error) {
    next(error);
  }
};

const withActor = async (req, res, next) => {
  try {
    req.actor = await rbacService.getActor(req.account);
    next();
  } catch (error) {
    next(error);
  }
};

const query = (req) => parseBody(querySchema, req.query || {});

const csv = (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  const keys = Array.from(list.reduce((set, row) => {
    Object.keys(row || {}).forEach((key) => set.add(key));
    return set;
  }, new Set()));
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...list.map((row) => keys.map((key) => escape(typeof row[key] === "object" ? JSON.stringify(row[key]) : row[key])).join(","))].join("\n");
};

router.post("/jobs/process", async (req, res, next) => {
  try {
    const secret = process.env.TREASURY_JOB_SECRET || process.env.JOB_SECRET;
    if (!secret || req.headers["x-job-secret"] !== secret) {
      const error = new Error("Acesso restrito");
      error.status = 403;
      throw error;
    }
    res.json({ items: await transferService.processQueue() });
  } catch (error) {
    next(error);
  }
});

router.use(requireAuth, withActor);

router.get("/summary", role("admin", "operator", "auditor"), async (req, res, next) => {
  try {
    const [wallets, transfers, bridges, txs] = await Promise.all([
      walletService.listWallets(),
      transferService.listRequests(),
      bridgeService.listRequests(),
      transferService.listTransactions()
    ]);
    res.json({
      wallets: wallets.length,
      approvedWallets: wallets.filter((item) => item.status === "approved").length,
      pendingTransfers: transfers.filter((item) => item.status === "pending_approval").length,
      pendingBridges: bridges.filter((item) => item.status === "pending_approval").length,
      queuedTransactions: txs.filter((item) => item.status === "queued").length,
      byChain: wallets.reduce((acc, wallet) => {
        const key = wallet.chain_configs?.chain_key || wallet.chain_id;
        acc[key] = (acc[key] || 0) + Number(wallet.expected_balance || 0);
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
});

router.get("/chains", role("admin", "operator", "auditor"), async (req, res, next) => {
  try {
    res.json({ items: await chainService.listChains() });
  } catch (error) {
    next(error);
  }
});

router.post("/chains", role("admin"), async (req, res, next) => {
  try {
    const body = parseBody(chainSchema, req.body);
    const item = await chainService.upsertChain(mapChain(body));
    await auditService.log({ actor: req.actor, action: "chain.upsert", entityType: "chain_config", entityId: item.id, payload: body, ip: req.ip });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.get("/tokens", role("admin", "operator", "auditor"), async (req, res, next) => {
  try {
    res.json({ items: await chainService.listTokens() });
  } catch (error) {
    next(error);
  }
});

router.post("/tokens", role("admin"), async (req, res, next) => {
  try {
    const body = parseBody(tokenSchema, req.body);
    const item = await chainService.upsertToken(mapToken(body));
    await auditService.log({ actor: req.actor, action: "token.upsert", entityType: "token_config", entityId: item.id, payload: body, ip: req.ip });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.get("/wallet-groups", role("admin", "operator", "auditor"), async (req, res, next) => {
  try {
    res.json({ items: await walletService.listGroups() });
  } catch (error) {
    next(error);
  }
});

router.post("/wallet-groups", role("admin"), async (req, res, next) => {
  try {
    const body = parseBody(groupSchema, req.body);
    const item = await walletService.createGroup(body);
    await auditService.log({ actor: req.actor, action: "wallet_group.create", entityType: "wallet_group", entityId: item.id, payload: body, ip: req.ip });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.get("/wallets", role("admin", "operator", "auditor"), async (req, res, next) => {
  try {
    res.json({ items: await walletService.listWallets(query(req)) });
  } catch (error) {
    next(error);
  }
});

router.post("/wallets", role("admin", "operator"), async (req, res, next) => {
  try {
    const body = parseBody(walletSchema, req.body);
    const item = await walletService.createWallet(body, req.actor);
    await auditService.log({ actor: req.actor, action: "wallet.create", entityType: "wallet", entityId: item.id, payload: body, ip: req.ip });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.post("/wallets/hd", role("admin"), async (req, res, next) => {
  try {
    const body = parseBody(hdWalletSchema, req.body);
    const item = await walletService.generateHdWallet(body, req.actor);
    await auditService.log({ actor: req.actor, action: "wallet.generate_hd", entityType: "wallet", entityId: item.id, payload: { ...body, path: body.path }, ip: req.ip });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.patch("/wallets/:id", role("admin"), async (req, res, next) => {
  try {
    const item = await walletService.updateWallet(req.params.id, req.body || {}, req.actor);
    await auditService.log({ actor: req.actor, action: "wallet.update", entityType: "wallet", entityId: item.id, payload: req.body, ip: req.ip });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.get("/transfers", role("admin", "operator", "auditor"), async (req, res, next) => {
  try {
    res.json({ items: await transferService.listRequests(query(req)) });
  } catch (error) {
    next(error);
  }
});

router.post("/transfers", role("admin", "operator"), async (req, res, next) => {
  try {
    const body = parseBody(transferSchema, req.body);
    res.status(201).json(await transferService.createRequest({ actor: req.actor, payload: body, ip: req.ip }));
  } catch (error) {
    next(error);
  }
});

router.post("/transfers/:id/decision", role("admin"), async (req, res, next) => {
  try {
    const body = parseBody(decisionSchema, req.body);
    res.json(await transferService.approveRequest({ actor: req.actor, id: req.params.id, decision: body.decision, note: body.note, ip: req.ip }));
  } catch (error) {
    next(error);
  }
});

router.get("/transactions", role("admin", "operator", "auditor"), async (req, res, next) => {
  try {
    res.json({ items: await transferService.listTransactions(query(req)) });
  } catch (error) {
    next(error);
  }
});

router.post("/transactions/:id/retry", role("admin"), async (req, res, next) => {
  try {
    res.json(await transferService.retryTransaction({ actor: req.actor, id: req.params.id, ip: req.ip }));
  } catch (error) {
    next(error);
  }
});

router.get("/bridges", role("admin", "operator", "auditor"), async (req, res, next) => {
  try {
    res.json({ items: await bridgeService.listRequests(query(req)), providers: bridgeService.listProviders() });
  } catch (error) {
    next(error);
  }
});

router.post("/bridges", role("admin", "operator"), async (req, res, next) => {
  try {
    const body = parseBody(bridgeSchema, req.body);
    res.status(201).json(await bridgeService.createRequest({ actor: req.actor, payload: body, ip: req.ip }));
  } catch (error) {
    next(error);
  }
});

router.post("/bridges/:id/decision", role("admin"), async (req, res, next) => {
  try {
    const body = parseBody(decisionSchema, req.body);
    res.json(await bridgeService.approveRequest({ actor: req.actor, id: req.params.id, decision: body.decision, note: body.note, ip: req.ip }));
  } catch (error) {
    next(error);
  }
});

router.get("/bridges/:id/steps", role("admin", "operator", "auditor"), async (req, res, next) => {
  try {
    res.json({ items: await bridgeService.listSteps(req.params.id) });
  } catch (error) {
    next(error);
  }
});

router.get("/risk-rules", role("admin", "operator", "auditor"), async (req, res, next) => {
  try {
    res.json({ items: await riskService.listRules() });
  } catch (error) {
    next(error);
  }
});

router.post("/risk-rules", role("admin"), async (req, res, next) => {
  try {
    const body = parseBody(riskRuleSchema, req.body);
    const item = await riskService.createRule({
      rule_type: body.ruleType,
      chain_id: body.chainId,
      value: body.value,
      reason: body.reason,
      status: body.status
    });
    await auditService.log({ actor: req.actor, action: "risk_rule.create", entityType: "risk_rule", entityId: item.id, payload: body, ip: req.ip });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.get("/audit-logs", role("admin", "auditor"), async (req, res, next) => {
  try {
    res.json({ items: await auditService.list(query(req)) });
  } catch (error) {
    next(error);
  }
});

router.get("/history", role("admin", "operator", "auditor"), async (req, res, next) => {
  try {
    const [transactions, bridges] = await Promise.all([
      transferService.listTransactions(query(req)),
      bridgeService.listRequests(query(req))
    ]);
    res.json({ transactions, bridges });
  } catch (error) {
    next(error);
  }
});

router.get("/export.csv", role("admin", "auditor"), async (req, res, next) => {
  try {
    const filters = query(req);
    const [transactions, audits] = await Promise.all([
      transferService.listTransactions(filters),
      auditService.list(filters)
    ]);
    res.type("text/csv").send(csv([...transactions.map((item) => ({ kind: "transaction", ...item })), ...audits.map((item) => ({ kind: "audit", ...item }))]));
  } catch (error) {
    next(error);
  }
});

router.get("/reconciliation", role("admin", "auditor"), async (req, res, next) => {
  try {
    const wallets = await walletService.listWallets(query(req));
    const items = [];
    for (const wallet of wallets.slice(0, 50)) {
      try {
        const chain = await chainService.getChain(wallet.chain_id);
        const onchain = await chainService.getNativeBalance({ chain, address: wallet.address });
        const expected = String(wallet.expected_balance || 0);
        items.push({ walletId: wallet.id, name: wallet.name, chain: chain.chain_key, address: wallet.address, expected, onchain, divergent: Number(expected) !== Number(onchain) });
      } catch (error) {
        items.push({ walletId: wallet.id, name: wallet.name, address: wallet.address, expected: String(wallet.expected_balance || 0), onchain: null, divergent: true, error: error.message });
      }
    }
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.get("/approvals", role("admin", "auditor"), async (req, res, next) => {
  try {
    res.json({ items: await approvalService.listApprovals(query(req)) });
  } catch (error) {
    next(error);
  }
});

export default router;
