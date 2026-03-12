import { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuthStore } from '../auth/useAuthStore';

type OAuthProvider = 'google' | 'apple';

function GoogleMark() {
  return (
    <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-100">
      <Text className="text-sm font-black text-slate-900">
        <Text style={{ color: '#4285F4' }}>G</Text>
      </Text>
    </View>
  );
}

function AppleMark() {
  return (
    <View className="h-6 w-6 items-center justify-center">
      <Text className="text-xl font-semibold text-white"></Text>
    </View>
  );
}

export default function SignInScreen() {
  const session = useAuthStore((state) => state.session);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const signInWithApple = useAuthStore((state) => state.signInWithApple);
  const error = useAuthStore((state) => state.error);
  const [activeProvider, setActiveProvider] = useState<OAuthProvider | null>(null);

  if (session) {
    return <Redirect href="/" />;
  }

  const isSubmitting = activeProvider !== null;

  async function handleSignIn(provider: OAuthProvider) {
    if (isSubmitting) {
      return;
    }

    setActiveProvider(provider);

    try {
      if (provider === 'google') {
        await signInWithGoogle();
        return;
      }

      await signInWithApple();
    } finally {
      setActiveProvider(null);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-900 px-8">
      <View className="w-full max-w-sm gap-8">
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold tracking-tight text-white">LiftTracker</Text>
          <Text className="text-center text-base text-slate-300">
            Track your lifts across all your devices.
          </Text>
        </View>

        <View className="gap-3">
          <Pressable
            className={`flex-row items-center justify-center gap-3 rounded-xl bg-white px-4 py-4 ${
              isSubmitting ? 'opacity-70' : ''
            }`}
            onPress={() => {
              void handleSignIn('google');
            }}
            disabled={isSubmitting}
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            {activeProvider === 'google' ? (
              <ActivityIndicator size="small" color="#0f172a" />
            ) : (
              <GoogleMark />
            )}
            <Text className="text-lg font-medium text-slate-900">Sign in with Google</Text>
          </Pressable>

          <Pressable
            className={`flex-row items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-4 py-4 ${
              isSubmitting ? 'opacity-70' : ''
            }`}
            onPress={() => {
              void handleSignIn('apple');
            }}
            disabled={isSubmitting}
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            {activeProvider === 'apple' ? (
              <ActivityIndicator size="small" color="#f8fafc" />
            ) : (
              <AppleMark />
            )}
            <Text className="text-lg font-medium text-slate-100">Sign in with Apple</Text>
          </Pressable>
        </View>

        {error ? <Text className="text-center text-sm text-red-400">{error}</Text> : null}
      </View>
    </View>
  );
}
