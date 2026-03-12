import { Redirect } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAuthStore } from '../auth/useAuthStore';

export default function SignInScreen() {
  const session = useAuthStore((state) => state.session);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const signInWithApple = useAuthStore((state) => state.signInWithApple);
  const error = useAuthStore((state) => state.error);

  if (session) {
    return <Redirect href="/" />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-8">
      <View className="w-full max-w-sm space-y-4">
        <Text className="text-center text-3xl font-semibold text-slate-100">Lift Tracker</Text>
        <Text className="text-center text-base text-slate-300">
          Track your lifts across all your devices.
        </Text>

        <Pressable
          className="rounded-xl bg-white px-4 py-4"
          onPress={() => {
            void signInWithGoogle();
          }}
        >
          <Text className="text-center text-lg font-medium text-slate-900">Sign in with Google</Text>
        </Pressable>

        <Pressable
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-4"
          onPress={() => {
            void signInWithApple();
          }}
        >
          <Text className="text-center text-lg font-medium text-slate-100">Sign in with Apple</Text>
        </Pressable>

        {error ? <Text className="text-center text-sm text-red-400">{error}</Text> : null}
      </View>
    </View>
  );
}
