import * as db from "./db.service.js";
import * as providerA from "./providerA.service.js";
import * as providerB from "./providerB.service.js";
import * as providerC from "./providerC.service.js";
import { explorerUrl } from "../utils/address.js";
import { hashValue, makePublicId, makeRef } from "../utils/crypto.js";

const finalStatuses = new Set(["COMPLETED", "FAILED", "EXPIRED", "REFUNDED", "CANCELLED"]);
const paidStatuses = new Set(["completed", "paid", "confirmed", "payment.completed"]);
const expiredStatuses = new Set(["expired", "payment.expired"]);
const refundedStatuses = new Set(["refunded", "payment.refunded"]);
const settledStatuses = new Set(["settled", "completed", "complete", "done"]);
const failedStatuses = new Set(["failed", "expired", "refunded", "cancelled", "canceled"]);

const readPayment = (data = {}) => {
  const source = data.payment || data.data || data;
  return {
    paymentId: source.payment_id || source.paymentId || source.id,
    externalRef: source.external_id || source.externalRef || source.external_ref,
    amount: source.amount,
    status: source.status,
    qrCode: source.qr_code || source.qrCode || source.copy_paste || source.copyPaste || source.pix_copy_paste,
    qrImageUrl: source.qr_image_url || source.qrImageUrl || source.qr_url,
    expiresAt: source.expires_at || source.expiresAt,
    createdAt: source.created_at || source.createdAt
  };
};

const readShift = (data = {}) => {
  const source = data.shift || data.data || data;
  return {
    id: source.id || source.shiftId || source.shift_id,
    status: source.status,
    depositAddress: source.depositAddress || source.deposit_address,
    depositAmount: source.depositAmount || source.deposit_amount,
    settleAmount: source.settleAmount || source.settle_amount,
    expiresAt: source.expiresAt || source.expires_at,
    settleHash: source.settleHash || source.settle_hash || source.settleTxid || source.settle_txid || source.transactionId,
    raw: source
  };
};

export const timelineFor = (order) => {
  const steps = [
    ["CREATED", "Cobranca PIX"],
    ["WAITING_PAYMENT", "Aguardando PIX"],
    ["PAYMENT_CONFIRMED", "PIX confirmado"],
    ["WAITING_INTERMEDIATE_SETTLEMENT", "Aguardando liquidação"],
    ["INTERMEDIATE_CONVERSION_STARTED", "Conversão intermediária"],
    ["FINAL_SHIFT_CREATED", "Conversão final"],
    ["WAITING_FINAL_DEPOSIT", "Envio final"],
    ["COMPLETED", "Concluído"]
  ];
  const ranks = {
    CREATED: 0,
    WAITING_PAYMENT: 1,
    PAYMENT_CONFIRMED: 2,
    WAITING_INTERMEDIATE_SETTLEMENT: 3,
    WAITING_MANUAL_STEP: 4,
    INTERMEDIATE_RECEIVED: 4,
    INTERMEDIATE_CONVERSION_STARTED: 4,
    INTERMEDIATE_CONVERSION_DONE: 5,
    FINAL_SHIFT_CREATED: 5,
    WAITING_FINAL_DEPOSIT: 6,
    FINAL_PROCESSING: 6,
    COMPLETED: 7
  };
  const rank = ranks[order.status] ?? 0;
  return steps.map(([key, label], index) => ({
    key,
    label,
    state: order.status === "FAILED" && index === Math.min(rank, steps.length - 1) ? "error" : index < rank ? "done" : index === rank ? "current" : "pending"
  }));
};

export const shapeOrder = (order) => ({
  id: order.id,
  publicId: order.public_id,
  status: order.status,
  amountBrl: Number(order.input_amount_brl || 0),
  customerName: order.customer_name,
  customerEmail: order.customer_email,
  outputAsset: order.settlement_output_asset,
  outputNetwork: order.settlement_output_network,
  outputAddress: order.settlement_output_address,
  input: {
    status: order.input_status,
    qrCode: order.input_qr_code,
    qrImageUrl: order.input_qr_image_url,
    expiresAt: order.input_expires_at,
    providerId: order.input_provider_id
  },
  intermediate: {
    status: order.intermediate_status,
    expectedAmount: order.intermediate_expected_amount,
    receivedAmount: order.intermediate_received_amount,
    txid: order.intermediate_txid,
    note: order.intermediate_note
  },
  settlement: {
    status: order.settlement_status,
    providerId: order.settlement_provider_id,
    depositAddress: order.settlement_deposit_address,
    depositAmount: order.settlement_deposit_amount,
    settleAmount: order.settlement_settle_amount,
    outputAsset: order.settlement_output_asset,
    outputNetwork: order.settlement_output_network,
    outputAddress: order.settlement_output_address,
    txid: order.settlement_output_txid,
    explorerUrl: explorerUrl(order.settlement_output_network, order.settlement_output_txid)
  },
  timeline: timelineFor(order),
  error: order.error_message,
  createdAt: order.created_at,
  updatedAt: order.updated_at
});

