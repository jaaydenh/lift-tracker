import { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../auth/useAuthStore';

type OAuthProvider = 'google' | 'apple';

function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessibilityLabel="Google icon">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

function AppleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessibilityLabel="Apple icon">
      <Path
        fill="#ffffff"
        d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.12 4.54-3.74 4.25z"
      />
    </Svg>
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
