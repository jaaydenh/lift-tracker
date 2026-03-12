import { useEffect } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useURL } from 'expo-linking';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuthStore } from '../../auth/useAuthStore';

function buildFallbackCallbackUrl(params: Record<string, string | string[] | undefined>): string | null {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
      continue;
    }

    if (typeof value === 'string') {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  if (!queryString) {
    return null;
  }

  return `lifttracker://auth/callback?${queryString}`;
}

export default function AuthCallbackScreen() {
  const callbackUrl = useURL();
  const params = useLocalSearchParams();
  const fallbackParams = params as Record<string, string | string[] | undefined>;
  const session = useAuthStore((state) => state.session);
  const error = useAuthStore((state) => state.error);
  const handleAuthCallbackUrl = useAuthStore((state) => state.handleAuthCallbackUrl);

  useEffect(() => {
    const urlToHandle = callbackUrl ?? buildFallbackCallbackUrl(fallbackParams);

    if (urlToHandle) {
      void handleAuthCallbackUrl(urlToHandle);
    }
  }, [callbackUrl, fallbackParams, handleAuthCallbackUrl]);

  if (session) {
    return <Redirect href="/" />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-8">
      {error ? (
        <>
          <Text className="text-center text-base text-red-400">{error}</Text>
          <Text className="mt-3 text-center text-base text-slate-300">Please try signing in again.</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#f8fafc" />
          <Text className="mt-4 text-base text-slate-100">Completing sign in...</Text>
        </>
      )}
    </View>
  );
}
