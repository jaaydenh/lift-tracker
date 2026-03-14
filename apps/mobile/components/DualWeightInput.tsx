import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { formatWeight, kgToLbs, lbsToKg, roundToPlate } from '@lift-tracker/shared';
import type { WeightUnit } from '@lift-tracker/shared';

interface DualWeightInputProps {
  valueKg: number | null;
  onChange: (kg: number | null) => void;
  primaryUnit: WeightUnit;
  isBodyweight: boolean;
}

function getSecondaryUnit(unit: WeightUnit): WeightUnit {
  return unit === 'kg' ? 'lbs' : 'kg';
}

export default function DualWeightInput({
  valueKg,
  onChange,
  primaryUnit,
  isBodyweight,
}: DualWeightInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const secondaryUnit = getSecondaryUnit(primaryUnit);

  const normalizedValueKg = valueKg ?? 0;
  const displayValue = formatWeight(normalizedValueKg, primaryUnit);
  const inputFallbackValue = isBodyweight && valueKg === null ? '' : displayValue;

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    inputRef.current?.focus();
  }, [isEditing]);

  function resetEditing(): void {
    setIsEditing(false);
    setDraftValue(null);
  }

  function commitDraftValue(): void {
    const rawValue = (draftValue ?? inputFallbackValue).trim();

    if (isBodyweight && rawValue === '') {
      onChange(null);
      resetEditing();
      return;
    }

    const parsed = Number.parseFloat(rawValue);

    if (Number.isNaN(parsed)) {
      resetEditing();
      return;
    }

    const nextKg = primaryUnit === 'kg' ? parsed : lbsToKg(parsed);

    if (isBodyweight) {
      onChange(nextKg > 0 ? nextKg : null);
      resetEditing();
      return;
    }

    onChange(Math.max(0, nextKg));
    resetEditing();
  }

  function adjustWeight(direction: 1 | -1): void {
    if (primaryUnit === 'kg') {
      const currentKg = valueKg ?? 0;
      const nextKg = roundToPlate(Math.max(0, currentKg + 2.5 * direction));

      if (isBodyweight && nextKg <= 0) {
        onChange(null);
        return;
      }

      onChange(nextKg);
      return;
    }

    const currentLbs = kgToLbs(valueKg ?? 0);
    const nextLbs = Math.max(0, currentLbs + 5 * direction);

    if (isBodyweight && nextLbs <= 0) {
      onChange(null);
      return;
    }

    if (isBodyweight) {
      onChange(lbsToKg(nextLbs));
      return;
    }

    onChange(roundToPlate(lbsToKg(nextLbs)));
  }

  const primaryDisplay = isBodyweight && valueKg === null ? 'BW' : `${displayValue} ${primaryUnit}`;
  const secondaryDisplay =
    isBodyweight && valueKg === null
      ? 'No added weight'
      : isBodyweight
        ? `+ ${formatWeight(normalizedValueKg, secondaryUnit)} ${secondaryUnit}`
        : `${formatWeight(normalizedValueKg, secondaryUnit)} ${secondaryUnit}`;

  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease weight"
        className="h-12 w-12 items-center justify-center rounded-lg bg-slate-600"
        onPress={() => adjustWeight(-1)}
      >
        <Text className="text-2xl font-semibold leading-none text-white">−</Text>
      </Pressable>

      <View className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2">
        {isEditing ? (
          <TextInput
            ref={inputRef}
            value={draftValue ?? inputFallbackValue}
            onChangeText={setDraftValue}
            onBlur={commitDraftValue}
            onSubmitEditing={commitDraftValue}
            returnKeyType="done"
            keyboardType="decimal-pad"
            selectTextOnFocus
            className="h-12 text-center text-2xl font-bold leading-tight text-white"
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isBodyweight ? 'Edit added weight' : 'Edit weight'}
            onPress={() => {
              setDraftValue(inputFallbackValue);
              setIsEditing(true);
            }}
            className="h-12 items-center justify-center"
          >
            <Text className="text-2xl font-bold leading-tight text-white">{primaryDisplay}</Text>
          </Pressable>
        )}

        {!isEditing && <Text className="mt-1 text-center text-sm text-slate-400">{secondaryDisplay}</Text>}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase weight"
        className="h-12 w-12 items-center justify-center rounded-lg bg-slate-600"
        onPress={() => adjustWeight(1)}
      >
        <Text className="text-2xl font-semibold leading-none text-white">+</Text>
      </Pressable>
    </View>
  );
}
