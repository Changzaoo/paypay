const evmNetworks = new Set(["ethereum", "arbitrum", "base", "polygon", "bsc"]);
const btcNetworks = new Set(["bitcoin"]);
const outputMap = {
  ETH: new Set(["ethereum", "arbitrum", "base"]),
  BTC: new Set(["bitcoin"]),
  USDT: new Set(["ethereum", "arbitrum", "base", "polygon", "bsc"])
};

export const networks = ["bitcoin", "ethereum", "arbitrum", "base", "polygon", "bsc"];
export const assets = ["ETH", "BTC", "USDT"];

export const isEvmAddress = (value) => /^0x[a-fA-F0-9]{40}$/.test(String(value || "").trim());

export const isBtcAddress = (value) => {
  const input = String(value || "").trim();
  return /^(bc1)[a-zA-HJ-NP-Z0-9]{25,90}$/i.test(input) || /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(input);
};

export const isLiquidAddress = (value) => {
  const input = String(value || "").trim();
  return /^(lq1|ex1|ert1)[a-zA-HJ-NP-Z0-9]{20,120}$/i.test(input);
};

export const isAllowedRoute = (asset, network) => {
  return Boolean(outputMap[String(asset || "").toUpperCase()]?.has(String(network || "").toLowerCase()));
};

export const validateOutputAddress = (network, value) => {
  const next = String(network || "").toLowerCase();
  if (evmNetworks.has(next)) return isEvmAddress(value);
  if (btcNetworks.has(next)) return isBtcAddress(value);
  return false;
};

export const explorerUrl = (network, txid) => {
  if (!txid) return null;
  const maps = {
    bitcoin: `https://mempool.space/tx/${txid}`,
    ethereum: `https://etherscan.io/tx/${txid}`,
    arbitrum: `https://arbiscan.io/tx/${txid}`,
    base: `https://basescan.org/tx/${txid}`,
    polygon: `https://polygonscan.com/tx/${txid}`,
    bsc: `https://bscscan.com/tx/${txid}`
  };
  return maps[String(network || "").toLowerCase()] || null;
};
