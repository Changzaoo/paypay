import { createClient } from "@supabase/supabase-js";

let adminClient;
let authClient;

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    const error = new Error(`Configuração ausente: ${key}`);
    error.status = 500;
    throw error;
  }
  return value;
};

export const getAdminClient = () => {
  if (!adminClient) {
    adminClient = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return adminClient;
};

export const getAuthClient = () => {
  if (!authClient) {
    authClient = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return authClient;
};

const unwrap = ({ data, error }) => {
  if (error) {
    const next = new Error(error.message || "Falha de banco");
    next.status = 500;
    next.code = error.code;
    throw next;
  }
  return data;
};

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));

export const insertOrder = async (value) => {
  return unwrap(await getAdminClient().from("internal_orders").insert(value).select("*").single());
};

export const updateOrder = async (id, value) => {
  return unwrap(await getAdminClient().from("internal_orders").update(value).eq("id", id).select("*").single());
};

export const listOrders = async (filters = {}, account = {}) => {
  let query = getAdminClient().from("internal_orders").select("*").order("created_at", { ascending: false }).limit(250);
  if (!account.isAdmin && account.id) query = query.eq("operator_id", account.id);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.asset) query = query.eq("settlement_output_asset", String(filters.asset).toUpperCase());
  if (filters.network) query = query.eq("settlement_output_network", String(filters.network).toLowerCase());
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
  if (filters.search) {
    const term = String(filters.search).replace(/[^a-zA-Z0-9@.\-_: ]/g, "");
    query = query.or(`public_id.ilike.%${term}%,settlement_output_address.ilike.%${term}%,customer_name.ilike.%${term}%`);
  }
  return unwrap(await query);
};

export const getOrder = async (id, account = {}) => {
  let query = getAdminClient().from("internal_orders").select("*");
  query = isUuid(id) ? query.eq("id", id) : query.eq("public_id", String(id).toUpperCase());
  if (!account.isAdmin && account.id) query = query.eq("operator_id", account.id);
  const data = unwrap(await query.maybeSingle());
  if (!data) {
    const error = new Error("Registro não encontrado");
    error.status = 404;
    throw error;
  }
  return data;
};

export const getOrderByExternalRef = async (externalRef) => {
  return unwrap(await getAdminClient().from("internal_orders").select("*").eq("external_ref", externalRef).maybeSingle());
};

export const getOrderByProviderId = async (providerId) => {
  return unwrap(await getAdminClient().from("internal_orders").select("*").eq("input_provider_id", providerId).maybeSingle());
};

export const insertEvent = async (value) => {
  const result = await getAdminClient().from("internal_events").insert(value).select("*").single();
  if (result.error?.code === "23505") return null;
  return unwrap(result);
};

export const insertJob = async (value) => {
  return unwrap(await getAdminClient().from("internal_jobs").insert(value).select("*").single());
};

export const updateJob = async (id, value) => {
  return unwrap(await getAdminClient().from("internal_jobs").update(value).eq("id", id).select("*").single());
};

export const listRunnableJobs = async (limit = 20) => {
  return unwrap(await getAdminClient()
    .from("internal_jobs")
    .select("*, internal_orders(*)")
    .in("status", ["QUEUED", "RETRY"])
    .lte("run_after", new Date().toISOString())
    .order("run_after", { ascending: true })
    .limit(limit));
};

export const listOrdersByStatus = async (statuses) => {
  return unwrap(await getAdminClient()
    .from("internal_orders")
    .select("*")
    .in("status", statuses)
    .order("created_at", { ascending: true })
    .limit(100));
};

export const getSetting = async (key, fallback = null) => {
  const data = unwrap(await getAdminClient().from("internal_settings").select("value").eq("key", key).maybeSingle());
  return data?.value ?? fallback;
};

export const upsertSetting = async (key, value) => {
  return unwrap(await getAdminClient().from("internal_settings").upsert({ key, value }, { onConflict: "key" }).select("*").single());
};

export const listChannelThreads = async (filters = {}) => {
  let query = getAdminClient().from("internal_threads").select("*").order("last_event_at", { ascending: false }).limit(120);
  if (filters.search) {
    const term = String(filters.search).replace(/[^a-zA-Z0-9@.\-_: +]/g, "");
    query = query.or(`display_name.ilike.%${term}%,address.ilike.%${term}%,last_text.ilike.%${term}%`);
  }
  return unwrap(await query);
};

export const getChannelThread = async (id) => {
  let query = getAdminClient().from("internal_threads").select("*");
  query = isUuid(id) ? query.eq("id", id) : query.eq("channel_ref", String(id));
  const data = unwrap(await query.maybeSingle());
  if (!data) {
    const error = new Error("Conversa nao encontrada");
    error.status = 404;
    throw error;
  }
  return data;
};

export const upsertChannelThread = async (value) => {
  return unwrap(await getAdminClient()
    .from("internal_threads")
    .upsert(value, { onConflict: "channel_ref" })
    .select("*")
    .single());
};

export const updateChannelThread = async (id, value) => {
  return unwrap(await getAdminClient().from("internal_threads").update(value).eq("id", id).select("*").single());
};

export const listChannelMessages = async (threadId) => {
  return unwrap(await getAdminClient()
    .from("internal_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(250));
};

export const insertChannelMessage = async (value) => {
  const result = await getAdminClient().from("internal_messages").insert(value).select("*").single();
  if (result.error?.code === "23505" && value.provider_ref) {
    return unwrap(await getAdminClient().from("internal_messages").select("*").eq("provider_ref", value.provider_ref).single());
  }
  return unwrap(result);
};

export const updateChannelMessageByProviderRef = async (providerRef, value) => {
  return unwrap(await getAdminClient().from("internal_messages").update(value).eq("provider_ref", providerRef).select("*").maybeSingle());
};
