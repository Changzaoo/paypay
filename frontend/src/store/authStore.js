import { create } from "zustand";
import { checkSession } from "../lib/api";
import { supabase } from "../lib/supabase";

let subscribed = false;

export const useAuthStore = create((set, get) => ({
  session: null,
  account: null,
  loading: true,
  syncing: false,
  initialized: false,
  error: "",
  init: async () => {
    if (get().initialized) return;
    set({ initialized: true, loading: true, error: "" });
    try {
      const { data } = await supabase.auth.getSession();
      set({ session: data.session, loading: false });
      if (data.session) get().sync();
    } catch {
      set({ session: null, account: null, loading: false, error: "Sessao indisponivel" });
    }
    if (!subscribed) {
      subscribed = true;
      supabase.auth.onAuthStateChange((event, session) => {
        set({ session, loading: false });
        if (session) get().sync();
        if (!session) set({ account: null, syncing: false, error: "" });
      });
    }
  },
  sync: async () => {
    set({ syncing: true, error: "" });
    try {
      const data = await checkSession();
      set({ account: data.account, syncing: false, error: "" });
      return data.account;
    } catch (error) {
      const message = error.code === "ECONNABORTED" ? "Tempo de conexao excedido" : error.response?.data?.error || "Sessao invalida";
      set({ account: null, syncing: false, error: message });
      return null;
    }
  },
  signIn: async ({ email, password }) => {
    set({ loading: true, error: "" });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false, error: "Acesso nao autorizado" });
      return null;
    }
    set({ session: data.session, loading: false });
    await get().sync();
    return data.session;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, account: null, loading: false, syncing: false, error: "" });
  }
}));
