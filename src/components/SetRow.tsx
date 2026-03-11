import { useEffect, useRef, useState } from 'react';
import type { ExerciseSet, WeightUnit } from '../shared/models/types';
import DualWeightInput from './DualWeightInput';

interface SetRowProps {
  set: ExerciseSet;
  index: number;
  onUpdate: (set: ExerciseSet) => void;
  onRemove: () => void;
  primaryUnit: WeightUnit;
  isBodyweight: boolean;
}

export default function SetRow({
  set: exerciseSet,
  index,
  onUpdate,
  onRemove,
  primaryUnit,
  isBodyweight,
}: SetRowProps) {
  const [isEditingReps, setIsEditingReps] = useState(false);
  const [draftReps, setDraftReps] = useState<string | null>(null);
  const repsInputRef = useRef<HTMLInputElement>(null);
  const repsDisplayValue = exerciseSet.reps.toString();

  useEffect(() => {
    if (!isEditingReps) {
      return;
    }

    repsInputRef.current?.focus();
    repsInputRef.current?.select();
  }, [isEditingReps]);

  const updateReps = (reps: number) => {
    onUpdate({
      ...exerciseSet,
      reps: Math.max(0, Math.round(reps)),
    });
  };

  const commitDraftReps = () => {
    const parsed = Number.parseFloat(draftReps ?? repsDisplayValue);

    if (!Number.isNaN(parsed)) {
      updateReps(parsed);
    }

    setIsEditingReps(false);
    setDraftReps(null);
  };

  return (
    <div className="bg-slate-700/50 rounded-lg p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-200">Set {index + 1}</p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdate({ ...exerciseSet, isWarmup: !exerciseSet.isWarmup })}
            className={`min-h-12 min-w-12 rounded-lg px-3 text-sm font-semibold ${
              exerciseSet.isWarmup
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/50'
                : 'bg-slate-800 text-slate-300 border border-slate-600'
            }`}
          >
            {exerciseSet.isWarmup ? 'W' : 'Warmup'}
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="min-h-12 min-w-12 rounded-lg border border-rose-400/50 bg-rose-500/20 px-3 text-2xl leading-none text-rose-200"
            aria-label={`Remove set ${index + 1}`}
          >
            ×
          </button>
        </div>
      </div>

      <div
        className={`grid gap-3 ${
          isBodyweight ? 'grid-cols-1' : 'grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]'
        }`}
      >
        {!isBodyweight && (
          <div className="min-w-0">
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Weight</p>
            <DualWeightInput
              valueKg={exerciseSet.weightKg ?? 0}
              onChange={(weightKg) => onUpdate({ ...exerciseSet, weightKg })}
              primaryUnit={primaryUnit}
            />
          </div>
        )}

        <div className="min-w-0">
          <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Reps</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="min-h-12 min-w-12 shrink-0 rounded-lg bg-slate-800 text-xl font-semibold leading-none"
              onClick={() => updateReps(exerciseSet.reps - 1)}
            >
              −
            </button>

            <div className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2 text-center">
              {isEditingReps ? (
                <input
                  ref={repsInputRef}
                  type="text"
                  value={draftReps ?? repsDisplayValue}
                  onChange={(event) => setDraftReps(event.target.value)}
                  onBlur={commitDraftReps}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      commitDraftReps();
                    }

                    if (event.key === 'Escape') {
                      setIsEditingReps(false);
                      setDraftReps(null);
                    }
                  }}
                  inputMode="numeric"
                  className="min-h-12 w-full bg-transparent text-center text-2xl font-bold leading-tight focus:outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraftReps(repsDisplayValue);
                    setIsEditingReps(true);
                  }}
                  className="min-h-12 w-full text-2xl font-bold leading-tight"
                >
                  {repsDisplayValue}
                </button>
              )}
              <p className="mt-1 text-sm text-slate-400">reps</p>
            </div>

            <button
              type="button"
              className="min-h-12 min-w-12 shrink-0 rounded-lg bg-slate-800 text-xl font-semibold leading-none"
              onClick={() => updateReps(exerciseSet.reps + 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
