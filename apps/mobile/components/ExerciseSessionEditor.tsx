import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { best1RMFromSets, best1RMFromSetsDetailed, formatWeight } from '@lift-tracker/shared';
import type { ExerciseEntry, ExerciseSet } from '@lift-tracker/shared';
import PercentageChart from './PercentageChart';
import SetRow from './SetRow';
import DualWeightDisplay from './DualWeightDisplay';
import { useExerciseStore } from '../store/useExerciseStore';
import { useSettingsStore } from '../store/useSettingsStore';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function sortByPerformedAtDesc(a: { performedAt: string }, b: { performedAt: string }): number {
  return new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime();
}

function daysAgoFromIsoDate(isoDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / DAY_IN_MS));
}

function formatDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function todayDateInputValue(): string {
  return formatDateInputValue(new Date());
}

function isoDateToDateInputValue(isoDate: string): string {
  return formatDateInputValue(new Date(isoDate));
}

function startOfTodayIso(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

function normalizeDateInputToIso(dateInput: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput.trim());

  if (!match) {
    return startOfTodayIso();
  }

  const year = Number.parseInt(match[1], 10);
  const monthIndex = Number.parseInt(match[2], 10) - 1;
  const day = Number.parseInt(match[3], 10);
  const parsed = new Date(year, monthIndex, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== monthIndex ||
    parsed.getDate() !== day
  ) {
    return startOfTodayIso();
  }

  return parsed.toISOString();
}

function createSet(weightKg: number | null, reps: number, isWarmup = false): ExerciseSet {
  return {
    id: uuidv4(),
    weightKg,
    reps: Math.max(1, Math.round(reps)),
    isWarmup,
    completedAt: new Date().toISOString(),
  };
}

function cloneSet(set: ExerciseSet): ExerciseSet {
  return {
    ...set,
  };
}

function normalizeSet(set: ExerciseSet, isBodyweight: boolean): ExerciseSet {
  return {
    ...set,
    reps: Math.max(1, Math.round(set.reps)),
    weightKg: isBodyweight ? null : Math.max(0, set.weightKg ?? 0),
  };
}

interface ExerciseSessionEditorProps {
  mode: 'create' | 'edit';
  exerciseId?: string;
  entryId?: string;
}

