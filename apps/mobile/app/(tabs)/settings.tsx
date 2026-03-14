import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { kgToLbs, lbsToKg } from '@lift-tracker/shared';
import type { AgeBracket, WeightUnit } from '@lift-tracker/shared';
import { getStorageAdapter } from '../../lib/adapterRuntime';
import { useAuthStore } from '../../auth/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';

const UNIT_OPTIONS: Array<{ label: string; value: WeightUnit }> = [
  { label: 'kg', value: 'kg' },
  { label: 'lbs', value: 'lbs' },
];

const AGE_OPTIONS: Array<{ label: string; value: AgeBracket }> = [
  { label: 'Under 40', value: 'young' },
  { label: '40-59', value: 'middle' },
  { label: '60+', value: 'older' },
];

const AUTH_PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
};

function formatWeightForInput(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const withFixed = rounded.toFixed(1);
  return withFixed.endsWith('.0') ? withFixed.slice(0, -2) : withFixed;
}

function formatLastSynced(lastSyncedAt: string | null): string {
  if (!lastSyncedAt) {
    return 'Never';
  }

  const parsed = new Date(lastSyncedAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown';
  }

  return parsed.toLocaleString();
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3 rounded-2xl bg-slate-800 p-4">
      <Text className="text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</Text>
      {children}
    </View>
  );
}

function ToggleButton({
  label,
  isSelected,
  onPress,
  fullWidth,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      className={`${fullWidth ? 'w-full' : 'flex-1'} rounded-xl border px-4 py-3 ${
        isSelected ? 'border-indigo-300 bg-indigo-500/20' : 'border-slate-700 bg-slate-900/60'
      }`}
      onPress={onPress}
    >
      <Text className={`text-base font-semibold ${isSelected ? 'text-indigo-100' : 'text-slate-100'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const barbellWeightInPrimaryUnit = useMemo(() => {
    if (settings.primaryUnit === 'kg') {
      return settings.barbellWeightKg;
    }

    return Math.round(kgToLbs(settings.barbellWeightKg) * 10) / 10;
  }, [settings.barbellWeightKg, settings.primaryUnit]);

  const [barbellInput, setBarbellInput] = useState(() => formatWeightForInput(barbellWeightInPrimaryUnit));

  useEffect(() => {
    setBarbellInput(formatWeightForInput(barbellWeightInPrimaryUnit));
  }, [barbellWeightInPrimaryUnit]);

  useEffect(() => {
    const isSettingsRoute = pathname.endsWith('/settings');
    if (!isSettingsRoute) {
      return;
    }

    let isCancelled = false;

    async function loadSyncStatus() {
      const storage = getStorageAdapter();
      const [queueCount, syncState] = await Promise.all([
        storage.syncQueue.count(),
        storage.syncState.get('sync'),
      ]);

      if (isCancelled) {
        return;
      }

      setPendingSyncCount(queueCount);
      setLastSyncedAt(syncState?.lastSyncedAt ?? null);
    }

    void loadSyncStatus();

    return () => {
      isCancelled = true;
    };
  }, [pathname, session?.user.id]);

  function setPrimaryUnit(nextUnit: WeightUnit) {
    if (settings.primaryUnit === nextUnit) {
      return;
    }

    void updateSettings({ primaryUnit: nextUnit });
  }

  function setAgeBracket(nextAgeBracket: AgeBracket) {
    if (settings.ageBracket === nextAgeBracket) {
      return;
    }

    void updateSettings({ ageBracket: nextAgeBracket });
  }

  function updateBarbellWeight(nextWeightInPrimaryUnit: number) {
    const nextWeightKg =
      settings.primaryUnit === 'kg' ? nextWeightInPrimaryUnit : lbsToKg(nextWeightInPrimaryUnit);

    const normalizedKg = Math.max(0, Math.round(nextWeightKg * 10) / 10);
    void updateSettings({ barbellWeightKg: normalizedKg });
  }

  function handleBarbellInputChange(nextText: string) {
    setBarbellInput(nextText);
    const nextWeight = Number.parseFloat(nextText);

    if (Number.isNaN(nextWeight)) {
      return;
    }

    updateBarbellWeight(nextWeight);
  }

  function adjustBarbellWeight(direction: -1 | 1) {
    const stepInPrimaryUnit = settings.primaryUnit === 'kg' ? 2.5 : 5;
    updateBarbellWeight(barbellWeightInPrimaryUnit + stepInPrimaryUnit * direction);
  }

  const provider = session?.user.app_metadata.provider;
  const providerLabel =
    typeof provider === 'string'
      ? AUTH_PROVIDER_LABELS[provider] ?? `${provider.charAt(0).toUpperCase()}${provider.slice(1)}`
      : 'Unknown';

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
        <Text className="text-2xl font-bold text-white">Settings</Text>
      </View>

      <SectionCard title="Account">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-base font-semibold text-white">{session?.user.email ?? 'Signed in user'}</Text>
            <Text className="text-sm text-slate-300">Provider: {providerLabel}</Text>
          </View>
          <Pressable
            className="rounded-lg border border-rose-400/60 bg-rose-500/10 px-4 py-3"
            onPress={() => {
              void signOut();
            }}
          >
            <Text className="text-sm font-semibold text-rose-100">Sign Out</Text>
          </Pressable>
        </View>
      </SectionCard>

      <SectionCard title="Sync Status">
        <View className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
          <Text className="text-sm text-slate-400">Pending changes</Text>
          <Text
            className={`text-base font-semibold ${
              pendingSyncCount > 0 ? 'text-amber-300' : 'text-emerald-300'
            }`}
          >
            {pendingSyncCount > 0 ? `${pendingSyncCount} changes pending` : 'All synced'}
          </Text>
        </View>
        <Text className="text-sm text-slate-400">
          Last synced: <Text className="text-slate-200">{formatLastSynced(lastSyncedAt)}</Text>
        </Text>
      </SectionCard>

      <SectionCard title="Primary Unit">
        <View className="flex-row gap-3">
          {UNIT_OPTIONS.map((option) => (
            <ToggleButton
              key={option.value}
              label={option.label}
              isSelected={settings.primaryUnit === option.value}
              onPress={() => {
                setPrimaryUnit(option.value);
              }}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Age Bracket">
        <View className="gap-3">
          {AGE_OPTIONS.map((option) => (
            <ToggleButton
              key={option.value}
              label={option.label}
              isSelected={settings.ageBracket === option.value}
              fullWidth
              onPress={() => {
                setAgeBracket(option.value);
              }}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Default Barbell Weight">
        <Text className="text-sm text-slate-400">Default in {settings.primaryUnit}</Text>

        <View className="flex-row items-center gap-3">
          <Pressable
            className="h-12 w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60"
            onPress={() => {
              adjustBarbellWeight(-1);
            }}
          >
            <Text className="text-2xl font-semibold text-white">−</Text>
          </Pressable>

          <TextInput
            keyboardType="decimal-pad"
            className="h-12 flex-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 text-lg text-white"
            value={barbellInput}
            onChangeText={handleBarbellInputChange}
          />

          <Pressable
            className="h-12 w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60"
            onPress={() => {
              adjustBarbellWeight(1);
            }}
          >
            <Text className="text-2xl font-semibold text-white">+</Text>
          </Pressable>
        </View>
      </SectionCard>
    </ScrollView>
  );
}
