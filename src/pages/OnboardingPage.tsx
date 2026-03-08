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
    <div className="min-h-screen bg-slate-900 text-white px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to LiftTracker</h1>
          <p className="text-slate-300">Set your preferences to get started.</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What unit do you prefer?</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPrimaryUnit('kg')}
              className={`h-16 rounded-xl border text-lg font-semibold transition ${
                primaryUnit === 'kg'
                  ? 'border-blue-400 bg-blue-500/20 text-blue-100'
                  : 'border-slate-700 bg-slate-800 text-white'
              }`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setPrimaryUnit('lbs')}
              className={`h-16 rounded-xl border text-lg font-semibold transition ${
                primaryUnit === 'lbs'
                  ? 'border-blue-400 bg-blue-500/20 text-blue-100'
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
                className={`h-16 rounded-xl border text-lg font-semibold transition ${
                  ageBracket === option.value
                    ? 'border-blue-400 bg-blue-500/20 text-blue-100'
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
          className="w-full h-16 rounded-xl bg-blue-600 text-white text-lg font-semibold disabled:opacity-70"
        >
          {isSaving ? 'Saving...' : 'Start Tracking'}
        </button>
      </div>
    </div>
  );
}
