import { useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import type { AgeBracket, WeightUnit } from '../shared/models/types';

const AGE_OPTIONS: Array<{ label: string; value: AgeBracket }> = [
  { label: 'Under 40', value: 'young' },
  { label: '40-59', value: 'middle' },
  { label: '60+', value: 'older' },
];

export default function OnboardingPage() {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);

  const [primaryUnit, setPrimaryUnit] = useState<WeightUnit>(settings.primaryUnit);
  const [ageBracket, setAgeBracket] = useState<AgeBracket>(settings.ageBracket);
  const [isSaving, setIsSaving] = useState(false);

  async function handleStartTracking() {
    setIsSaving(true);

    await updateSettings({ primaryUnit, ageBracket });
    await completeOnboarding();

    window.history.replaceState({}, '', '/');
    setIsSaving(false);
  }

  return (
    <div className="page-enter flex min-h-screen items-center justify-center bg-slate-900 px-4 py-8 text-white">
      <div className="w-full max-w-md space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome to LiftTracker</h1>
          <p className="text-slate-300">Set your preferences to get started.</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What unit do you prefer?</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPrimaryUnit('kg')}
              className={`min-h-16 rounded-xl border text-lg font-semibold transition ${
                primaryUnit === 'kg'
                  ? 'border-indigo-400 bg-indigo-500/20 text-indigo-100'
                  : 'border-slate-700 bg-slate-800 text-white'
              }`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setPrimaryUnit('lbs')}
              className={`min-h-16 rounded-xl border text-lg font-semibold transition ${
                primaryUnit === 'lbs'
                  ? 'border-indigo-400 bg-indigo-500/20 text-indigo-100'
                  : 'border-slate-700 bg-slate-800 text-white'
              }`}
            >
              lbs
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What's your age range?</h2>
          <div className="grid grid-cols-1 gap-3">
            {AGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAgeBracket(option.value)}
                className={`min-h-16 rounded-xl border text-lg font-semibold transition ${
                  ageBracket === option.value
                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-100'
                    : 'border-slate-700 bg-slate-800 text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={handleStartTracking}
          disabled={isSaving}
          className="min-h-16 w-full rounded-xl bg-indigo-500 text-lg font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-70"
        >
          {isSaving ? 'Saving...' : 'Start Tracking'}
        </button>
      </div>
    </div>
  );
}
