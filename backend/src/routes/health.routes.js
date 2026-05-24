import { Router } from "express";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { getAdminClient, getSetting, upsertSetting } from "../services/db.service.js";
import { settlementSource } from "../services/flowAssets.service.js";
import * as providerC from "../services/providerC.service.js";
import { assets, fallbackSettlementOptions, networkLabels, networks } from "../utils/address.js";

const router = Router();
const optionCache = { expiresAt: 0, items: null };

const titleCase = (value) => String(value || "").replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const isOffline = (value, network) => {
  if (value === true) return true;
  if (!Array.isArray(value)) return false;
  return value.map((item) => String(item).toLowerCase()).includes(network);
};

const optionPriority = (coin) => {
  const index = ["BTC", "ETH", "USDT", "USDC", "SOL", "XMR"].indexOf(coin);
  return index === -1 ? 99 : index;
};

const normalizeOptions = (coins) => {
  const rows = Array.isArray(coins) ? coins : [];
  return rows
    .map((item) => {
      const coin = String(item.coin || "").trim().toUpperCase();
      const sourceMethod = settlementSource();
      const memo = new Set((Array.isArray(item.networksWithMemo) ? item.networksWithMemo : []).map((value) => String(value).toLowerCase()));
      const routes = (Array.isArray(item.networks) ? item.networks : [])
        .map((network) => String(network || "").trim().toLowerCase())
        .filter(Boolean)
        .filter((network) => !(coin === sourceMethod.coin && network === sourceMethod.network))
        .filter((network) => !isOffline(item.settleOffline, network))
        .map((network) => ({
          id: network,
          label: networkLabels[network] || titleCase(network),
          hasMemo: memo.has(network)
        }));
      if (!coin || !routes.length) return null;
      return {
        coin,
        name: item.name || coin,
        networks: routes
      };
    })
    .filter(Boolean)
    .sort((a, b) => optionPriority(a.coin) - optionPriority(b.coin) || a.coin.localeCompare(b.coin));
};

const loadSettlementOptions = async (ip) => {
  if (optionCache.items && optionCache.expiresAt > Date.now()) return optionCache.items;
  try {
    const options = normalizeOptions(await providerC.getCoins(ip));
    if (options.length) {
      optionCache.items = options;
      optionCache.expiresAt = Date.now() + 5 * 60 * 1000;
      return options;
    }
  } catch {
    optionCache.items = null;
    optionCache.expiresAt = 0;
  }
  return fallbackSettlementOptions;
};

router.get("/health", async (req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString()
  });
});

router.get("/health/deps", async (req, res) => {
  const tables = {};
  let db = false;
  try {
    for (const table of ["internal_orders", "internal_settings", "internal_events", "internal_jobs", "internal_threads", "internal_messages"]) {
      const { error } = await getAdminClient().from(table).select("id").limit(1);
      tables[table] = error ? error.code || "error" : "ok";
    }
    db = Object.values(tables).every((value) => value === "ok");
  } catch (error) {
    tables.error = error.message;
  }
  res.json({
    ok: db,
    env: {
      supabaseUrl: Boolean(process.env.SUPABASE_URL),
      serviceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      anonKey: Boolean(process.env.SUPABASE_ANON_KEY),
      frontendUrl: Boolean(process.env.FRONTEND_PUBLIC_URL),
      backendUrl: Boolean(process.env.BACKEND_PUBLIC_URL)
    },
    tables
  });
});

router.get("/config/public", requireAuth, async (req, res) => {
  let dbOk = false;
  try {
    const { error } = await getAdminClient().from("internal_settings").select("id").limit(1);
    dbOk = !error;
  } catch {
    dbOk = false;
  }
  res.json({
    backendUrl: process.env.BACKEND_PUBLIC_URL || "",
    networks,
    assets,
    status: {
      account: dbOk,
      entry: Boolean(process.env.PIXGO_API_KEY),
      route: true,
      settlement: Boolean(process.env.SIDESHIFT_SECRET),
      intermediate: Boolean(process.env.SIDESWAP_EXECUTOR_URL || process.env.PROVIDER_B_API_URL),
      liquid: Boolean(process.env.LIQUID_RPC_URL)
    }
  });
});

router.get("/config/settlement-options", requireAuth, async (req, res) => {
  res.json({
    source: settlementSource(),
    items: await loadSettlementOptions(req.ip)
  });
});

router.get("/config/settings", requireAuth, async (req, res, next) => {
  try {
    res.json({
      intermediateMode: await getSetting("intermediate_mode", { mode: "manual" }),
      enabledNetworks: await getSetting("enabled_networks", { networks })
    });
  } catch (error) {
    next(error);
  }
});

router.post("/config/settings", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const mode = req.body?.intermediateMode?.mode === "automatic" ? "automatic" : "manual";
    const enabled = Array.isArray(req.body?.enabledNetworks?.networks)
      ? req.body.enabledNetworks.networks.filter((item) => networks.includes(item))
      : networks;
    await upsertSetting("intermediate_mode", { mode });
    await upsertSetting("enabled_networks", { networks: enabled });
    res.json({
      intermediateMode: { mode },
      enabledNetworks: { networks: enabled }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
