import { Router } from "express";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { createFlow, getFlow, getFlowStatus, listFlow, manualUpdate, retryFlow } from "../services/flow.service.js";
import { flowCreateSchema, flowQuerySchema, manualSchema, parseBody, retrySchema } from "../utils/validators.js";

const router = Router();

router.use(requireAuth);

router.post("/create", async (req, res, next) => {
  try {
    const body = parseBody(flowCreateSchema, req.body);
    const data = await createFlow(req.account, body, req.ip);
    res.status(201).json({
      id: data.id,
      publicId: data.publicId,
      status: data.status,
      qrCode: data.input.qrCode,
      qrImageUrl: data.input.qrImageUrl,
      expiresAt: data.input.expiresAt,
      amountBrl: data.amountBrl
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const filters = parseBody(flowQuerySchema, req.query);
    res.json({ items: await listFlow(filters, req.account) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    res.json(await getFlow(req.params.id, req.account));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/status", async (req, res, next) => {
  try {
    res.json(await getFlowStatus(req.params.id, req.account));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/retry", requireAdmin, async (req, res, next) => {
  try {
    const body = parseBody(retrySchema, req.body || {});
    res.json(await retryFlow(req.params.id, req.account, body));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/manual-update", requireAdmin, async (req, res, next) => {
  try {
    const body = parseBody(manualSchema, req.body);
    res.json(await manualUpdate(req.params.id, req.account, body));
  } catch (error) {
    next(error);
  }
});

export default router;
