import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { formatWeight, kgToLbs, lbsToKg, roundToPlate } from '@lift-tracker/shared';
import type { WeightUnit } from '@lift-tracker/shared';

interface DualWeightInputProps {
  valueKg: number;
  onChange: (kg: number) => void;
  primaryUnit: WeightUnit;
}

function getSecondaryUnit(unit: WeightUnit): WeightUnit {
  return unit === 'kg' ? 'lbs' : 'kg';
}

export default function DualWeightInput({ valueKg, onChange, primaryUnit }: DualWeightInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const displayValue = formatWeight(valueKg, primaryUnit);
  const secondaryUnit = getSecondaryUnit(primaryUnit);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    inputRef.current?.focus();
  }, [isEditing]);

  function commitDraftValue(): void {
    const parsed = Number.parseFloat((draftValue ?? displayValue).trim());

    if (Number.isNaN(parsed)) {
      setIsEditing(false);
      setDraftValue(null);
      return;
    }

    const nextKg = primaryUnit === 'kg' ? parsed : lbsToKg(parsed);
    onChange(Math.max(0, nextKg));
    setIsEditing(false);
    setDraftValue(null);
  }

  function adjustWeight(direction: 1 | -1): void {
    if (primaryUnit === 'kg') {
      const nextKg = roundToPlate(Math.max(0, valueKg + 2.5 * direction));
      onChange(nextKg);
      return;
    }

    const nextLbs = Math.max(0, kgToLbs(valueKg) + 5 * direction);
    onChange(roundToPlate(lbsToKg(nextLbs)));
  }

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
            value={draftValue ?? displayValue}
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
            accessibilityLabel="Edit weight"
            onPress={() => {
              setDraftValue(displayValue);
              setIsEditing(true);
            }}
            className="h-12 items-center justify-center"
          >
            <Text className="text-2xl font-bold leading-tight text-white">
              {displayValue} {primaryUnit}
            </Text>
          </Pressable>
        )}

        {!isEditing && (
          <Text className="mt-1 text-center text-sm text-slate-400">
            {formatWeight(valueKg, secondaryUnit)} {secondaryUnit}
          </Text>
        )}
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
