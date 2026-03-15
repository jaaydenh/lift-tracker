import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { best1RMFromSetsDetailed, formatWeight } from '@lift-tracker/shared';
import type { ExerciseSet, WeightUnit } from '@lift-tracker/shared';
import PercentageChart from '../../components/PercentageChart';
import { use1RM } from '../../hooks/use1RM';
import { getOptionalSvgModule } from '../../lib/optionalSvg';
import { useExerciseStore } from '../../store/useExerciseStore';
import { useSettingsStore } from '../../store/useSettingsStore';

const CHART_MAX_POINTS = 20;
const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 100;
const X_PADDING = 8;
const Y_PADDING = 8;

interface TrendPoint {
  date: string;
  oneRM: number;
}

function formatSessionDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatAxisDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatWeightWithUnit(valueKg: number, unit: WeightUnit): string {
  return `${formatWeight(valueKg, unit)} ${unit}`;
}

function formatDualWeight(valueKg: number, primaryUnit: WeightUnit): string {
  const secondaryUnit: WeightUnit = primaryUnit === 'kg' ? 'lbs' : 'kg';

  return `${formatWeightWithUnit(valueKg, primaryUnit)} (${formatWeightWithUnit(valueKg, secondaryUnit)})`;
}

function formatSetLine(set: ExerciseSet, primaryUnit: WeightUnit, isBodyweight: boolean): string {
  if (isBodyweight) {
    const addedWeightKg = set.weightKg !== null && set.weightKg > 0 ? set.weightKg : null;

    if (addedWeightKg === null) {
      return `BW × ${set.reps}${set.isWarmup ? ' (warm-up)' : ''}`;
    }

    return `BW + ${formatWeight(addedWeightKg, primaryUnit)} ${primaryUnit} × ${set.reps}${set.isWarmup ? ' (warm-up)' : ''}`;
  }

  if (set.weightKg === null) {
    return `Bodyweight × ${set.reps}${set.isWarmup ? ' (warm-up)' : ''}`;
  }

  return `${formatDualWeight(set.weightKg, primaryUnit)} × ${set.reps}${set.isWarmup ? ' (warm-up)' : ''}`;
}

function sortEntriesByPerformedAtDesc(a: { performedAt: string }, b: { performedAt: string }): number {
  return new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime();
}

interface SummaryMetricCardProps {
  label: string;
  valueKg: number | null;
  primaryUnit: WeightUnit;
  className?: string;
}

function SummaryMetricCard({ label, valueKg, primaryUnit, className }: SummaryMetricCardProps) {
  const secondaryUnit: WeightUnit = primaryUnit === 'kg' ? 'lbs' : 'kg';

  return (
    <View className={`rounded-lg bg-slate-700/60 p-3 ${className ?? ''}`.trim()}>
      <Text className="text-xs uppercase tracking-wide text-slate-300">{label}</Text>
      {valueKg === null ? (
        <Text className="mt-1 text-lg font-semibold text-white">—</Text>
      ) : (
        <>
          <Text className="mt-1 text-lg font-semibold text-white">
            {formatWeight(valueKg, primaryUnit)} {primaryUnit}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-300">
            {formatWeight(valueKg, secondaryUnit)} {secondaryUnit}
          </Text>
        </>
      )}
    </View>
  );
}

interface OneRMTrendChartProps {
  points: TrendPoint[];
  unit: WeightUnit;
}

