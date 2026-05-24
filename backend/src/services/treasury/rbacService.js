import { db, maybe, one } from "./treasuryDb.js";

export const getActor = async (account) => {
  const existing = await maybe(db().from("users_profile").select("*").eq("user_id", account.id));
  if (existing) {
    if (existing.status !== "active") {
      const error = new Error("Acesso restrito");
      error.status = 403;
      throw error;
    }
    return {
      id: account.id,
      email: account.email,
      role: account.isAdmin ? "admin" : existing.role,
      profile: existing
    };
  }
  const role = account.isAdmin ? "admin" : "operator";
  const profile = await one(db().from("users_profile").insert({
    user_id: account.id,
    email: account.email,
    role,
    status: "active"
  }).select("*"));
  return {
    id: account.id,
    email: account.email,
    role,
    profile
  };
};

export const can = (actor, roles) => roles.includes(actor.role);

export const ensureRole = (actor, roles) => {
  if (!can(actor, roles)) {
    const error = new Error("Acesso restrito");
    error.status = 403;
    throw error;
  }
};