const nextRun = (seconds) => new Date(Date.now() + seconds * 1000).toISOString();

const insertNextJob = async (orderId, jobType, seconds = 5) => {
  return db.insertJob({
    order_id: orderId,
    job_type: jobType,
    status: "QUEUED",
    run_after: nextRun(seconds)
  });
};

export const createFlow = async (account, payload, ip) => {
  const publicId = makePublicId();
  const externalRef = makeRef("order");
  const base = await db.insertOrder({
    public_id: publicId,
    operator_id: account.id,
    operator_ip: ip,
    external_ref: externalRef,
    input_amount_brl: payload.amountBrl,
    input_status: "CREATED",
    customer_name: payload.customerName || null,
    customer_email: payload.customerEmail || null,
    customer_phone: payload.customerPhone || null,
    customer_document: payload.customerDocument || null,
    settlement_output_asset: payload.outputAsset,
    settlement_output_network: payload.outputNetwork,
    settlement_output_address: payload.outputAddress,
    refund_address: payload.refundAddress || null,
    raw_settlement: payload.outputMemo ? { outputMemo: payload.outputMemo } : null,
    status: "CREATED"
  });
  try {
    const result = await providerA.createPayment({
      amount: payload.amountBrl,
      description: `Operação ${publicId}`,
      external_id: externalRef,
      receiver_name: payload.customerName,
      receiver_cpf: payload.customerDocument,
      receiver_email: payload.customerEmail,
      receiver_phone: payload.customerPhone,
      webhook_url: `${process.env.BACKEND_PUBLIC_URL || ""}/api/webhooks/pixgo`
    });
    const payment = readPayment(result);
    const order = await db.updateOrder(base.id, {
      input_provider_id: payment.paymentId,
      input_status: payment.status || "WAITING_PAYMENT",
      input_qr_code: payment.qrCode,
      input_qr_image_url: payment.qrImageUrl,
      input_expires_at: payment.expiresAt,
      raw_input: result,
      status: "WAITING_PAYMENT",
      error_message: null
    });
    await db.insertEvent({
      order_id: order.id,
      event_type: "created",
      source: "providerA",
      payload: { publicId: order.public_id }
    });
    await insertNextJob(order.id, "PAYMENT_FALLBACK", 90);
    return shapeOrder(order);
  } catch (error) {
    await db.updateOrder(base.id, {
      status: "FAILED",
      error_message: "Falha ao criar entrada"
    });
    throw error;
  }
};

export const listFlow = async (filters, account) => {
  const rows = await db.listOrders(filters, account);
  return rows.map(shapeOrder);
};

export const getFlow = async (id, account) => {
  return shapeOrder(await db.getOrder(id, account));
};

export const getFlowStatus = async (id, account) => {
  return shapeOrder(await db.getOrder(id, account));
};

const resolveWebhookOrder = async (payload) => {
  const payment = readPayment(payload);
  const externalRef = payment.externalRef || payload.external_id || payload.external_ref || payload.order?.external_id || payload.payment?.external_id;
  if (externalRef) {
    const byRef = await db.getOrderByExternalRef(externalRef);
    if (byRef) return byRef;
  }
  if (payment.paymentId) {
    const byProvider = await db.getOrderByProviderId(payment.paymentId);
    if (byProvider) return byProvider;
  }
  return null;
};

export const handleProviderEvent = async ({ headers, rawBody, body }) => {
  if (!providerA.validateWebhook({ headers, rawBody })) {
    const error = new Error("Assinatura inválida");
    error.status = 401;
    throw error;
  }
  const eventType = headers["x-webhook-event"] || body.event || body.type || "event";
  const order = await resolveWebhookOrder(body);
  if (!order) return { ok: true };
  const eventHash = hashValue(`${headers["x-webhook-timestamp"] || ""}.${headers["x-webhook-signature"] || ""}.${rawBody}`);
  const event = await db.insertEvent({
    order_id: order.id,
    event_type: eventType,
    source: "providerA",
    payload: body,
    event_hash: eventHash
  });
  if (!event) return { ok: true, duplicate: true };
  const normalized = String(eventType || body.status || readPayment(body).status || "").toLowerCase();
  if (paidStatuses.has(normalized) && !finalStatuses.has(order.status)) {
    const next = await db.updateOrder(order.id, {
      status: "PAYMENT_CONFIRMED",
      input_status: "PAYMENT_CONFIRMED",
      raw_input: body,
      error_message: null
    });
    await insertNextJob(next.id, "NEXT_STEP", 2);
  }
  if (expiredStatuses.has(normalized) && !finalStatuses.has(order.status)) {
    await db.updateOrder(order.id, { status: "EXPIRED", input_status: "EXPIRED" });
  }
  if (refundedStatuses.has(normalized)) {
    await db.updateOrder(order.id, { status: "REFUNDED", input_status: "REFUNDED" });
  }
  return { ok: true };
};