function OneRMTrendChart({ points, unit }: OneRMTrendChartProps) {
  if (points.length === 0) {
    return (
      <View className="rounded-xl bg-slate-800 p-4">
        <Text className="text-lg font-semibold text-white">1RM Trend</Text>
        <Text className="mt-4 text-slate-300">No trend data yet</Text>
      </View>
    );
  }

  const svgModule = getOptionalSvgModule();

  if (!svgModule) {
    return (
      <View className="rounded-xl bg-slate-800 p-4">
        <Text className="text-lg font-semibold text-white">1RM Trend</Text>
        <Text className="mt-4 text-slate-300">Chart unavailable in this runtime.</Text>
      </View>
    );
  }

  const Svg = svgModule.default;
  const { Circle, Polyline } = svgModule;

  const values = points.map((point) => point.oneRM);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const chartHeight = VIEWBOX_HEIGHT - Y_PADDING * 2;
  const chartWidth = VIEWBOX_WIDTH - X_PADDING * 2;

  const chartPoints = points.map((point, index) => {
    const x =
      points.length === 1
        ? VIEWBOX_WIDTH / 2
        : X_PADDING + (index / (points.length - 1)) * chartWidth;

    const y =
      maxValue === minValue
        ? VIEWBOX_HEIGHT / 2
        : Y_PADDING + ((maxValue - point.oneRM) / (maxValue - minValue)) * chartHeight;

    return { x, y };
  });

  const polylinePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const firstDate = points[0]?.date;
  const lastDate = points[points.length - 1]?.date;

  return (
    <View className="rounded-xl bg-slate-800 p-4">
      <Text className="text-lg font-semibold text-white">1RM Trend</Text>

      <View className="mt-4 flex-row items-stretch gap-3">
        <View className="justify-between">
          <Text className="text-xs text-slate-300">{formatWeightWithUnit(maxValue, unit)}</Text>
          <Text className="text-xs text-slate-300">{formatWeightWithUnit(minValue, unit)}</Text>
        </View>

        <View className="flex-1">
          <Svg width="100%" height={192} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
            {points.length > 1 && (
              <Polyline
                points={polylinePoints}
                fill="none"
                stroke="rgb(129 140 248)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {chartPoints.map((point, index) => (
              <Circle
                key={`${points[index]?.date}-${points[index]?.oneRM}`}
                cx={point.x}
                cy={point.y}
                r={2}
                fill="rgb(224 231 255)"
                stroke="rgb(67 56 202)"
                strokeWidth={0.5}
              />
            ))}
          </Svg>
        </View>
      </View>

      <View className="mt-2 flex-row justify-between">
        <Text className="text-xs text-slate-300">{firstDate ? formatAxisDate(firstDate) : ''}</Text>
        <Text className="text-xs text-slate-300">{lastDate ? formatAxisDate(lastDate) : ''}</Text>
      </View>
    </View>
  );
}

