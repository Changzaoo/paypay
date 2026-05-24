import { z } from "zod";

const clean = (max = 240) => z.preprocess((value) => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next ? next.slice(0, max) : undefined;
}, z.string().max(max).optional());

const tags = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(",");
  return [];
}, z.array(z.string().max(40)).max(20));

export const chainSchema = z.object({
  chainKey: z.string().trim().min(2).max(40).transform((value) => value.toLowerCase()),
  chainId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(80),
  rpcUrl: z.string().url(),
  explorerUrl: z.string().url().optional(),
  nativeSymbol: z.string().trim().min(2).max(12).transform((value) => value.toUpperCase()),
  nativeDecimals: z.coerce.number().int().min(0).max(30).default(18),
  status: z.enum(["active", "disabled"]).default("active")
});

export const tokenSchema = z.object({
  chainId: z.coerce.number().int().positive(),
  symbol: z.string().trim().min(2).max(16).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(80),
  contractAddress: clean(80),
  decimals: z.coerce.number().int().min(0).max(30).default(18),
  isNative: z.boolean().default(false),
  status: z.enum(["active", "disabled"]).default("active")
});

export const walletSchema = z.object({
  name: z.string().trim().min(2).max(120),
  chainId: z.coerce.number().int().positive(),
  address: z.string().trim().min(20).max(80),
  purpose: z.enum(["main", "operational", "treasury", "settlement", "audit"]),
  status: z.enum(["pending", "approved", "active", "disabled"]).default("pending"),
  groupId: clean(80),
  dailyLimit: z.coerce.number().nonnegative().default(0),
  tags,
  keyRef: clean(80)
});

export const hdWalletSchema = walletSchema.omit({ address: true }).extend({
  path: clean(120)
});

export const groupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: clean(300)
});

export const transferSchema = z.object({
  sourceWalletId: z.string().uuid(),
  destinationWalletId: z.string().uuid(),
  token: z.string().trim().min(2).max(16).transform((value) => value.toUpperCase()),
  amount: z.coerce.number().positive(),
  reason: z.string().trim().min(8).max(500)
});

export const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: clean(500)
});

export const bridgeSchema = z.object({
  sourceWalletId: z.string().uuid(),
  destinationWalletId: z.string().uuid(),
  sourceToken: z.string().trim().min(2).max(16).transform((value) => value.toUpperCase()),
  destinationToken: z.string().trim().min(2).max(16).transform((value) => value.toUpperCase()),
  amount: z.coerce.number().positive(),
  provider: z.enum(["sideshift", "lifi", "socket"]).default("sideshift"),
  feeEstimate: z.coerce.number().nonnegative().optional(),
  slippageBps: z.coerce.number().int().min(0).max(1000).default(50),
  reason: z.string().trim().min(8).max(500)
});

export const riskRuleSchema = z.object({
  ruleType: z.enum(["blocked_address", "velocity_limit", "manual_review"]),
  chainId: z.coerce.number().int().positive().optional(),
  value: z.string().trim().min(2).max(180),
  reason: clean(500),
  status: z.enum(["active", "disabled"]).default("active")
});

export const querySchema = z.object({
  status: clean(60),
  chainId: clean(20),
  walletId: clean(80),
  token: clean(24),
  provider: clean(40),
  dateFrom: clean(40),
  dateTo: clean(40),
  action: clean(80),
  entityType: clean(80)
});
