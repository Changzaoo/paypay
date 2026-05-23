import { getAuthClient } from "../services/db.service.js";

const adminSet = () => {
  return new Set(String(process.env.ADMIN_EMAILS || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      const error = new Error("Sessão ausente");
      error.status = 401;
      throw error;
    }
    const { data, error } = await getAuthClient().auth.getUser(token);
    if (error || !data?.user) {
      const nextError = new Error("Sessão inválida");
      nextError.status = 401;
      throw nextError;
    }
    const email = String(data.user.email || "").toLowerCase();
    req.account = {
      id: data.user.id,
      email,
      isAdmin: adminSet().has(email)
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.account?.isAdmin) {
    const error = new Error("Acesso restrito");
    error.status = 403;
    next(error);
    return;
  }
  next();
};
