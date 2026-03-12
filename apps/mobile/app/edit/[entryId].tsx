import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function EditEntryScreen() {
  const { entryId } = useLocalSearchParams<{ entryId?: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-8">
      <Text className="text-2xl font-semibold text-slate-100">Edit Entry</Text>
      <Text className="mt-3 text-center text-base text-slate-300">
        Entry ID: {entryId ?? 'unknown'}
      </Text>
    </View>
  );
}
