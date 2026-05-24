const coin = () => String(process.env.FLOW_INTERMEDIATE_COIN || "BTC").trim().toUpperCase();
const network = () => String(process.env.FLOW_INTERMEDIATE_NETWORK || "liquid").trim().toLowerCase();
const label = () => process.env.FLOW_INTERMEDIATE_LABEL || "LBTC Liquid";

export const intermediateAsset = () => ({
  coin: coin(),
  network: network(),
  label: label()
});

export const settlementSource = () => intermediateAsset();

export const isLiquidBtc = (asset = intermediateAsset()) => {
  return String(asset.coin || "").toUpperCase() === "BTC" && String(asset.network || "").toLowerCase() === "liquid";
};
