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
  COMPLETED: 7,
  FAILED: 4,
  EXPIRED: 1,
  REFUNDED: 1,
  CANCELLED: 1
};

const stepText = [
  "Criado",
  "PIX",
  "Confirmado",
  "DePix",
  "LBTC Liquid",
  "SideShift",
  "Envio",
  "Final"
];

const networkText = {
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
  arbitrum: "Arbitrum",
  base: "Base",
  polygon: "Polygon",
  bsc: "BSC",
  optimism: "Optimism",
  avax: "Avalanche",
  solana: "Solana",
  tron: "Tron",
  liquid: "Liquid",
  litecoin: "Litecoin",
  dogecoin: "Dogecoin",
  bitcoincash: "Bitcoin Cash",
  monero: "Monero",
  zcash: "Zcash",
  dash: "Dash",
  xrp: "XRP",
  stellar: "Stellar",
  ton: "TON",
  aptos: "Aptos",
  cosmos: "Cosmos",
  polkadot: "Polkadot"
};

export const progressForStatus = (status) => {
  if (status === "COMPLETED") return 100;
  if (["FAILED", "EXPIRED", "REFUNDED", "CANCELLED"].includes(status)) return Math.max(12, Math.round(((ranks[status] || 0) / 7) * 100));
  const rank = ranks[status] ?? 0;
  return Math.round(((rank + 0.5) / 8) * 100);
};

export const stepForStatus = (status) => {
  if (status === "FAILED") return "Com erro";
  if (status === "EXPIRED") return "Expirado";
  if (status === "REFUNDED") return "Estornado";
  if (status === "CANCELLED") return "Cancelado";
  return stepText[Math.min(ranks[status] ?? 0, stepText.length - 1)] || "Criado";
};

export const finalRoute = (item = {}) => {
  const asset = item.outputAsset || item.settlement?.outputAsset || "Destino";
  const network = networkText[item.outputNetwork || item.settlement?.outputNetwork] || item.outputNetwork || item.settlement?.outputNetwork || "rede";
  return `${asset} ${network}`;
};

export const flowRoute = (item = {}) => `PIX BRL -> DePix -> LBTC Liquid -> ${finalRoute(item)}`;
