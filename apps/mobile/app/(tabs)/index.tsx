import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { DETRAINING_THRESHOLDS } from '@lift-tracker/shared';
import type { Exercise, ExerciseEntry } from '@lift-tracker/shared';
import ExerciseCard from '../../components/ExerciseCard';
import { useExerciseStore } from '../../store/useExerciseStore';
import { useSettingsStore } from '../../store/useSettingsStore';

const APP_NAME = 'LiftTracker';
const DAY_IN_MS = 1000 * 60 * 60 * 24;
const ROLLING_WINDOW_DAYS = 42;

function getDaysSinceDate(isoDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / DAY_IN_MS));
}

interface LoggedExercise {
  exercise: Exercise;
  daysSince: number;
  lastEntry: ExerciseEntry;
  rollingBestOneRmKg: number | null;
}

export default function HomeScreen() {
  const exercises = useExerciseStore((state) => state.exercises);
  const entries = useExerciseStore((state) => state.entries);
  const { ageBracket, primaryUnit } = useSettingsStore((state) => state.settings);

  const [rollingWindowStartMs, setRollingWindowStartMs] = useState<number | null>(null);

  useEffect(() => {
    function updateRollingWindowStart(): void {
      setRollingWindowStartMs(Date.now() - ROLLING_WINDOW_DAYS * DAY_IN_MS);
    }

    updateRollingWindowStart();
    const intervalId = setInterval(updateRollingWindowStart, DAY_IN_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const loggedExercises = useMemo(() => {
    const latestByExercise = new Map<string, ExerciseEntry>();
    const rollingBestByExercise = new Map<string, number>();

    for (const entry of entries) {
      const performedAtMs = new Date(entry.performedAt).getTime();

      const existing = latestByExercise.get(entry.exerciseId);
      if (!existing || performedAtMs > new Date(existing.performedAt).getTime()) {
        latestByExercise.set(entry.exerciseId, entry);
      }

      if (
        rollingWindowStartMs !== null &&
        performedAtMs >= rollingWindowStartMs &&
        entry.estimated1RM_kg !== null
      ) {
        const previousBest = rollingBestByExercise.get(entry.exerciseId);
        if (previousBest === undefined || entry.estimated1RM_kg > previousBest) {
          rollingBestByExercise.set(entry.exerciseId, entry.estimated1RM_kg);
        }
      }
    }

    return exercises
      .map((exercise) => {
        const lastEntry = latestByExercise.get(exercise.id);
        if (!lastEntry) {
          return null;
        }

        const daysSince = getDaysSinceDate(lastEntry.performedAt);
        const rollingBestOneRmKg = rollingBestByExercise.get(exercise.id) ?? null;
        return { exercise, daysSince, lastEntry, rollingBestOneRmKg };
      })
      .filter((value): value is LoggedExercise => value !== null)
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [entries, exercises, rollingWindowStartMs]);

  const freshThreshold = DETRAINING_THRESHOLDS[ageBracket].fresh;
  const trainSoon = loggedExercises.filter((item) => item.daysSince > freshThreshold);
  const recentlyTrained = loggedExercises.filter((item) => item.daysSince <= freshThreshold);

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 96 }}
      >
        <View className="gap-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-white">{APP_NAME}</Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                accessibilityLabel="Open help"
                accessibilityRole="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800"
                onPress={() => {
                  router.push('/help');
                }}
              >
                <Text className="text-xl text-slate-100">?</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Open settings"
                accessibilityRole="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800"
                onPress={() => {
                  router.push('/settings');
                }}
              >
                <Text className="text-xl text-slate-100">⚙</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            className="min-h-12 w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-4"
            onPress={() => {
              router.push('/pick');
            }}
          >
            <Text className="text-lg font-semibold text-white">Log Exercise</Text>
          </Pressable>

          {entries.length === 0 ? (
            <View className="mt-12 items-center">
              <Text className="max-w-xs text-center text-lg font-medium text-slate-300">
                Log your first exercise to get started
              </Text>
              <Text className="mt-2 text-3xl text-indigo-400" aria-hidden>
                ↑
              </Text>
            </View>
          ) : (
            <View className="gap-6">
              <View className="gap-3">
                <Text className="text-sm font-semibold uppercase tracking-wide text-slate-300">Train Soon</Text>
                {trainSoon.length === 0 ? (
                  <Text className="rounded-xl bg-slate-800 p-4 text-sm text-slate-400">
                    Nothing urgent right now.
                  </Text>
                ) : (
                  <View className="gap-3">
                    {trainSoon.map((item) => (
                      <ExerciseCard
                        key={item.exercise.id}
                        exercise={item.exercise}
                        daysSince={item.daysSince}
                        lastEntry={item.lastEntry}
                        rollingBestOneRmKg={item.rollingBestOneRmKg}
                        ageBracket={ageBracket}
                        primaryUnit={primaryUnit}
                      />
                    ))}
                  </View>
                )}
              </View>

              <View className="gap-3">
                <Text className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  Recently Trained
                </Text>
                {recentlyTrained.length === 0 ? (
                  <Text className="rounded-xl bg-slate-800 p-4 text-sm text-slate-400">
                    No recent exercises yet.
                  </Text>
                ) : (
                  <View className="gap-3">
                    {recentlyTrained.map((item) => (
                      <ExerciseCard
                        key={item.exercise.id}
                        exercise={item.exercise}
                        daysSince={item.daysSince}
                        lastEntry={item.lastEntry}
                        rollingBestOneRmKg={item.rollingBestOneRmKg}
                        ageBracket={ageBracket}
                        primaryUnit={primaryUnit}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
