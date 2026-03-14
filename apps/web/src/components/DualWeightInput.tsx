import { useEffect, useRef, useState } from 'react';
import { formatWeight, kgToLbs, lbsToKg, roundToPlate } from '@lift-tracker/shared';
import type { WeightUnit } from '@lift-tracker/shared';

interface DualWeightInputProps {
  valueKg: number | null;
  onChange: (kg: number | null) => void;
  primaryUnit: WeightUnit;
  isBodyweight: boolean;
}

function getSecondaryUnit(unit: WeightUnit): WeightUnit {
  return unit === 'kg' ? 'lbs' : 'kg';
}

export default function DualWeightInput({
  valueKg,
  onChange,
  primaryUnit,
  isBodyweight,
}: DualWeightInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const secondaryUnit = getSecondaryUnit(primaryUnit);

  const normalizedValueKg = valueKg ?? 0;
  const displayValue = formatWeight(normalizedValueKg, primaryUnit);
  const inputFallbackValue = isBodyweight && valueKg === null ? '' : displayValue;

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const resetEditing = () => {
    setIsEditing(false);
    setDraftValue(null);
  };

  const commitDraftValue = () => {
    const rawValue = (draftValue ?? inputFallbackValue).trim();

    if (isBodyweight && rawValue === '') {
      onChange(null);
      resetEditing();
      return;
    }

    const parsed = Number.parseFloat(rawValue);

    if (Number.isNaN(parsed)) {
      resetEditing();
      return;
    }

    const nextKg = primaryUnit === 'kg' ? parsed : lbsToKg(parsed);

    if (isBodyweight) {
      onChange(nextKg > 0 ? nextKg : null);
      resetEditing();
      return;
    }

    onChange(Math.max(0, nextKg));
    resetEditing();
  };

  const adjustWeight = (direction: 1 | -1) => {
    if (primaryUnit === 'kg') {
      const currentKg = valueKg ?? 0;
      const nextKg = roundToPlate(Math.max(0, currentKg + 2.5 * direction));

      if (isBodyweight && nextKg <= 0) {
        onChange(null);
        return;
      }

      onChange(nextKg);
      return;
    }

    const currentLbs = kgToLbs(valueKg ?? 0);
    const nextLbs = Math.max(0, currentLbs + 5 * direction);

    if (isBodyweight && nextLbs <= 0) {
      onChange(null);
      return;
    }

    onChange(lbsToKg(nextLbs));
  };

  const primaryDisplay = isBodyweight && valueKg === null ? 'BW' : `${displayValue} ${primaryUnit}`;
  const secondaryDisplay =
    isBodyweight && valueKg === null
      ? 'No added weight'
      : isBodyweight
        ? `+ ${formatWeight(normalizedValueKg, secondaryUnit)} ${secondaryUnit}`
        : `${formatWeight(normalizedValueKg, secondaryUnit)} ${secondaryUnit}`;

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
            value={draftValue ?? inputFallbackValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={commitDraftValue}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commitDraftValue();
              }

              if (event.key === 'Escape') {
                resetEditing();
              }
            }}
            inputMode="decimal"
            className="min-h-12 w-full bg-transparent text-center text-2xl font-bold leading-tight focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraftValue(inputFallbackValue);
              setIsEditing(true);
            }}
            className="min-h-12 w-full whitespace-nowrap text-2xl font-bold leading-tight"
          >
            {primaryDisplay}
          </button>
        )}

        <p className="mt-1 text-sm text-slate-400">{secondaryDisplay}</p>
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