export default function ExerciseSessionEditor({ mode, exerciseId, entryId }: ExerciseSessionEditorProps) {
  const isEditMode = mode === 'edit';
  const router = useRouter();

  const exercises = useExerciseStore((state) => state.exercises);
  const entries = useExerciseStore((state) => state.entries);
  const addEntry = useExerciseStore((state) => state.addEntry);
  const updateEntry = useExerciseStore((state) => state.updateEntry);

  const { primaryUnit, barbellWeightKg } = useSettingsStore((state) => state.settings);

  const entryToEdit = useMemo(() => {
    if (!isEditMode || !entryId) {
      return null;
    }

    return entries.find((entry) => entry.id === entryId) ?? null;
  }, [entries, entryId, isEditMode]);

  const resolvedExerciseId = isEditMode ? entryToEdit?.exerciseId : exerciseId;

  const exercise = useMemo(
    () => exercises.find((item) => item.id === resolvedExerciseId),
    [exercises, resolvedExerciseId],
  );

  const isBodyweight = exercise?.category === 'bodyweight';

  const latestEntry = useMemo(() => {
    if (!resolvedExerciseId) {
      return null;
    }

    return (
      entries
        .filter((entry) => entry.exerciseId === resolvedExerciseId)
        .sort(sortByPerformedAtDesc)[0] ?? null
    );
  }, [entries, resolvedExerciseId]);

  const previousWorkingSet = useMemo(
    () => latestEntry?.sets.find((set) => !set.isWarmup) ?? latestEntry?.sets[0] ?? null,
    [latestEntry],
  );

  const defaultSetWeight = isBodyweight ? null : previousWorkingSet?.weightKg ?? barbellWeightKg;
  const defaultSetReps = previousWorkingSet?.reps ?? 5;

  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [performedDate, setPerformedDate] = useState(todayDateInputValue());
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveConfirmed, setIsSaveConfirmed] = useState(false);

  useEffect(() => {
    if (!resolvedExerciseId || !exercise) {
      setSets([]);
      return;
    }

    if (isEditMode) {
      if (!entryToEdit) {
        setSets([]);
        return;
      }

      setSets(entryToEdit.sets.map(cloneSet));
      setPerformedDate(isoDateToDateInputValue(entryToEdit.performedAt));
      return;
    }

    setSets([createSet(defaultSetWeight, defaultSetReps)]);
    setPerformedDate(todayDateInputValue());
  }, [defaultSetReps, defaultSetWeight, entryToEdit, exercise, isEditMode, resolvedExerciseId]);

  const current1RMData = useMemo(() => best1RMFromSetsDetailed(sets), [sets]);
  const currentOneRM = current1RMData?.value ?? null;

  const latestDaysAgo = latestEntry ? daysAgoFromIsoDate(latestEntry.performedAt) : null;

  const lastSessionSummary = useMemo(() => {
    if (!latestEntry) {
      return 'First time logging this exercise!';
    }

    if (!previousWorkingSet) {
      return `Last session logged ${latestDaysAgo ?? 0}d ago`;
    }

    if (previousWorkingSet.weightKg === null) {
      return `Last: BW × ${previousWorkingSet.reps} reps — ${latestDaysAgo ?? 0}d ago`;
    }

    return `Last: ${formatWeight(previousWorkingSet.weightKg, primaryUnit)} ${primaryUnit} × ${previousWorkingSet.reps} reps — ${latestDaysAgo ?? 0}d ago`;
  }, [latestDaysAgo, latestEntry, previousWorkingSet, primaryUnit]);

  function handleBack(): void {
    if (isEditMode && resolvedExerciseId) {
      router.replace({ pathname: '/history/[exerciseId]', params: { exerciseId: resolvedExerciseId } });
      return;
    }

    router.replace('/');
  }

  function handleAddSet(): void {
    setSets((current) => {
      const previousSet = current[current.length - 1];
      const nextWeightKg = isBodyweight ? null : previousSet?.weightKg ?? defaultSetWeight;
      const nextReps = previousSet?.reps ?? defaultSetReps;
      const nextIsWarmup = previousSet?.isWarmup ?? false;

      return [...current, createSet(nextWeightKg, nextReps, nextIsWarmup)];
    });
  }

  async function handleSave(): Promise<void> {
    if (!resolvedExerciseId || !exercise || sets.length === 0 || isSaving) {
      return;
    }

    if (isEditMode && !entryToEdit) {
      return;
    }

    setIsSaving(true);
    setIsSaveConfirmed(false);

    try {
      const entryIdToSave = isEditMode ? entryToEdit?.id : uuidv4();

      if (!entryIdToSave) {
        return;
      }

      const normalizedSets = sets.map((set) => normalizeSet(set, isBodyweight));

      const entry: ExerciseEntry = {
        id: entryIdToSave,
        exerciseId: resolvedExerciseId,
        sets: normalizedSets,
        performedAt: normalizeDateInputToIso(performedDate),
        estimated1RM_kg: best1RMFromSets(normalizedSets),
      };

      if (isEditMode) {
        await updateEntry(entry);
      } else {
        await addEntry(entry);
      }

      setIsSaveConfirmed(true);
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });

      if (isEditMode) {
        router.replace({ pathname: '/history/[exerciseId]', params: { exerciseId: resolvedExerciseId } });
      } else {
        router.replace('/');
      }
    } finally {
      setIsSaving(false);
      setIsSaveConfirmed(false);
    }
  }

  if (isEditMode && !entryToEdit) {
    return (
      <View className="flex-1 bg-slate-950 px-4 py-6">
        <Pressable
          accessibilityRole="button"
          className="mb-4 h-12 self-start rounded-lg bg-slate-700 px-4 py-3"
          onPress={() => router.back()}
        >
          <Text className="font-semibold text-white">← Back</Text>
        </Pressable>
        <Text className="rounded-lg bg-slate-800 p-4 text-slate-300">Entry not found.</Text>
      </View>
    );
  }

  if (!resolvedExerciseId || !exercise) {
    return (
      <View className="flex-1 bg-slate-950 px-4 py-6">
        <Pressable
          accessibilityRole="button"
          className="mb-4 h-12 self-start rounded-lg bg-slate-700 px-4 py-3"
          onPress={() => router.replace('/')}
        >
          <Text className="font-semibold text-white">← Back</Text>
        </Pressable>
        <Text className="rounded-lg bg-slate-800 p-4 text-slate-300">Exercise not found.</Text>
      </View>
    );
  }

  const saveButtonLabel = isSaveConfirmed
    ? isEditMode
      ? '✓ Updated'
      : '✓ Saved'
    : isSaving
      ? isEditMode
        ? 'Updating...'
        : 'Saving...'
      : isEditMode
        ? 'Update Exercise'
        : 'Save Exercise';

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-4">
          <View className="rounded-xl bg-slate-800 p-3">
            <View className="flex-row items-center justify-between gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={handleBack}
                className="h-12 min-w-12 items-center justify-center rounded-lg bg-slate-700 px-3"
              >
                <Text className="text-xl text-white">←</Text>
              </Pressable>

              <View className="flex-1">
                <Text className="text-center text-xl font-bold text-white">{exercise.name}</Text>
                {isEditMode && (
                  <Text className="mt-1 text-center text-xs font-semibold uppercase tracking-wide text-indigo-300">
                    Editing Session
                  </Text>
                )}
              </View>

              {!isEditMode ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open exercise history"
                  onPress={() =>
                    router.push({ pathname: '/history/[exerciseId]', params: { exerciseId: resolvedExerciseId } })
                  }
                  className="h-12 items-center justify-center rounded-lg bg-slate-700 px-3"
                >
                  <Text className="text-sm font-semibold text-white">History</Text>
                </Pressable>
              ) : (
                <View className="h-12 min-w-12" />
              )}
            </View>
          </View>

          <View className="rounded-xl bg-slate-800 p-4">
            <Text className="text-sm font-semibold uppercase tracking-wide text-slate-400">Date</Text>
            <TextInput
              value={performedDate}
              onChangeText={setPerformedDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              className="mt-2 h-12 rounded-lg bg-slate-700 px-3 text-base text-white"
            />
          </View>

          <View className="rounded-xl bg-slate-800 p-4">
            <Text className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Estimated 1RM
            </Text>
            {currentOneRM === null ? (
              <Text className="mt-2 text-base text-slate-300">No 1RM data yet</Text>
            ) : (
              <>
                <DualWeightDisplay
                  weightKg={currentOneRM}
                  primaryUnit={primaryUnit}
                  className="mt-2 bg-slate-900/70"
                />
                {current1RMData && current1RMData.sourceReps > 10 && (
                  <Text className="mt-2 text-xs text-yellow-400">
                    ⚠️ Based on {current1RMData.sourceReps}-rep set — less accurate above 10 reps
                  </Text>
                )}
              </>
            )}
          </View>

          <View className="rounded-xl bg-slate-800 p-4">
            <Text className="text-sm font-semibold uppercase tracking-wide text-slate-400">Last session</Text>
            <Text className="mt-2 text-base text-slate-100">{lastSessionSummary}</Text>
          </View>

          <View className="gap-3">
            {sets.map((set, index) => (
              <SetRow
                key={set.id}
                set={set}
                index={index}
                onUpdate={(partial) => {
                  setSets((current) =>
                    current.map((existingSet, currentIndex) => {
                      if (currentIndex !== index) {
                        return existingSet;
                      }

                      return normalizeSet({ ...existingSet, ...partial }, isBodyweight);
                    }),
                  );
                }}
                onRemove={() => {
                  setSets((current) => current.filter((_, currentIndex) => currentIndex !== index));
                }}
                primaryUnit={primaryUnit}
                isBodyweight={isBodyweight}
              />
            ))}

            <Pressable
              accessibilityRole="button"
              onPress={handleAddSet}
              className="h-12 items-center justify-center rounded-lg border border-dashed border-slate-500 bg-slate-800"
            >
              <Text className="text-base font-semibold text-slate-100">+ Add Set</Text>
            </Pressable>
          </View>

          {currentOneRM !== null && (
            <PercentageChart
              oneRM={currentOneRM}
              primaryUnit={primaryUnit}
              sourceReps={current1RMData?.sourceReps}
            />
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void handleSave();
            }}
            disabled={sets.length === 0 || isSaving}
            className={`h-12 items-center justify-center rounded-xl px-4 ${
              sets.length === 0 ? 'bg-slate-600' : isSaveConfirmed ? 'bg-green-500' : 'bg-green-600'
            }`}
          >
            <Text className="text-lg font-bold text-white">{saveButtonLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
