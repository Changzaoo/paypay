const evmNetworks = new Set(["ethereum", "arbitrum", "base", "polygon", "bsc", "optimism", "avax"]);
const btcNetworks = new Set(["bitcoin"]);
const assetPattern = /^[A-Z0-9]{2,16}$/;
const networkPattern = /^[a-z0-9-]{2,32}$/;

export const networks = ["bitcoin", "ethereum", "arbitrum", "base", "polygon", "bsc", "optimism", "avax", "solana", "tron", "liquid", "litecoin", "dogecoin", "bitcoincash", "monero", "zcash", "dash", "xrp", "stellar", "ton", "aptos", "cosmos", "polkadot"];
export const assets = ["ETH", "BTC", "USDT", "USDC", "SOL", "XMR", "XRP", "LTC", "BCH", "DOGE", "DASH", "ZEC", "BNB", "TRX", "MATIC", "ADA", "DOT", "ATOM", "AVAX"];

export const networkLabels = {
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

export const fallbackSettlementOptions = [
  { coin: "ETH", name: "Ethereum", networks: [{ id: "ethereum", label: "Ethereum" }, { id: "arbitrum", label: "Arbitrum" }, { id: "base", label: "Base" }, { id: "optimism", label: "Optimism" }] },
  { coin: "BTC", name: "Bitcoin", networks: [{ id: "bitcoin", label: "Bitcoin" }] },
  { coin: "USDT", name: "Tether", networks: [{ id: "ethereum", label: "Ethereum" }, { id: "arbitrum", label: "Arbitrum" }, { id: "base", label: "Base" }, { id: "polygon", label: "Polygon" }, { id: "bsc", label: "BSC" }, { id: "tron", label: "Tron" }, { id: "solana", label: "Solana" }] },
  { coin: "USDC", name: "USD Coin", networks: [{ id: "ethereum", label: "Ethereum" }, { id: "arbitrum", label: "Arbitrum" }, { id: "base", label: "Base" }, { id: "polygon", label: "Polygon" }, { id: "bsc", label: "BSC" }, { id: "solana", label: "Solana" }] },
  { coin: "SOL", name: "Solana", networks: [{ id: "solana", label: "Solana" }] },
  { coin: "XMR", name: "Monero", networks: [{ id: "monero", label: "Monero" }] },
  { coin: "LTC", name: "Litecoin", networks: [{ id: "litecoin", label: "Litecoin" }] },
  { coin: "BCH", name: "Bitcoin Cash", networks: [{ id: "bitcoincash", label: "Bitcoin Cash" }] },
  { coin: "DOGE", name: "Dogecoin", networks: [{ id: "dogecoin", label: "Dogecoin" }] },
  { coin: "DASH", name: "Dash", networks: [{ id: "dash", label: "Dash" }] },
  { coin: "ZEC", name: "Zcash", networks: [{ id: "zcash", label: "Zcash" }] },
  { coin: "BNB", name: "BNB", networks: [{ id: "bsc", label: "BSC" }] },
  { coin: "TRX", name: "Tron", networks: [{ id: "tron", label: "Tron" }] },
  { coin: "MATIC", name: "Polygon", networks: [{ id: "polygon", label: "Polygon" }] },
  { coin: "AVAX", name: "Avalanche", networks: [{ id: "avax", label: "Avalanche" }] }
];

export const isEvmAddress = (value) => /^0x[a-fA-F0-9]{40}$/.test(String(value || "").trim());

export const isBtcAddress = (value) => {
  const input = String(value || "").trim();
  return /^(bc1)[a-zA-HJ-NP-Z0-9]{25,90}$/i.test(input) || /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(input);
};

export const isLiquidAddress = (value) => {
  const input = String(value || "").trim();
  return /^(lq1|ex1|ert1)[a-zA-HJ-NP-Z0-9]{20,120}$/i.test(input);
};

export const isAssetCode = (value) => assetPattern.test(String(value || "").trim().toUpperCase());

export const isNetworkCode = (value) => networkPattern.test(String(value || "").trim().toLowerCase());

export const isAllowedRoute = (asset, network) => {
  const coin = String(asset || "").trim().toUpperCase();
  const route = String(network || "").trim().toLowerCase();
  return isAssetCode(coin) && isNetworkCode(route) && !(coin === "USDT" && route === "liquid");
};

export const validateOutputAddress = (network, value) => {
  const next = String(network || "").toLowerCase();
  const input = String(value || "").trim();
  if (evmNetworks.has(next)) return isEvmAddress(value);
  if (btcNetworks.has(next)) return isBtcAddress(value);
  return input.length >= 20 && input.length <= 180 && !/\s/.test(input);
};

export const explorerUrl = (network, txid) => {
  if (!txid) return null;
  const maps = {
    bitcoin: `https://mempool.space/tx/${txid}`,
    ethereum: `https://etherscan.io/tx/${txid}`,
    arbitrum: `https://arbiscan.io/tx/${txid}`,
    base: `https://basescan.org/tx/${txid}`,
    polygon: `https://polygonscan.com/tx/${txid}`,
    bsc: `https://bscscan.com/tx/${txid}`,
    optimism: `https://optimistic.etherscan.io/tx/${txid}`,
    avax: `https://snowtrace.io/tx/${txid}`,
    solana: `https://solscan.io/tx/${txid}`,
    tron: `https://tronscan.org/#/transaction/${txid}`,
    litecoin: `https://litecoinspace.org/tx/${txid}`,
    dogecoin: `https://dogechain.info/tx/${txid}`,
    bitcoincash: `https://blockchair.com/bitcoin-cash/transaction/${txid}`
  };
  return maps[String(network || "").toLowerCase()] || null;
};
