import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import flowRoutes from "./routes/flow.routes.js";
import healthRoutes from "./routes/health.routes.js";
import internalRoutes from "./routes/internal.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import { requireAuth } from "./middlewares/auth.js";
import { errorHandler, notFound } from "./middlewares/error.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    const allowed = process.env.FRONTEND_PUBLIC_URL;
    if (!origin || origin === allowed) return callback(null, true);
    return callback(new Error("Origem não permitida"));
  },
  credentials: true
}));
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
}));
app.use(express.json({
  limit: "1mb",
  verify: (req, res, buffer) => {
    req.rawBody = buffer.toString("utf8");
  }
}));

app.post("/api/auth/session-check", requireAuth, (req, res) => {
  res.json({
    ok: true,
    account: {
      id: req.account.id,
      email: req.account.email,
      isAdmin: req.account.isAdmin
    }
  });
});

app.use("/api/flow", flowRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/internal", internalRoutes);
app.use("/api", healthRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
