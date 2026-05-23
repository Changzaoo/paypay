import { create } from "zustand";
import { checkSession } from "../lib/api";
import { supabase } from "../lib/supabase";

export const useAuthStore = create((set, get) => ({
  session: null,
  account: null,
  loading: true,
  error: "",
  init: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, loading: false });
    if (data.session) await get().sync();
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, loading: false });
      if (session) await get().sync();
      if (!session) set({ account: null });
    });
  },
  sync: async () => {
    try {
      const data = await checkSession();
      set({ account: data.account, error: "" });
      return data.account;
    } catch (error) {
      set({ account: null, error: error.response?.data?.error || "Sessão inválida" });
      return null;
    }
  },
  signIn: async ({ email, password }) => {
    set({ loading: true, error: "" });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false, error: "Acesso não autorizado" });
      return null;
    }
    set({ session: data.session, loading: false });
    await get().sync();
    return data.session;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, account: null });
  }
}));
