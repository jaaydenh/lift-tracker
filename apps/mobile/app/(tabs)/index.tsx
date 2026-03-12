import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-8">
      <Text className="text-2xl font-semibold text-slate-100">Hello from Lift Tracker</Text>
      <Text className="mt-3 text-center text-base text-slate-300">
        Mobile adapters, auth, sync, and stores are now wired for Expo.
      </Text>
    </View>
  );
}
