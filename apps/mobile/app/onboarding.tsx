import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { AgeBracket, WeightUnit } from '@lift-tracker/shared';
import { useAuthStore } from '../auth/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';

const UNIT_OPTIONS: Array<{ label: string; value: WeightUnit }> = [
  { label: 'kg', value: 'kg' },
  { label: 'lbs', value: 'lbs' },
];

const AGE_OPTIONS: Array<{ label: string; value: AgeBracket }> = [
  { label: 'Under 40', value: 'young' },
  { label: '40-59', value: 'middle' },
  { label: '60+', value: 'older' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);
  const [primaryUnit, setPrimaryUnit] = useState<WeightUnit>(settings.primaryUnit);
  const [ageBracket, setAgeBracket] = useState<AgeBracket>(settings.ageBracket);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  async function handleStartTracking() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateSettings({ primaryUnit, ageBracket });
      await completeOnboarding();
      router.replace('/');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-900 px-6">
      <View className="w-full max-w-sm gap-8">
        <View className="gap-2">
          <Text className="text-center text-3xl font-bold text-white">Welcome to LiftTracker</Text>
          <Text className="text-center text-base text-slate-300">
            Set your preferences once so every lift logs with the right defaults.
          </Text>
        </View>

        <View className="gap-3">
          <Text className="text-sm font-semibold uppercase tracking-wide text-slate-300">Primary Unit</Text>
          <View className="flex-row gap-3">
            {UNIT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                className={`flex-1 rounded-xl border px-4 py-4 ${
                  primaryUnit === option.value
                    ? 'border-indigo-300 bg-indigo-500/20'
                    : 'border-slate-700 bg-slate-800/80'
                }`}
                onPress={() => {
                  setPrimaryUnit(option.value);
                }}
              >
                <Text
                  className={`text-center text-base font-semibold ${
                    primaryUnit === option.value ? 'text-indigo-100' : 'text-slate-100'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-sm font-semibold uppercase tracking-wide text-slate-300">Age Bracket</Text>
          <View className="gap-3">
            {AGE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                className={`rounded-xl border px-4 py-4 ${
                  ageBracket === option.value
                    ? 'border-indigo-300 bg-indigo-500/20'
                    : 'border-slate-700 bg-slate-800/80'
                }`}
                onPress={() => {
                  setAgeBracket(option.value);
                }}
              >
                <Text
                  className={`text-base font-semibold ${
                    ageBracket === option.value ? 'text-indigo-100' : 'text-slate-100'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          className={`items-center justify-center rounded-xl px-4 py-4 ${
            isSubmitting ? 'bg-indigo-500/70' : 'bg-indigo-500'
          }`}
          onPress={() => {
            void handleStartTracking();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">Start Tracking</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
