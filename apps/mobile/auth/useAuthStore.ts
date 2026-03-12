import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'google' | 'apple';

interface AuthStore {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  handleAuthCallbackUrl: (callbackUrl: string) => Promise<void>;
}

function pickFirstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

async function completeAuthWithCallbackUrl(callbackUrl: string): Promise<void> {
  const parsed = Linking.parse(callbackUrl);
  const queryParams = parsed.queryParams ?? {};

  const authError = pickFirstString(queryParams.error as string | string[] | undefined);
  const authErrorDescription = pickFirstString(
    queryParams.error_description as string | string[] | undefined,
  );

  if (authError) {
    throw new Error(authErrorDescription ?? authError);
  }

  const authCode = pickFirstString(queryParams.code as string | string[] | undefined);
  const accessToken = pickFirstString(queryParams.access_token as string | string[] | undefined);
  const refreshToken = pickFirstString(queryParams.refresh_token as string | string[] | undefined);

  if (authCode) {
    const { error } = await supabase.auth.exchangeCodeForSession(authCode);
    if (error) {
      throw error;
    }
    return;
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw error;
    }
  }
}

async function signInWithProvider(provider: OAuthProvider): Promise<void> {
  const redirectTo = makeRedirectUri({
    scheme: 'lifttracker',
    path: 'auth/callback',
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error('Supabase did not return an OAuth URL.');
  }

  const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (authResult.type === 'success' && authResult.url) {
    await completeAuthWithCallbackUrl(authResult.url);
    return;
  }

  if (authResult.type === 'cancel') {
    throw new Error('Authentication was cancelled.');
  }

  throw new Error('Authentication did not complete successfully.');
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, isLoading: false });
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({ session, isLoading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ error: null });

    try {
      await signInWithProvider('google');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ session, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  signInWithApple: async () => {
    set({ error: null });

    try {
      await signInWithProvider('apple');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ session, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ error: error.message });
      return;
    }

    set({ session: null });
  },

  handleAuthCallbackUrl: async (callbackUrl) => {
    try {
      await completeAuthWithCallbackUrl(callbackUrl);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({ session, isLoading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