export default function ExerciseHistoryScreen() {
  const router = useRouter();
  const { exerciseId: exerciseIdParam } = useLocalSearchParams<{ exerciseId?: string }>();
  const safeExerciseId = typeof exerciseIdParam === 'string' ? exerciseIdParam : '';

  const primaryUnit = useSettingsStore((state) => state.settings.primaryUnit);
  const exercises = useExerciseStore((state) => state.exercises);
  const allEntries = useExerciseStore((state) => state.entries);
  const deleteEntry = useExerciseStore((state) => state.deleteEntry);

  const exercise = useMemo(
    () => exercises.find((item) => item.id === safeExerciseId),
    [exercises, safeExerciseId],
  );

  const isBodyweight = exercise?.category === 'bodyweight';

  const entries = useMemo(
    () =>
      allEntries
        .filter((entry) => entry.exerciseId === safeExerciseId)
        .sort(sortEntriesByPerformedAtDesc),
    [allEntries, safeExerciseId],
  );

  const { current1RM, currentSourceReps, rollingBest1RM, best1RM, history } = use1RM(safeExerciseId);
  const chartPoints = useMemo(() => history.slice(-CHART_MAX_POINTS), [history]);

  function handleDeleteEntry(entryId: string): void {
    Alert.alert('Delete this entry?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteEntry(entryId);
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      >
        <View className="gap-4">
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="h-12 w-12 items-center justify-center rounded-xl bg-slate-800"
              onPress={() => router.replace('/')}
            >
              <Text className="text-xl text-white">←</Text>
            </Pressable>
            <Text className="flex-1 text-2xl font-semibold text-white">
              {exercise?.name ?? 'Exercise History'}
            </Text>
          </View>

          {!exercise && <Text className="rounded-xl bg-slate-800 p-6 text-center text-slate-300">Exercise not found.</Text>}

          {exercise && entries.length === 0 && (
            <Text className="rounded-xl bg-slate-800 p-10 text-center text-slate-300">
              No sessions logged yet
            </Text>
          )}

          {exercise && entries.length > 0 && (
            <>
              <View className="rounded-xl bg-slate-800 p-4">
                <Text className="text-lg font-semibold text-white">1RM Summary</Text>
                <View className="mt-3 gap-3">
                  <View className="flex-row gap-3">
                    <SummaryMetricCard label="Current" valueKg={current1RM} primaryUnit={primaryUnit} className="flex-1" />
                    <SummaryMetricCard
                      label="Rolling Best (6w)"
                      valueKg={rollingBest1RM}
                      primaryUnit={primaryUnit}
                      className="flex-1"
                    />
                  </View>
                  <SummaryMetricCard
                    label="Best (All-time)"
                    valueKg={best1RM}
                    primaryUnit={primaryUnit}
                  />
                </View>
                {currentSourceReps !== null && currentSourceReps > 10 && (
                  <Text className="mt-3 text-xs text-yellow-400">
                    ⚠️ Current estimate is from a {currentSourceReps}-rep set
                  </Text>
                )}
              </View>

              {rollingBest1RM !== null && (
                <View className="gap-2">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Rolling Best (6w) 1RM % Chart
                  </Text>
                  <PercentageChart oneRM={rollingBest1RM} primaryUnit={primaryUnit} />
                </View>
              )}

              <OneRMTrendChart points={chartPoints} unit={primaryUnit} />

              <View className="gap-3">
                <Text className="text-lg font-semibold text-white">Past Sessions</Text>

                {entries.map((entry) => {
                  const session1RMData = best1RMFromSetsDetailed(entry.sets);
                  const sessionOneRM = session1RMData?.value ?? null;
                  const sessionSourceReps = session1RMData?.sourceReps;

                  return (
                    <View key={entry.id} className="rounded-xl bg-slate-800 p-4">
                      <View className="flex-row items-start justify-between gap-3">
                        <Text className="flex-1 text-base font-semibold text-white">
                          {formatSessionDate(entry.performedAt)}
                        </Text>

                        <View className="flex-row gap-2">
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Edit session from ${formatSessionDate(entry.performedAt)}`}
                            onPress={() =>
                              router.push({ pathname: '/edit/[entryId]', params: { entryId: entry.id } })
                            }
                            className="h-8 min-w-8 items-center justify-center rounded-lg bg-slate-700 px-2"
                          >
                            <Text className="text-xs font-semibold text-slate-100">Edit</Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Delete session from ${formatSessionDate(entry.performedAt)}`}
                            onPress={() => handleDeleteEntry(entry.id)}
                            className="h-8 min-w-8 items-center justify-center rounded-lg bg-rose-500/20 px-2"
                          >
                            <Text className="text-xs font-semibold text-rose-100">Delete</Text>
                          </Pressable>
                        </View>
                      </View>

                      <View className="mt-3 gap-2">
                        {entry.sets.map((set) => (
                          <Text key={set.id} className="rounded-lg bg-slate-700/40 px-3 py-2 text-sm text-slate-100">
                            {formatSetLine(set, primaryUnit, Boolean(isBodyweight))}
                          </Text>
                        ))}
                      </View>

                      {sessionOneRM !== null && (
                        <>
                          <Text className="mt-3 text-sm font-medium text-indigo-200">
                            Estimated 1RM: {formatDualWeight(sessionOneRM, primaryUnit)}
                          </Text>
                          {sessionSourceReps !== undefined && sessionSourceReps > 10 && (
                            <Text className="mt-1 text-xs text-yellow-400">
                              ⚠️ Estimated from {sessionSourceReps}-rep set
                            </Text>
                          )}
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
