import '../global.css';
import { Stack } from 'expo-router';
import Providers from '../providers/Providers';

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="log/[exerciseId]" options={{ headerShown: false }} />
        <Stack.Screen name="edit/[entryId]" options={{ headerShown: false }} />
        <Stack.Screen name="pick" options={{ headerShown: true, title: 'Pick Exercise' }} />
        <Stack.Screen name="history/[exerciseId]" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}
