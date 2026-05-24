import { api } from "./api";

type Query = Record<string, string | number | undefined>;
type Payload = Record<string, unknown>;

const items = async (path: string, params?: Query) => {
  const { data } = await api.get(path, { params });
  return Array.isArray(data.items) ? data.items : [];
};

export const treasuryApi = {
  async summary() {
    const { data } = await api.get("/api/treasury/summary");
    return data;
  },
  chains() {
    return items("/api/treasury/chains");
  },
  tokens() {
    return items("/api/treasury/tokens");
  },
  wallets(params?: Query) {
    return items("/api/treasury/wallets", params);
  },
  groups() {
    return items("/api/treasury/wallet-groups");
  },
  transfers(params?: Query) {
    return items("/api/treasury/transfers", params);
  },
  transactions(params?: Query) {
    return items("/api/treasury/transactions", params);
  },
  async bridges(params?: Query) {
    const { data } = await api.get("/api/treasury/bridges", { params });
    return data;
  },
  audit(params?: Query) {
    return items("/api/treasury/audit-logs", params);
  },
  rules() {
    return items("/api/treasury/risk-rules");
  },
  reconciliation(params?: Query) {
    return items("/api/treasury/reconciliation", params);
  },
  createChain(payload: Payload) {
    return api.post("/api/treasury/chains", payload).then((res) => res.data);
  },
  createToken(payload: Payload) {
    return api.post("/api/treasury/tokens", payload).then((res) => res.data);
  },
  createGroup(payload: Payload) {
    return api.post("/api/treasury/wallet-groups", payload).then((res) => res.data);
  },
  createWallet(payload: Payload) {
    return api.post("/api/treasury/wallets", payload).then((res) => res.data);
  },
  generateWallet(payload: Payload) {
    return api.post("/api/treasury/wallets/hd", payload).then((res) => res.data);
  },
  updateWallet(id: string, payload: Payload) {
    return api.patch(`/api/treasury/wallets/${id}`, payload).then((res) => res.data);
  },
  createTransfer(payload: Payload) {
    return api.post("/api/treasury/transfers", payload).then((res) => res.data);
  },
  decideTransfer(id: string, payload: Payload) {
    return api.post(`/api/treasury/transfers/${id}/decision`, payload).then((res) => res.data);
  },
  retryTransaction(id: string) {
    return api.post(`/api/treasury/transactions/${id}/retry`).then((res) => res.data);
  },
  createBridge(payload: Payload) {
    return api.post("/api/treasury/bridges", payload).then((res) => res.data);
  },
  decideBridge(id: string, payload: Payload) {
    return api.post(`/api/treasury/bridges/${id}/decision`, payload).then((res) => res.data);
  },
  createRule(payload: Payload) {
    return api.post("/api/treasury/risk-rules", payload).then((res) => res.data);
  },
  async exportCsv(params?: Query) {
    const { data } = await api.get("/api/treasury/export.csv", { params, responseType: "blob" });
    return data;
  }
};
