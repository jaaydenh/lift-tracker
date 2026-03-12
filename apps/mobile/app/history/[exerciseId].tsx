import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function ExerciseHistoryScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-8">
      <Text className="text-2xl font-semibold text-slate-100">Exercise History</Text>
      <Text className="mt-3 text-center text-base text-slate-300">
        Exercise ID: {exerciseId ?? 'unknown'}
      </Text>
    </View>
  );
}
