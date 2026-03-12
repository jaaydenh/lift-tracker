import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import DualWeightDisplay from '../components/DualWeightDisplay';
import PercentageChart from '../components/PercentageChart';
import SetRow from '../components/SetRow';
import { best1RMFromSets, best1RMFromSetsDetailed } from '@lift-tracker/shared';
import { formatWeight } from '@lift-tracker/shared';
import type { ExerciseSet } from '@lift-tracker/shared';
import { useExerciseStore } from '../store/useExerciseStore';
import { useSettingsStore } from '../store/useSettingsStore';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function daysAgoFromIsoDate(isoDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / DAY_IN_MS));
}

function formatDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isoDateToDateInputValue(isoDate: string): string {
  return formatDateInputValue(new Date(isoDate));
}

function todayDateInputValue(): string {
  return formatDateInputValue(new Date());
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

function cloneSet(set: ExerciseSet): ExerciseSet {
  return {
    ...set,
  };
}

export default function LogExercisePage() {
  const { exerciseId: exerciseIdParam, entryId } = useParams<{ exerciseId?: string; entryId?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(entryId);

  const exercises = useExerciseStore((state) => state.exercises);
  const entryToEdit = useExerciseStore((state) =>
    entryId ? state.entries.find((entry) => entry.id === entryId) : undefined,
  );
  const resolvedExerciseId = entryToEdit?.exerciseId ?? exerciseIdParam;
  const latestEntry = useExerciseStore((state) =>
    resolvedExerciseId ? state.getLatestEntry(resolvedExerciseId) : null,
  );
  const addEntry = useExerciseStore((state) => state.addEntry);
  const updateEntry = useExerciseStore((state) => state.updateEntry);

  const primaryUnit = useSettingsStore((state) => state.settings.primaryUnit);
  const barbellWeightKg = useSettingsStore((state) => state.settings.barbellWeightKg);

  const exercise = useMemo(
    () => exercises.find((item) => item.id === resolvedExerciseId),
    [resolvedExerciseId, exercises],
  );

  const isBodyweight = exercise?.category === 'bodyweight';

  const previousWorkingSet = useMemo(
    () => latestEntry?.sets.find((set) => !set.isWarmup) ?? latestEntry?.sets[0] ?? null,
    [latestEntry],
  );

  const previous1RMData = useMemo(
    () => (latestEntry ? best1RMFromSetsDetailed(latestEntry.sets) : null),
    [latestEntry],
  );
  const previousOneRM = previous1RMData?.value ?? null;
  const previous1RMSourceReps = previous1RMData?.sourceReps;

  const initialWeightKg = isBodyweight ? null : previousWorkingSet?.weightKg ?? barbellWeightKg;
  const initialReps = previousWorkingSet?.reps ?? 5;

  const defaultPerformedDate = useMemo(
    () => (entryToEdit ? isoDateToDateInputValue(entryToEdit.performedAt) : todayDateInputValue()),
    [entryToEdit],
  );

  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveConfirmed, setIsSaveConfirmed] = useState(false);
  const [performedDate, setPerformedDate] = useState(defaultPerformedDate);

  useEffect(() => {
    setPerformedDate(defaultPerformedDate);
  }, [defaultPerformedDate]);

  useEffect(() => {
    if (!resolvedExerciseId || !exercise) {
      setSets([]);
      return;
    }

    if (isEditMode) {
      if (!entryToEdit) {
        setSets([]);
        return;
      }

      setSets(entryToEdit.sets.map(cloneSet));
      return;
    }

    setSets([createSet(initialWeightKg, initialReps)]);
  }, [entryToEdit, exercise, initialReps, initialWeightKg, isEditMode, resolvedExerciseId]);

  if (isEditMode && !entryToEdit) {
    return (
      <div className="page-enter space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex min-h-12 items-center rounded-lg bg-slate-700 px-4 font-semibold"
        >
          ← Back
        </button>
        <p className="rounded-lg bg-slate-800 p-4 text-slate-300">Entry not found.</p>
      </div>
    );
  }

  if (!resolvedExerciseId || !exercise) {
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

    if (isEditMode && !entryToEdit) {
      return;
    }

    setIsSaving(true);
    setIsSaveConfirmed(false);

    try {
      const entryIdToSave = isEditMode ? entryToEdit?.id : uuidv4();

      if (!entryIdToSave) {
        return;
      }

      const entry = {
        id: entryIdToSave,
        exerciseId: resolvedExerciseId,
        sets,
        performedAt: new Date(performedDate + 'T00:00:00').toISOString(),
        estimated1RM_kg: best1RMFromSets(sets),
      };

      if (isEditMode) {
        await updateEntry(entry);
      } else {
        await addEntry(entry);
      }

      setIsSaveConfirmed(true);
      await new Promise((resolve) => {
        window.setTimeout(resolve, 240);
      });

      if (isEditMode) {
        navigate(`/history/${resolvedExerciseId}`);
      } else {
        navigate('/');
      }
    } finally {
      setIsSaving(false);
      setIsSaveConfirmed(false);
    }
  };

  const saveButtonLabel = isSaveConfirmed
    ? isEditMode
      ? '✓ Updated'
      : '✓ Saved'
    : isSaving
      ? isEditMode
        ? 'Updating...'
        : 'Saving...'
      : isEditMode
        ? 'Update Exercise'
        : 'Save Exercise';

  return (
    <div className="page-enter flex flex-col gap-4 pb-4">
      <header className="rounded-xl bg-slate-800 p-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (isEditMode) {
                navigate(`/history/${resolvedExerciseId}`);
                return;
              }

              navigate('/');
            }}
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg bg-slate-700 px-3 text-xl"
            aria-label="Go back"
          >
            ←
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold">{exercise.name}</h1>
            {isEditMode && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                Editing Session
              </p>
            )}
          </div>

          {!isEditMode ? (
            <button
              type="button"
              onClick={() => navigate(`/history/${resolvedExerciseId}`)}
              className="inline-flex min-h-12 items-center rounded-lg bg-slate-700 px-3 text-sm font-semibold"
            >
              History
            </button>
          ) : (
            <div className="min-h-12 min-w-12" aria-hidden="true" />
          )}
        </div>
      </header>

      <section className="rounded-xl bg-slate-800 p-4">
        <div className="flex items-center gap-3">
          <label
            htmlFor="performed-date"
            className="text-sm font-semibold uppercase tracking-wide text-slate-400"
          >
            Date
          </label>
          <input
            id="performed-date"
            type="date"
            value={performedDate}
            onChange={(event) => {
              setPerformedDate(event.target.value);
            }}
            className="min-h-12 flex-1 rounded-lg bg-slate-700 px-3 text-white"
          />
        </div>
      </section>

      <section className="rounded-xl bg-slate-800 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Estimated 1RM</h2>
        {previousOneRM !== null ? (
          <>
            <DualWeightDisplay weightKg={previousOneRM} primaryUnit={primaryUnit} className="mt-2 bg-slate-900/70" />
            {previous1RMSourceReps !== undefined && previous1RMSourceReps > 10 && (
              <p className="mt-2 text-xs text-yellow-400">
                ⚠️ Based on {previous1RMSourceReps}-rep set — less accurate above 10 reps
              </p>
            )}
          </>
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

      {previousOneRM !== null && (
        <PercentageChart
          oneRM={previousOneRM}
          primaryUnit={primaryUnit}
          sourceReps={previous1RMSourceReps}
        />
      )}

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
        {saveButtonLabel}
      </button>
    </div>
  );
}
