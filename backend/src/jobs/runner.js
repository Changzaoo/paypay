import * as db from "../services/db.service.js";
import { checkPendingPayment, monitorFinalShift, processNext } from "../services/flow.service.js";

const nextRun = (attempts) => new Date(Date.now() + Math.min(900, 30 * Math.max(1, attempts)) * 1000).toISOString();

const failJob = async (job, error) => {
  const attempts = Number(job.attempts || 0) + 1;
  if (attempts >= Number(job.max_attempts || 5)) {
    await db.updateJob(job.id, {
      status: "FAILED",
      attempts,
      error_message: error.message || "Falha"
    });
    if (job.order_id) {
      await db.updateOrder(job.order_id, {
        status: "FAILED",
        error_message: "Etapa indisponível"
      });
    }
    return;
  }
  await db.updateJob(job.id, {
    status: "RETRY",
    attempts,
    run_after: nextRun(attempts),
    error_message: error.message || "Falha"
  });
};

const runJob = async (job, ip) => {
  await db.updateJob(job.id, {
    status: "RUNNING",
    locked_at: new Date().toISOString()
  });
  try {
    const order = job.internal_orders || await db.getOrder(job.order_id, { isAdmin: true });
    if (job.job_type === "PAYMENT_FALLBACK") await checkPendingPayment(order);
    if (job.job_type === "NEXT_STEP") await processNext(order, ip);
    if (job.job_type === "FINAL_MONITOR") await monitorFinalShift(order, ip);
    await db.updateJob(job.id, {
      status: "DONE",
      error_message: null
    });
  } catch (error) {
    await failJob(job, error);
  }
};

const expireOld = async () => {
  const rows = await db.listOrdersByStatus(["WAITING_PAYMENT"]);
  const now = Date.now();
  await Promise.all(rows.map(async (order) => {
    if (!order.input_expires_at) return;
    if (new Date(order.input_expires_at).getTime() <= now) {
      await db.updateOrder(order.id, {
        status: "EXPIRED",
        input_status: "EXPIRED"
      });
    }
  }));
};

export const runJobs = async ({ limit = 20, ip = "127.0.0.1" } = {}) => {
  await expireOld();
  const jobs = await db.listRunnableJobs(limit);
  for (const job of jobs) {
    await runJob(job, ip);
  }
  return { processed: jobs.length };
};