const startIntermediate = async (order) => {
  const mode = await db.getSetting("intermediate_mode", { mode: "manual" });
  if (mode?.mode !== "automatic") {
    return db.updateOrder(order.id, {
      status: "WAITING_MANUAL_STEP",
      intermediate_status: "WAITING_MANUAL_STEP"
    });
  }
  const quote = await providerB.requestQuote({
    orderId: order.public_id,
    inputAsset: "DEPIX",
    outputAsset: "USDT",
    outputNetwork: "liquid",
    amount: order.input_amount_brl
  });
  const accepted = await providerB.acceptQuote(quote.id || quote.quoteId);
  const amount = accepted.receivedAmount || accepted.outputAmount || accepted.amount;
  const txid = accepted.txid || accepted.transactionId;
  return db.updateOrder(order.id, {
    status: amount && txid ? "INTERMEDIATE_CONVERSION_DONE" : "INTERMEDIATE_CONVERSION_STARTED",
    intermediate_status: amount && txid ? "DONE" : "STARTED",
    intermediate_received_amount: amount || null,
    intermediate_txid: txid || null,
    raw_intermediate: { quote, accepted },
    error_message: null
  });
};

export const createFinalShift = async (order, ip) => {
  if (order.settlement_provider_id && !failedStatuses.has(String(order.settlement_status || "").toLowerCase())) {
    await insertNextJob(order.id, "FINAL_MONITOR", 45);
    return order;
  }
  const amount = order.intermediate_received_amount || order.intermediate_expected_amount;
  if (!amount) {
    return db.updateOrder(order.id, {
      status: "WAITING_MANUAL_STEP",
      intermediate_status: "WAITING_MANUAL_STEP"
    });
  }
  const quotePayload = {
    depositCoin: "USDT",
    depositNetwork: "liquid",
    settleCoin: order.settlement_output_asset,
    settleNetwork: order.settlement_output_network,
    depositAmount: String(amount),
    settleAddress: order.settlement_output_address,
    settleMemo: order.raw_settlement?.outputMemo || undefined,
    refundAddress: order.refund_address || undefined
  };
  const sourceIp = order.operator_ip || ip;
  const quote = await providerC.createQuote(quotePayload, sourceIp);
  const quoteId = quote.id || quote.quoteId;
  const shiftPayload = {
    ...quotePayload,
    quoteId,
    settleAddress: order.settlement_output_address
  };
  const shift = quoteId ? await providerC.createFixedShift(shiftPayload, sourceIp) : await providerC.createVariableShift(quotePayload, sourceIp);
  const data = readShift(shift);
  const next = await db.updateOrder(order.id, {
    status: "WAITING_FINAL_DEPOSIT",
    settlement_provider_id: data.id,
    settlement_status: data.status || "created",
    settlement_deposit_address: data.depositAddress,
    settlement_deposit_amount: data.depositAmount,
    settlement_settle_amount: data.settleAmount,
    raw_settlement: { ...(order.raw_settlement?.outputMemo ? { outputMemo: order.raw_settlement.outputMemo } : {}), quote, shift },
    error_message: null
  });
  await db.insertEvent({
    order_id: order.id,
    event_type: "settlement.created",
    source: "providerC",
    payload: { id: data.id, status: data.status }
  });
  await insertNextJob(order.id, "FINAL_MONITOR", 45);
  return next;
};

