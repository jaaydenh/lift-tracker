import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

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

interface AuthModules {
  makeRedirectUri: (options: { scheme: string; path: string }) => string;
  parseLinkingUrl: (
    callbackUrl: string,
  ) => {
    queryParams?: Record<string, string | string[] | undefined> | null;
  };
  maybeCompleteAuthSession: () => void;
  openAuthSessionAsync: (
    authUrl: string,
    redirectTo: string,
  ) => Promise<{
    type: string;
    url?: string;
  }>;
}

let authModulesPromise: Promise<AuthModules | null> | null = null;
let authSessionCompletionHandled = false;

async function getAuthModules(): Promise<AuthModules | null> {
  authModulesPromise ??= (async () => {
    try {
      const [{ makeRedirectUri }, linkingModule, webBrowserModule] = await Promise.all([
        import('expo-auth-session'),
        import('expo-linking'),
        import('expo-web-browser'),
      ]);

      if (!authSessionCompletionHandled) {
        webBrowserModule.maybeCompleteAuthSession();
        authSessionCompletionHandled = true;
      }

      return {
        makeRedirectUri,
        parseLinkingUrl: linkingModule.parse,
        maybeCompleteAuthSession: webBrowserModule.maybeCompleteAuthSession,
        openAuthSessionAsync: webBrowserModule.openAuthSessionAsync,
      } satisfies AuthModules;
    } catch (error) {
      console.warn(
        '[auth] Native auth modules are unavailable in this runtime. OAuth sign-in is disabled.',
        error,
      );
      return null;
    }
  })();

  return authModulesPromise;
}

function pickFirstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseQueryParamsFromCallbackUrl(callbackUrl: string): Record<string, string | string[] | undefined> {
  try {
    const parsedUrl = new URL(callbackUrl);
    const params: Record<string, string> = {};

    for (const [key, value] of parsedUrl.searchParams.entries()) {
      params[key] = value;
    }

    return params;
  } catch {
    return {};
  }
}

async function completeAuthWithCallbackUrl(callbackUrl: string): Promise<void> {
  const authModules = await getAuthModules();
  const parsed = authModules?.parseLinkingUrl(callbackUrl);
  const queryParams = parsed?.queryParams ?? parseQueryParamsFromCallbackUrl(callbackUrl);

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
  const authModules = await getAuthModules();

  if (!authModules) {
    throw new Error('OAuth sign-in is unavailable: missing native auth modules in the current runtime.');
  }

  const redirectTo = authModules.makeRedirectUri({
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

  const authResult = await authModules.openAuthSessionAsync(data.url, redirectTo);

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
