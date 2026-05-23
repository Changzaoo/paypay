import { explorerUrl, validateOutputAddress } from "../utils/address.js";

export const validateRouteAddress = ({ network, address }) => {
  return validateOutputAddress(network, address);
};

export const getExplorer = ({ network, txid }) => {
  return explorerUrl(network, txid);
};
