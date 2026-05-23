import { z } from "zod";
import { isAllowedRoute, isAssetCode, isLiquidAddress, isNetworkCode, validateOutputAddress } from "./address.js";

const cleanText = (max = 240) => z.preprocess((value) => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next ? next.slice(0, max) : undefined;
}, z.string().max(max).optional());

export const flowCreateSchema = z.object({
  amountBrl: z.coerce.number().min(10).max(500000),
  customerName: cleanText(120),
  customerEmail: cleanText(180).refine((value) => !value || z.string().email().safeParse(value).success, "email invalido"),
  customerPhone: cleanText(40),
  customerDocument: cleanText(32),
  outputAsset: z.string().transform((value) => value.toUpperCase()).refine((value) => isAssetCode(value), "ativo invalido"),
  outputNetwork: z.string().transform((value) => value.toLowerCase()).refine((value) => isNetworkCode(value), "rede invalida"),
  outputAddress: z.string().trim().min(20).max(180),
  outputMemo: cleanText(120),
  refundAddress: cleanText(180)
}).superRefine((value, context) => {
  if (!isAllowedRoute(value.outputAsset, value.outputNetwork)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["outputNetwork"], message: "rota invalida" });
  }
  if (!validateOutputAddress(value.outputNetwork, value.outputAddress)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["outputAddress"], message: "endereco invalido" });
  }
  if (value.refundAddress && !isLiquidAddress(value.refundAddress)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["refundAddress"], message: "endereco invalido" });
  }
});

export const flowQuerySchema = z.object({
  status: cleanText(60),
  asset: cleanText(12),
  network: cleanText(24),
  search: cleanText(180),
  dateFrom: cleanText(32),
  dateTo: cleanText(32)
});

export const manualSchema = z.object({
  intermediateReceivedAmount: z.coerce.number().positive(),
  intermediateTxid: z.string().trim().min(6).max(180),
  intermediateNote: cleanText(500)
});

export const retrySchema = z.object({
  note: cleanText(500)
});

export const parseBody = (schema, body) => {
  const result = schema.safeParse(body);
  if (!result.success) {
    const error = new Error("Dados invalidos");
    error.status = 400;
    error.details = result.error.flatten();
    throw error;
  }
  return result.data;
};
