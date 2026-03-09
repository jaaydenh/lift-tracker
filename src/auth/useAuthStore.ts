import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

interface AuthStore {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ session, isLoading: false });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session });
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) set({ error: error.message });
  },

  signInWithApple: async () => {
    set({ error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) set({ error: error.message });
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) set({ error: error.message });
    else set({ session: null });
  },
}));
