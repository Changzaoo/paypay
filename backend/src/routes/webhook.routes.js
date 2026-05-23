import { Router } from "express";
import { handleProviderEvent } from "../services/flow.service.js";

const router = Router();

router.post("/pixgo", async (req, res, next) => {
  try {
    await handleProviderEvent({
      headers: req.headers,
      rawBody: req.rawBody,
      body: req.body
    });
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
