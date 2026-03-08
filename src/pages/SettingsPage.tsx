import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AgeBracket, WeightUnit } from '../shared/models/types';
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

export default function SettingsPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

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

  function updateBarbellWeight(nextWeightKg: number) {
    const normalized = Math.max(0, Math.round(nextWeightKg * 10) / 10);
    void updateSettings({ barbellWeightKg: normalized });
  }

  function handleBarbellInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextWeight = Number.parseFloat(event.target.value);

    if (Number.isNaN(nextWeight)) {
      return;
    }

    updateBarbellWeight(nextWeight);
  }

  function adjustBarbellWeight(deltaKg: number) {
    updateBarbellWeight(settings.barbellWeightKg + deltaKg);
  }

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
          Default in kg
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => adjustBarbellWeight(-2.5)}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 text-lg font-semibold text-white transition hover:bg-slate-700/70"
          >
            −
          </button>

          <input
            id="barbell-weight"
            type="number"
            min={0}
            step={2.5}
            inputMode="decimal"
            value={settings.barbellWeightKg}
            onChange={handleBarbellInputChange}
            className="min-h-12 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 text-lg text-white outline-none transition focus:border-indigo-400"
          />

          <button
            type="button"
            onClick={() => adjustBarbellWeight(2.5)}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 text-lg font-semibold text-white transition hover:bg-slate-700/70"
          >
            +
          </button>
        </div>
      </section>
    </div>
  );
}
