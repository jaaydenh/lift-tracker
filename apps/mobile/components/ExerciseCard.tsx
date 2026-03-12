import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { formatWeight } from '@lift-tracker/shared';
import type { AgeBracket, Exercise, ExerciseEntry, ExerciseSet, WeightUnit } from '@lift-tracker/shared';
import DetrainingBar from './DetrainingBar';

interface ExerciseCardProps {
  exercise: Exercise;
  daysSince: number | null;
  lastEntry: ExerciseEntry | null;
  rollingBestOneRmKg: number | null;
  ageBracket: AgeBracket;
  primaryUnit: WeightUnit;
}

function formatDaysAgo(daysSince: number | null): string {
  if (daysSince === null) {
    return 'No recent sessions';
  }

  if (daysSince === 0) {
    return 'today';
  }

  if (daysSince === 1) {
    return '1d ago';
  }

  return `${daysSince}d ago`;
}

function getBestSet(entry: ExerciseEntry): ExerciseSet | null {
  const workingSets = entry.sets.filter((set) => !set.isWarmup);

  if (workingSets.length === 0) {
    return null;
  }

  return [...workingSets].sort((a, b) => {
    const aWeight = a.weightKg ?? -1;
    const bWeight = b.weightKg ?? -1;

    if (bWeight !== aWeight) {
      return bWeight - aWeight;
    }

    return b.reps - a.reps;
  })[0];
}

export default function ExerciseCard({
  exercise,
  daysSince,
  lastEntry,
  rollingBestOneRmKg,
  ageBracket,
  primaryUnit,
}: ExerciseCardProps) {
  const secondaryUnit: WeightUnit = primaryUnit === 'kg' ? 'lbs' : 'kg';

  if (!lastEntry) {
    return (
      <Pressable
        className="min-h-12 rounded-xl bg-slate-800 p-4"
        onPress={() => {
          router.push({ pathname: '/log/[exerciseId]', params: { exerciseId: exercise.id } });
        }}
      >
        <Text className="text-lg font-semibold text-white">{exercise.name}</Text>
        <Text className="mt-2 text-sm text-slate-400">No sessions yet</Text>
      </Pressable>
    );
  }

  const bestSet = getBestSet(lastEntry);
  const bestSetSummary = bestSet
    ? bestSet.weightKg === null
      ? `Bodyweight × ${bestSet.reps}`
      : `${formatWeight(bestSet.weightKg, primaryUnit)}${primaryUnit} × ${bestSet.reps}`
    : null;

  const dualUnitSummary =
    bestSet && bestSet.weightKg !== null
      ? `${formatWeight(bestSet.weightKg, secondaryUnit)}${secondaryUnit}`
      : null;

  return (
    <Pressable
      className="min-h-12 rounded-xl bg-slate-800 p-4"
      onPress={() => {
        router.push({ pathname: '/history/[exerciseId]', params: { exerciseId: exercise.id } });
      }}
    >
      <Text className="text-lg font-semibold text-white">{exercise.name}</Text>

      <Text className="mt-1 text-sm text-slate-300">
        {bestSetSummary ?? 'Session logged'} — {formatDaysAgo(daysSince)}
      </Text>

      {dualUnitSummary && <Text className="text-xs text-slate-400">{dualUnitSummary}</Text>}

      {rollingBestOneRmKg !== null && (
        <Text className="text-xs text-slate-400">
          Estimated 1RM: {formatWeight(rollingBestOneRmKg, primaryUnit)}
          {primaryUnit} ({formatWeight(rollingBestOneRmKg, secondaryUnit)}
          {secondaryUnit})
        </Text>
      )}

      {daysSince !== null && (
        <View className="mt-3">
          <DetrainingBar daysSince={daysSince} ageBracket={ageBracket} />
        </View>
      )}
    </Pressable>
  );
}
