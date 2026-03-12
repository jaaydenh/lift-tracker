import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { DETRAINING_THRESHOLDS } from '@lift-tracker/shared';

const PHASE_DESCRIPTIONS = [
  {
    title: 'Fresh',
    colorClassName: 'text-emerald-300',
    description: 'You recently trained this lift and can expect stable performance.',
  },
  {
    title: 'Maintain',
    colorClassName: 'text-yellow-300',
    description: 'Still in range, but this movement should return to your plan soon.',
  },
  {
    title: 'Declining',
    colorClassName: 'text-orange-300',
    description: 'Strength may begin to slip if this lift keeps being skipped.',
  },
  {
    title: 'Decaying',
    colorClassName: 'text-rose-300',
    description: 'Highest retraining priority to prevent ongoing detraining.',
  },
] as const;

export default function HelpScreen() {
  const router = useRouter();

  const detrainingRows = useMemo(() => {
    const young = DETRAINING_THRESHOLDS.young;
    const middle = DETRAINING_THRESHOLDS.middle;
    const older = DETRAINING_THRESHOLDS.older;

    return [
      {
        phase: 'Fresh',
        phaseClassName: 'text-emerald-300',
        under40: `0-${young.fresh}d`,
        age40To59: `0-${middle.fresh}d`,
        age60Plus: `0-${older.fresh}d`,
      },
      {
        phase: 'Maintain',
        phaseClassName: 'text-yellow-300',
        under40: `${young.fresh + 1}-${young.maintain}d`,
        age40To59: `${middle.fresh + 1}-${middle.maintain}d`,
        age60Plus: `${older.fresh + 1}-${older.maintain}d`,
      },
      {
        phase: 'Declining',
        phaseClassName: 'text-orange-300',
        under40: `${young.maintain + 1}-${young.declining}d`,
        age40To59: `${middle.maintain + 1}-${middle.declining}d`,
        age60Plus: `${older.maintain + 1}-${older.declining}d`,
      },
      {
        phase: 'Decaying',
        phaseClassName: 'text-rose-300',
        under40: `>${young.declining}d`,
        age40To59: `>${middle.declining}d`,
        age60Plus: `>${older.declining}d`,
      },
    ];
  }, []);

  return (
    <ScrollView className="flex-1 bg-slate-950" contentContainerClassName="gap-6 px-5 pb-12 pt-8">
      <View className="flex-row items-center gap-3">
        <Pressable
          className="h-12 w-12 items-center justify-center rounded-full bg-slate-800"
          onPress={() => {
            router.replace('/');
          }}
        >
          <Text className="text-xl text-white">←</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-white">How it works</Text>
      </View>

      <View className="gap-3 rounded-2xl bg-slate-800 p-4">
        <Text className="text-lg font-semibold text-white">How the detraining model works</Text>
        <Text className="text-slate-300">
          LiftTracker tracks days since each exercise was last trained and places that movement into a
          phase so you can prioritize what needs attention next.
        </Text>

        <View className="gap-3">
          {PHASE_DESCRIPTIONS.map((phase) => (
            <View key={phase.title} className="gap-1 rounded-xl border border-slate-700 bg-slate-900/60 p-3">
              <Text className={`text-base font-semibold ${phase.colorClassName}`}>{phase.title}</Text>
              <Text className="text-sm text-slate-200">{phase.description}</Text>
            </View>
          ))}
        </View>

        <Text className="text-slate-300">
          Use these phases as training guidance to keep neglected lifts from sliding while your program
          shifts week to week.
        </Text>
      </View>

      <View className="gap-3 rounded-2xl bg-slate-800 p-4">
        <Text className="text-lg font-semibold text-white">Strength Decay Timer</Text>
        <Text className="text-sm text-slate-300">
          Age-adjusted ranges from DETRAINING_THRESHOLDS determine when a lift moves into each phase.
        </Text>

        <View className="overflow-hidden rounded-xl border border-slate-700">
          <View className="flex-row bg-slate-900/70 px-3 py-2">
            <Text className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-300">Phase</Text>
            <Text className="w-20 text-xs font-semibold uppercase tracking-wide text-slate-300">Under 40</Text>
            <Text className="w-20 text-xs font-semibold uppercase tracking-wide text-slate-300">40-59</Text>
            <Text className="w-16 text-xs font-semibold uppercase tracking-wide text-slate-300">60+</Text>
          </View>

          {detrainingRows.map((row) => (
            <View key={row.phase} className="flex-row border-t border-slate-700/70 px-3 py-2">
              <Text className={`flex-1 text-sm font-semibold ${row.phaseClassName}`}>{row.phase}</Text>
              <Text className="w-20 text-sm text-slate-100">{row.under40}</Text>
              <Text className="w-20 text-sm text-slate-100">{row.age40To59}</Text>
              <Text className="w-16 text-sm text-slate-100">{row.age60Plus}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
