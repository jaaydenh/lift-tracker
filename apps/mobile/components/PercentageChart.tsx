import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatWeight, percentageTable } from '@lift-tracker/shared';
import type { WeightUnit } from '@lift-tracker/shared';

interface PercentageChartProps {
  oneRM: number;
  primaryUnit: WeightUnit;
  sourceReps?: number | null;
}

export default function PercentageChart({ oneRM, primaryUnit, sourceReps }: PercentageChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rows = useMemo(() => percentageTable(oneRM), [oneRM]);
  const showAccuracyWarning = typeof sourceReps === 'number' && sourceReps > 10;

  return (
    <View className="rounded-xl bg-slate-800 px-3 py-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Toggle one rep max percentage chart"
        onPress={() => setIsExpanded((prev) => !prev)}
        className="min-h-12 flex-row items-center justify-between gap-3"
      >
        <Text className="flex-1 text-base font-semibold text-slate-100">
          1RM % Chart ({formatWeight(oneRM, primaryUnit)} {primaryUnit})
        </Text>
        <Text className="text-xs text-slate-400">{isExpanded ? 'Hide' : 'Tap to expand'}</Text>
      </Pressable>

      {isExpanded && (
        <View className="pb-2 pt-1">
          {showAccuracyWarning && (
            <Text className="mb-2 rounded-lg bg-yellow-400/10 px-3 py-2 text-xs text-yellow-400">
              ⚠️ Estimated from a {sourceReps}-rep set — accuracy decreases above 10 reps
            </Text>
          )}

          <View className="overflow-hidden rounded-lg border border-slate-700">
            <View className="flex-row bg-slate-900/60 px-3 py-2">
              <Text className="flex-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                %
              </Text>
              <Text className="w-20 text-right text-xs font-semibold uppercase tracking-wide text-slate-300">
                kg
              </Text>
              <Text className="w-20 text-right text-xs font-semibold uppercase tracking-wide text-slate-300">
                lbs
              </Text>
            </View>

            {rows.map((row) => (
              <View
                key={row.percent}
                className="flex-row border-t border-slate-700/60 px-3 py-2"
              >
                <Text className="flex-1 text-left text-sm text-slate-100">{row.percent}%</Text>
                <Text className="w-20 text-right text-sm text-slate-200">{formatWeight(row.kg, 'kg')}</Text>
                <Text className="w-20 text-right text-sm text-slate-200">{formatWeight(row.kg, 'lbs')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
