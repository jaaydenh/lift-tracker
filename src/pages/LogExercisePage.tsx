import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import DualWeightDisplay from '../components/DualWeightDisplay';
import PercentageChart from '../components/PercentageChart';
import SetRow from '../components/SetRow';
import { best1RMFromSets } from '../shared/calc/oneRepMax';
import { formatWeight } from '../shared/calc/units';
import type { ExerciseSet } from '../shared/models/types';
import { useExerciseStore } from '../store/useExerciseStore';
import { useSettingsStore } from '../store/useSettingsStore';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function daysAgoFromIsoDate(isoDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / DAY_IN_MS));
}

function createSet(weightKg: number | null, reps: number): ExerciseSet {
  return {
    id: uuidv4(),
    weightKg,
    reps,
    isWarmup: false,
    completedAt: new Date().toISOString(),
  };
}

export default function LogExercisePage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();

  const exercises = useExerciseStore((state) => state.exercises);
  const latestEntry = useExerciseStore((state) => (exerciseId ? state.getLatestEntry(exerciseId) : null));
  const addEntry = useExerciseStore((state) => state.addEntry);

  const primaryUnit = useSettingsStore((state) => state.settings.primaryUnit);
  const barbellWeightKg = useSettingsStore((state) => state.settings.barbellWeightKg);

  const exercise = useMemo(
    () => exercises.find((item) => item.id === exerciseId),
    [exerciseId, exercises],
  );

  const isBodyweight = exercise?.category === 'bodyweight';

  const previousWorkingSet = useMemo(
    () => latestEntry?.sets.find((set) => !set.isWarmup) ?? latestEntry?.sets[0] ?? null,
    [latestEntry],
  );

  const previousOneRM = useMemo(
    () => (latestEntry ? best1RMFromSets(latestEntry.sets) : null),
    [latestEntry],
  );

  const initialWeightKg = isBodyweight ? null : previousWorkingSet?.weightKg ?? barbellWeightKg;
  const initialReps = previousWorkingSet?.reps ?? 5;

  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveConfirmed, setIsSaveConfirmed] = useState(false);

  useEffect(() => {
    if (!exerciseId || !exercise) {
      setSets([]);
      return;
    }

    setSets([createSet(initialWeightKg, initialReps)]);
  }, [exercise, exerciseId, initialReps, initialWeightKg]);

  if (!exerciseId || !exercise) {
    return (
      <div className="page-enter space-y-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex min-h-12 items-center rounded-lg bg-slate-700 px-4 font-semibold"
        >
          ← Back
        </button>
        <p className="rounded-lg bg-slate-800 p-4 text-slate-300">Exercise not found.</p>
      </div>
    );
  }

  const latestDaysAgo = latestEntry ? daysAgoFromIsoDate(latestEntry.performedAt) : null;

  const lastSessionSummary = (() => {
    if (!latestEntry) {
      return 'First time logging this exercise!';
    }

    if (!previousWorkingSet) {
      return `Last session logged ${latestDaysAgo ?? 0}d ago`;
    }

    if (previousWorkingSet.weightKg === null) {
      return `Last: BW × ${previousWorkingSet.reps} reps — ${latestDaysAgo ?? 0}d ago`;
    }

    return `Last: ${formatWeight(previousWorkingSet.weightKg, primaryUnit)} ${primaryUnit} × ${previousWorkingSet.reps} reps — ${latestDaysAgo ?? 0}d ago`;
  })();

  const handleAddSet = () => {
    setSets((current) => {
      const previousSet = current[current.length - 1];
      const nextWeightKg = isBodyweight ? null : previousSet?.weightKg ?? initialWeightKg;
      const nextReps = previousSet?.reps ?? initialReps;
      return [...current, createSet(nextWeightKg, nextReps)];
    });
  };

  const handleSave = async () => {
    if (sets.length === 0 || isSaving) {
      return;
    }

    setIsSaving(true);
    setIsSaveConfirmed(false);

    try {
      await addEntry({
        id: uuidv4(),
        exerciseId,
        sets,
        performedAt: new Date().toISOString(),
        estimated1RM_kg: best1RMFromSets(sets),
      });

      setIsSaveConfirmed(true);
      await new Promise((resolve) => {
        window.setTimeout(resolve, 240);
      });

      navigate('/');
    } finally {
      setIsSaving(false);
      setIsSaveConfirmed(false);
    }
  };

  return (
    <div className="page-enter flex flex-col gap-4 pb-4">
      <header className="rounded-xl bg-slate-800 p-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg bg-slate-700 px-3 text-xl"
            aria-label="Go back"
          >
            ←
          </button>

          <h1 className="flex-1 text-center text-xl font-bold">{exercise.name}</h1>

          <Link
            to={`/history/${exerciseId}`}
            className="inline-flex min-h-12 items-center rounded-lg bg-slate-700 px-3 text-sm font-semibold"
          >
            History
          </Link>
        </div>
      </header>

      <section className="rounded-xl bg-slate-800 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Estimated 1RM</h2>
        {previousOneRM !== null ? (
          <DualWeightDisplay weightKg={previousOneRM} primaryUnit={primaryUnit} className="mt-2 bg-slate-900/70" />
        ) : (
          <p className="mt-2 text-slate-300">No 1RM data yet</p>
        )}
      </section>

      <section className="rounded-xl bg-slate-800 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Last session</h2>
        <p className="mt-2 text-base text-slate-100">{lastSessionSummary}</p>
      </section>

      <section className="space-y-3">
        {sets.map((set, index) => (
          <SetRow
            key={set.id}
            set={set}
            index={index}
            onUpdate={(nextSet) => {
              setSets((current) =>
                current.map((currentSet, currentIndex) => (currentIndex === index ? nextSet : currentSet)),
              );
            }}
            onRemove={() => {
              setSets((current) => current.filter((_, currentIndex) => currentIndex !== index));
            }}
            primaryUnit={primaryUnit}
            isBodyweight={isBodyweight}
          />
        ))}

        <button
          type="button"
          onClick={handleAddSet}
          className="w-full min-h-12 rounded-lg border border-dashed border-slate-500 bg-slate-800 text-base font-semibold text-slate-100"
        >
          + Add Set
        </button>
      </section>

      {previousOneRM !== null && <PercentageChart oneRM={previousOneRM} primaryUnit={primaryUnit} />}

      <button
        type="button"
        onClick={() => {
          void handleSave();
        }}
        disabled={sets.length === 0 || isSaving}
        className={`w-full min-h-12 rounded-xl px-4 py-3 text-lg font-bold text-white transition ${
          sets.length === 0 ? 'bg-slate-600' : isSaveConfirmed ? 'bg-green-500' : 'bg-green-600'
        } disabled:cursor-not-allowed`}
      >
        {isSaveConfirmed ? '✓ Saved' : isSaving ? 'Saving...' : 'Save Workout'}
      </button>
    </div>
  );
}
