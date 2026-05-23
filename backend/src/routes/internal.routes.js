import { Router } from "express";
import { runJobs } from "../jobs/runner.js";

const router = Router();

router.post("/jobs/process", async (req, res, next) => {
  try {
    if (!process.env.JOB_SECRET || req.headers["x-job-secret"] !== process.env.JOB_SECRET) {
      const error = new Error("Acesso restrito");
      error.status = 403;
      throw error;
    }
    res.json(await runJobs({ ip: req.ip }));
  } catch (error) {
    next(error);
  }
});

export default router;
