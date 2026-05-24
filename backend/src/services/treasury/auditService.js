import { db, one, many } from "./treasuryDb.js";

const cleanPayload = (payload = {}) => {
  const text = JSON.stringify(payload, (key, value) => {
    if (/secret|seed|private|mnemonic|key|token|rpc|url/i.test(key)) return "[redacted]";
    return value;
  });
  return JSON.parse(text || "{}");
};

export const log = async ({ actor, action, entityType, entityId, payload, ip }) => {
  return one(db().from("audit_logs").insert({
    actor_id: actor?.id,
    actor_email: actor?.email,
    actor_role: actor?.role,
    action,
    entity_type: entityType,
    entity_id: entityId,
    ip_address: ip,
    payload: cleanPayload(payload)
  }).select("*"));
};

export const list = async (filters = {}) => {
  let query = db().from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  return many(query);
};
