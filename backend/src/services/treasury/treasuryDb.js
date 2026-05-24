import { getAdminClient } from "../db.service.js";

export const unwrap = ({ data, error }) => {
  if (error) {
    const next = new Error(error.message || "Falha de banco");
    next.status = 500;
    next.code = error.code;
    throw next;
  }
  return data;
};

export const db = () => getAdminClient();

export const now = () => new Date().toISOString();

export const one = async (query) => unwrap(await query.single());

export const maybe = async (query) => unwrap(await query.maybeSingle());

export const many = async (query) => unwrap(await query);

export const idFilter = (query, id) => query.eq("id", id);
