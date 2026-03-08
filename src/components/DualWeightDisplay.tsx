import type { WeightUnit } from '../shared/models/types';
import { formatWeight } from '../shared/calc/units';

interface DualWeightDisplayProps {
  weightKg: number;
  primaryUnit: WeightUnit;
  className?: string;
}

function getSecondaryUnit(unit: WeightUnit): WeightUnit {
  return unit === 'kg' ? 'lbs' : 'kg';
}

export default function DualWeightDisplay({
  weightKg,
  primaryUnit,
  className,
}: DualWeightDisplayProps) {
  const secondaryUnit = getSecondaryUnit(primaryUnit);

  return (
    <div className={`rounded-xl bg-slate-800 p-4 ${className ?? ''}`.trim()}>
      <p className="text-3xl font-bold leading-tight">
        {formatWeight(weightKg, primaryUnit)} {primaryUnit}
      </p>
      <p className="mt-1 text-sm text-slate-400">
        {formatWeight(weightKg, secondaryUnit)} {secondaryUnit}
      </p>
    </div>
  );
}
