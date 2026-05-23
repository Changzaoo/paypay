import { Router } from "express";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { getAdminClient, getSetting, upsertSetting } from "../services/db.service.js";
import { assets, networks } from "../utils/address.js";

const router = Router();

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
    for (const table of ["internal_orders", "internal_settings", "internal_events", "internal_jobs"]) {
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
      settlement: Boolean(process.env.SIDESHIFT_SECRET)
    }
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
