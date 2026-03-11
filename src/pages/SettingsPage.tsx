import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { kgToLbs, lbsToKg } from '../shared/calc/units';
import type { AgeBracket, WeightUnit } from '../shared/models/types';
import { useAuthStore } from '../auth/useAuthStore';
import { db } from '../db/database';
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

const AUTH_PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
};

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

export default function SettingsPage() {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadSyncStatus() {
      const [queueCount, syncState] = await Promise.all([
        db.syncQueue.count(),
        db.syncState.get('sync'),
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
  }, [session?.user.id]);

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

  const barbellWeightInPrimaryUnit =
    settings.primaryUnit === 'kg'
      ? settings.barbellWeightKg
      : Math.round(kgToLbs(settings.barbellWeightKg) * 10) / 10;

  const barbellStepInPrimaryUnit = settings.primaryUnit === 'kg' ? 2.5 : 5;

  function updateBarbellWeight(nextWeightInPrimaryUnit: number) {
    const nextWeightKg =
      settings.primaryUnit === 'kg' ? nextWeightInPrimaryUnit : lbsToKg(nextWeightInPrimaryUnit);

    const normalizedKg =
      settings.primaryUnit === 'kg'
        ? Math.max(0, Math.round(nextWeightKg * 10) / 10)
        : Math.max(0, nextWeightKg);

    void updateSettings({ barbellWeightKg: normalizedKg });
  }

  function handleBarbellInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextWeight = Number.parseFloat(event.target.value);

    if (Number.isNaN(nextWeight)) {
      return;
    }

    updateBarbellWeight(nextWeight);
  }

  function adjustBarbellWeight(deltaInPrimaryUnit: number) {
    updateBarbellWeight(barbellWeightInPrimaryUnit + deltaInPrimaryUnit);
  }

  function handleSignOut() {
    void signOut();
  }

  const provider = session?.user.app_metadata.provider;
  const providerLabel =
    typeof provider === 'string'
      ? AUTH_PROVIDER_LABELS[provider] ?? `${provider.charAt(0).toUpperCase()}${provider.slice(1)}`
      : 'Unknown';

  return (
    <div className="page-enter space-y-6 pb-24">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-slate-800 text-xl transition hover:bg-slate-700"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </header>

      <section className="space-y-4 rounded-xl bg-slate-800 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Account</h2>
            <p className="text-base font-semibold text-white">{session?.user.email ?? 'Signed in user'}</p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="min-h-12 rounded-lg border border-rose-400/60 bg-rose-500/10 px-4 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
          >
            Sign Out
          </button>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
          <p className="text-sm text-slate-400">Provider</p>
          <p className="text-base font-semibold text-slate-100">{providerLabel}</p>
        </div>
      </section>

      <section className="space-y-3 rounded-xl bg-slate-800 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Sync Status</h2>
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
          <p className="text-sm text-slate-400">Pending changes</p>
          <p
            className={`text-base font-semibold ${
              pendingSyncCount > 0 ? 'text-amber-300' : 'text-emerald-300'
            }`}
          >
            {pendingSyncCount > 0 ? `${pendingSyncCount} changes pending` : 'All synced'}
          </p>
        </div>
        <p className="text-sm text-slate-400">
          Last synced: <span className="text-slate-200">{formatLastSynced(lastSyncedAt)}</span>
        </p>
      </section>

      <section className="space-y-3 rounded-xl bg-slate-800 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Primary Unit</h2>
        <div className="grid grid-cols-2 gap-3">
          {UNIT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPrimaryUnit(option.value)}
              className={`min-h-12 rounded-lg border text-base font-semibold transition ${
                settings.primaryUnit === option.value
                  ? 'border-indigo-300 bg-indigo-500/20 text-indigo-100'
                  : 'border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-700/70'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl bg-slate-800 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Age Bracket</h2>
        <div className="grid grid-cols-1 gap-3">
          {AGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAgeBracket(option.value)}
              className={`min-h-12 rounded-lg border px-3 text-left text-base font-semibold transition ${
                settings.ageBracket === option.value
                  ? 'border-indigo-300 bg-indigo-500/20 text-indigo-100'
                  : 'border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-700/70'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl bg-slate-800 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Default Barbell Weight
        </h2>

        <label htmlFor="barbell-weight" className="block text-sm text-slate-400">
          Default in {settings.primaryUnit}
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => adjustBarbellWeight(-barbellStepInPrimaryUnit)}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 text-lg font-semibold text-white transition hover:bg-slate-700/70"
          >
            −
          </button>

          <input
            id="barbell-weight"
            type="number"
            min={0}
            step={barbellStepInPrimaryUnit}
            inputMode="decimal"
            value={barbellWeightInPrimaryUnit}
            onChange={handleBarbellInputChange}
            className="min-h-12 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 text-lg text-white outline-none transition focus:border-indigo-400"
          />

          <button
            type="button"
            onClick={() => adjustBarbellWeight(barbellStepInPrimaryUnit)}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 text-lg font-semibold text-white transition hover:bg-slate-700/70"
          >
            +
          </button>
        </div>
      </section>
    </div>
  );
}
