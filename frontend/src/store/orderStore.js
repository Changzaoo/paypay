import { create } from "zustand";
import { createOrder, getConfig, getOrder, getOrders, getOrderStatus, getSettings, manualOrder, ping, retryOrder, saveSettings } from "../lib/api";

export const useOrderStore = create((set, get) => ({
  items: [],
  current: null,
  config: null,
  settings: null,
  loading: false,
  error: "",
  filters: {
    status: "",
    asset: "",
    network: "",
    search: "",
    dateFrom: "",
    dateTo: ""
  },
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  clearFilters: () => set({ filters: { status: "", asset: "", network: "", search: "", dateFrom: "", dateTo: "" } }),
  load: async () => {
    set({ loading: true, error: "" });
    try {
      const items = await getOrders(get().filters);
      set({ items, loading: false });
      return items;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || "Falha ao carregar" });
      return [];
    }
  },
  create: async (payload) => {
    set({ loading: true, error: "" });
    try {
      const data = await createOrder(payload);
      set({ loading: false });
      await get().load();
      return data;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || "Falha ao criar" });
      throw error;
    }
  },
  fetch: async (id) => {
    set({ loading: true, error: "" });
    try {
      const current = await getOrder(id);
      set({ current, loading: false });
      return current;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || "Falha ao carregar" });
      return null;
    }
  },
  fetchStatus: async (id) => {
    try {
      const current = await getOrderStatus(id);
      set({ current });
      return current;
    } catch {
      return null;
    }
  },
  retry: async (id) => {
    const current = await retryOrder(id);
    set({ current });
    return current;
  },
  manual: async (id, payload) => {
    const current = await manualOrder(id, payload);
    set({ current });
    return current;
  },
  loadConfig: async () => {
    const config = await getConfig();
    set({ config });
    return config;
  },
  loadSettings: async () => {
    const settings = await getSettings();
    set({ settings });
    return settings;
  },
  saveSettings: async (payload) => {
    const settings = await saveSettings(payload);
    set({ settings });
    return settings;
  },
  ping: async () => {
    return ping();
  }
}));
