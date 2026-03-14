import { Text, View } from 'react-native';
import { formatWeight } from '@lift-tracker/shared';
import type { WeightUnit } from '@lift-tracker/shared';

interface DualWeightDisplayProps {
  weightKg: number | null;
  primaryUnit: WeightUnit;
  className?: string;
}

function getSecondaryUnit(unit: WeightUnit): WeightUnit {
  return unit === 'kg' ? 'lbs' : 'kg';
}

export default function DualWeightDisplay({ weightKg, primaryUnit, className }: DualWeightDisplayProps) {
  const secondaryUnit = getSecondaryUnit(primaryUnit);

  return (
    <View className={`rounded-xl bg-slate-800 p-4 ${className ?? ''}`.trim()}>
      {weightKg === null ? (
        <Text className="text-3xl font-bold leading-tight text-slate-100">—</Text>
      ) : (
        <>
          <Text className="text-3xl font-bold leading-tight text-slate-100">
            {formatWeight(weightKg, primaryUnit)} {primaryUnit}
          </Text>
          <Text className="mt-1 text-sm text-slate-400">
            {formatWeight(weightKg, secondaryUnit)} {secondaryUnit}
          </Text>
        </>
      )}
    </View>
  );
}
