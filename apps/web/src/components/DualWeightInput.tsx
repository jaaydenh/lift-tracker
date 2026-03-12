import { useEffect, useRef, useState } from 'react';
import { formatWeight, kgToLbs, lbsToKg, roundToPlate } from '@lift-tracker/shared';
import type { WeightUnit } from '@lift-tracker/shared';

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
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayValue = formatWeight(valueKg, primaryUnit);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const secondaryUnit = getSecondaryUnit(primaryUnit);

  const commitDraftValue = () => {
    const parsed = Number.parseFloat(draftValue ?? displayValue);

    if (Number.isNaN(parsed)) {
      setIsEditing(false);
      setDraftValue(null);
      return;
    }

    const nextKg = primaryUnit === 'kg' ? parsed : lbsToKg(parsed);
    onChange(Math.max(0, nextKg));
    setIsEditing(false);
    setDraftValue(null);
  };

  const adjustWeight = (direction: 1 | -1) => {
    if (primaryUnit === 'kg') {
      const nextKg = roundToPlate(Math.max(0, valueKg + 2.5 * direction));
      onChange(nextKg);
      return;
    }

    const nextLbs = Math.max(0, kgToLbs(valueKg) + 5 * direction);
    onChange(lbsToKg(nextLbs));
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        className="min-h-12 min-w-12 shrink-0 rounded-lg bg-slate-600 text-xl font-semibold leading-none"
        onClick={() => adjustWeight(-1)}
      >
        −
      </button>

      <div className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2 text-center">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={draftValue ?? displayValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={commitDraftValue}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commitDraftValue();
              }

              if (event.key === 'Escape') {
                setIsEditing(false);
                setDraftValue(null);
              }
            }}
            inputMode="decimal"
            className="min-h-12 w-full bg-transparent text-center text-2xl font-bold leading-tight focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraftValue(displayValue);
              setIsEditing(true);
            }}
            className="min-h-12 w-full whitespace-nowrap text-2xl font-bold leading-tight"
          >
            {displayValue} {primaryUnit}
          </button>
        )}

        <p className="mt-1 text-sm text-slate-400">
          {formatWeight(valueKg, secondaryUnit)} {secondaryUnit}
        </p>
      </div>

      <button
        type="button"
        className="min-h-12 min-w-12 shrink-0 rounded-lg bg-slate-600 text-xl font-semibold leading-none"
        onClick={() => adjustWeight(1)}
      >
        +
      </button>
    </div>
  );
}