export const monitorFinalShift = async (order, ip) => {
  if (!order.settlement_provider_id) return createFinalShift(order, ip);
  const result = await providerC.getShift(order.settlement_provider_id, order.operator_ip || ip);
  const data = readShift(result);
  const status = String(data.status || "").toLowerCase();
  if (settledStatuses.has(status)) {
    return db.updateOrder(order.id, {
      status: "COMPLETED",
      settlement_status: data.status || "settled",
      settlement_output_txid: data.settleHash || order.settlement_output_txid,
      settlement_settle_amount: data.settleAmount || order.settlement_settle_amount,
      raw_settlement: result,
      error_message: null
    });
  }
  if (failedStatuses.has(status)) {
    return db.updateOrder(order.id, {
      status: "FAILED",
      settlement_status: data.status || "failed",
      raw_settlement: result,
      error_message: "Falha na liquidação"
    });
  }
  const nextStatus = status.includes("settle") || status.includes("process") ? "FINAL_PROCESSING" : "WAITING_FINAL_DEPOSIT";
  const next = await db.updateOrder(order.id, {
    status: nextStatus,
    settlement_status: data.status || order.settlement_status,
    settlement_deposit_address: data.depositAddress || order.settlement_deposit_address,
    settlement_deposit_amount: data.depositAmount || order.settlement_deposit_amount,
    settlement_settle_amount: data.settleAmount || order.settlement_settle_amount,
    raw_settlement: result
  });
  await insertNextJob(order.id, "FINAL_MONITOR", 60);
  return next;
};

export const processNext = async (order, ip) => {
  if (finalStatuses.has(order.status)) return order;
  if (order.status === "PAYMENT_CONFIRMED") {
    const next = await db.updateOrder(order.id, {
      status: "WAITING_INTERMEDIATE_SETTLEMENT",
      intermediate_status: "WAITING_INTERMEDIATE_SETTLEMENT"
    });
    return startIntermediate(next);
  }
  if (["WAITING_INTERMEDIATE_SETTLEMENT", "WAITING_MANUAL_STEP"].includes(order.status)) {
    return startIntermediate(order);
  }
  if (["INTERMEDIATE_RECEIVED", "INTERMEDIATE_CONVERSION_DONE"].includes(order.status)) {
    return createFinalShift(order, ip);
  }
  if (["FINAL_SHIFT_CREATED", "WAITING_FINAL_DEPOSIT", "FINAL_PROCESSING"].includes(order.status)) {
    return monitorFinalShift(order, ip);
  }
  return order;
};

export const retryFlow = async (id, account, payload = {}) => {
  const order = await db.getOrder(id, account);
  const allowed = ["FAILED", "WAITING_INTERMEDIATE_SETTLEMENT", "WAITING_MANUAL_STEP", "FINAL_SHIFT_CREATED", "WAITING_FINAL_DEPOSIT", "FINAL_PROCESSING"].includes(order.status);
  if (!allowed) {
    const error = new Error("Status não permite nova tentativa");
    error.status = 409;
    throw error;
  }
  const jobType = ["FINAL_SHIFT_CREATED", "WAITING_FINAL_DEPOSIT", "FINAL_PROCESSING"].includes(order.status) ? "FINAL_MONITOR" : "NEXT_STEP";
  await db.insertEvent({
    order_id: order.id,
    event_type: "retry.requested",
    source: "account",
    payload: { by: account.email, note: payload.note || null }
  });
  await insertNextJob(order.id, jobType, 1);
  return shapeOrder(await db.updateOrder(order.id, { error_message: null }));
};

export const manualUpdate = async (id, account, payload) => {
  const order = await db.getOrder(id, account);
  const next = await db.updateOrder(order.id, {
    intermediate_received_amount: payload.intermediateReceivedAmount,
    intermediate_txid: payload.intermediateTxid,
    intermediate_note: payload.intermediateNote || null,
    intermediate_status: "RECEIVED",
    status: "INTERMEDIATE_RECEIVED",
    error_message: null
  });
  await db.insertEvent({
    order_id: order.id,
    event_type: "intermediate.updated",
    source: "account",
    payload: { by: account.email, txid: payload.intermediateTxid }
  });
  await insertNextJob(order.id, "NEXT_STEP", 1);
  return shapeOrder(next);
};

export const checkPendingPayment = async (order) => {
  if (!order.input_provider_id || finalStatuses.has(order.status)) return order;
  const result = await providerA.getPaymentStatus(order.input_provider_id);
  const payment = readPayment(result);
  const normalized = String(payment.status || result.status || "").toLowerCase();
  if (paidStatuses.has(normalized)) {
    const next = await db.updateOrder(order.id, {
      status: "PAYMENT_CONFIRMED",
      input_status: "PAYMENT_CONFIRMED",
      raw_input: result,
      error_message: null
    });
    await insertNextJob(next.id, "NEXT_STEP", 1);
    return next;
  }
  if (expiredStatuses.has(normalized)) {
    return db.updateOrder(order.id, {
      status: "EXPIRED",
      input_status: "EXPIRED",
      raw_input: result
    });
  }
  await insertNextJob(order.id, "PAYMENT_FALLBACK", 120);
  return db.updateOrder(order.id, {
    input_status: payment.status || order.input_status,
    raw_input: result
  });
};
