import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { ExerciseSet, WeightUnit } from '@lift-tracker/shared';
import DualWeightInput from './DualWeightInput';

interface SetRowProps {
  set: ExerciseSet;
  index: number;
  onUpdate: (partial: Partial<ExerciseSet>) => void;
  onRemove: () => void;
  primaryUnit: WeightUnit;
  isBodyweight: boolean;
}

export default function SetRow({
  set: exerciseSet,
  index,
  onUpdate,
  onRemove,
  primaryUnit,
  isBodyweight,
}: SetRowProps) {
  const [isEditingReps, setIsEditingReps] = useState(false);
  const [draftReps, setDraftReps] = useState<string | null>(null);
  const repsInputRef = useRef<TextInput>(null);
  const repsDisplayValue = String(exerciseSet.reps);

  useEffect(() => {
    if (!isEditingReps) {
      return;
    }

    repsInputRef.current?.focus();
  }, [isEditingReps]);

  function updateReps(nextReps: number): void {
    onUpdate({ reps: Math.max(1, Math.round(nextReps)) });
  }

  function commitDraftReps(): void {
    const parsed = Number.parseFloat((draftReps ?? repsDisplayValue).trim());

    if (!Number.isNaN(parsed)) {
      updateReps(parsed);
    }

    setIsEditingReps(false);
    setDraftReps(null);
  }

  return (
    <View className="gap-3 rounded-lg bg-slate-700/50 p-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-sm font-semibold text-slate-200">Set {index + 1}</Text>

        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={() => onUpdate({ isWarmup: !exerciseSet.isWarmup })}
            className={`h-12 min-w-12 items-center justify-center rounded-lg px-3 ${
              exerciseSet.isWarmup
                ? 'border border-yellow-400/50 bg-yellow-500/20'
                : 'border border-slate-600 bg-slate-800'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${exerciseSet.isWarmup ? 'text-yellow-300' : 'text-slate-300'}`}
            >
              {exerciseSet.isWarmup ? 'W' : 'Warmup'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove set ${index + 1}`}
            onPress={onRemove}
            className="h-12 min-w-12 items-center justify-center rounded-lg border border-rose-400/50 bg-rose-500/20 px-3"
          >
            <Text className="text-2xl leading-none text-rose-200">×</Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="min-w-0 flex-1">
          <Text className="mb-1 text-xs uppercase tracking-wide text-slate-400">
            {isBodyweight ? 'Added weight' : 'Weight'}
          </Text>
          <DualWeightInput
            valueKg={exerciseSet.weightKg}
            onChange={(weightKg) => onUpdate({ weightKg })}
            primaryUnit={primaryUnit}
            isBodyweight={isBodyweight}
          />
        </View>

        <View className="min-w-0 flex-1">
          <Text className="mb-1 text-xs uppercase tracking-wide text-slate-400">Reps</Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease reps"
              className="h-12 w-12 items-center justify-center rounded-lg bg-slate-800"
              onPress={() => updateReps(exerciseSet.reps - 1)}
            >
              <Text className="text-2xl font-semibold leading-none text-white">−</Text>
            </Pressable>

            <View className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2">
              {isEditingReps ? (
                <TextInput
                  ref={repsInputRef}
                  value={draftReps ?? repsDisplayValue}
                  onChangeText={setDraftReps}
                  onBlur={commitDraftReps}
                  onSubmitEditing={commitDraftReps}
                  returnKeyType="done"
                  keyboardType="number-pad"
                  selectTextOnFocus
                  className="h-12 text-center text-2xl font-bold leading-tight text-white"
                />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit reps"
                  onPress={() => {
                    setDraftReps(repsDisplayValue);
                    setIsEditingReps(true);
                  }}
                  className="h-12 items-center justify-center"
                >
                  <Text className="text-2xl font-bold leading-tight text-white">{repsDisplayValue}</Text>
                </Pressable>
              )}
              <Text className="mt-1 text-center text-sm text-slate-400">reps</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase reps"
              className="h-12 w-12 items-center justify-center rounded-lg bg-slate-800"
              onPress={() => updateReps(exerciseSet.reps + 1)}
            >
              <Text className="text-2xl font-semibold leading-none text-white">+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
