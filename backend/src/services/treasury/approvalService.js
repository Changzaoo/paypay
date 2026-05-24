import { db, many, one } from "./treasuryDb.js";
import * as auditService from "./auditService.js";

export const listApprovals = async (filters = {}) => {
  let query = db().from("approvals").select("*").order("created_at", { ascending: false }).limit(500);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.status) query = query.eq("status", filters.status);
  return many(query);
};

export const createApproval = async ({ actor, entityType, entityId, decision = "pending", note, ip }) => {
  const row = await one(db().from("approvals").insert({
    entity_type: entityType,
    entity_id: entityId,
    decision,
    note,
    approver_id: decision === "pending" ? null : actor.id,
    approver_email: decision === "pending" ? null : actor.email
  }).select("*"));
  await auditService.log({ actor, action: `approval.${decision}`, entityType, entityId, payload: { note }, ip });
  return row;
};

export const decide = async ({ actor, entityType, entityId, decision, note, ip }) => {
  const row = await one(db().from("approvals").insert({
    entity_type: entityType,
    entity_id: entityId,
    decision,
    note,
    approver_id: actor.id,
    approver_email: actor.email
  }).select("*"));
  await auditService.log({ actor, action: `${entityType}.${decision}`, entityType, entityId, payload: { note }, ip });
  return row;
};
