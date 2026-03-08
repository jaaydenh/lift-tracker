import { useEffect, useRef, useState } from 'react';
import { formatWeight, lbsToKg, roundToPlate } from '../shared/calc/units';
import type { WeightUnit } from '../shared/models/types';

interface DualWeightInputProps {
  valueKg: number;
  onChange: (kg: number) => void;
  primaryUnit: WeightUnit;
}

function getSecondaryUnit(unit: WeightUnit): WeightUnit {
  return unit === 'kg' ? 'lbs' : 'kg';
}

export default function DualWeightInput({ valueKg, onChange, primaryUnit }: DualWeightInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(formatWeight(valueKg, primaryUnit));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(formatWeight(valueKg, primaryUnit));
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing, primaryUnit, valueKg]);

  const secondaryUnit = getSecondaryUnit(primaryUnit);

  const commitDraftValue = () => {
    const parsed = Number.parseFloat(draftValue);

    if (Number.isNaN(parsed)) {
      setDraftValue(formatWeight(valueKg, primaryUnit));
      setIsEditing(false);
      return;
    }

    const nextKg = primaryUnit === 'kg' ? parsed : lbsToKg(parsed);
    onChange(Math.max(0, nextKg));
    setIsEditing(false);
  };

  const adjustWeight = (direction: 1 | -1) => {
    const stepKg = primaryUnit === 'kg' ? 2.5 : lbsToKg(5);
    const nextValue = roundToPlate(Math.max(0, valueKg + stepKg * direction));
    onChange(nextValue);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="min-h-12 min-w-12 shrink-0 rounded-lg bg-slate-600 text-2xl font-semibold leading-none"
        onClick={() => adjustWeight(-1)}
      >
        −
      </button>

      <div className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-center">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={commitDraftValue}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commitDraftValue();
              }

              if (event.key === 'Escape') {
                setIsEditing(false);
                setDraftValue(formatWeight(valueKg, primaryUnit));
              }
            }}
            inputMode="decimal"
            className="min-h-12 w-full bg-transparent text-center text-3xl font-bold focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="min-h-12 w-full text-3xl font-bold"
          >
            {formatWeight(valueKg, primaryUnit)} {primaryUnit}
          </button>
        )}

        <p className="mt-1 text-sm text-slate-400">
          {formatWeight(valueKg, secondaryUnit)} {secondaryUnit}
        </p>
      </div>

      <button
        type="button"
        className="min-h-12 min-w-12 shrink-0 rounded-lg bg-slate-600 text-2xl font-semibold leading-none"
        onClick={() => adjustWeight(1)}
      >
        +
      </button>
    </div>
  );
}
