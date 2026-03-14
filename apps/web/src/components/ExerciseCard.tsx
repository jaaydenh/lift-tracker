import { Link } from 'react-router-dom';
import { formatWeight } from '@lift-tracker/shared';
import type { AgeBracket, Exercise, ExerciseEntry, ExerciseSet, WeightUnit } from '@lift-tracker/shared';
import DetrainingBar from './DetrainingBar';

interface ExerciseCardProps {
  exercise: Exercise;
  daysSince: number | null;
  lastEntry: ExerciseEntry | null;
  rollingBestOneRmKg: number | null;
  ageBracket: AgeBracket;
  primaryUnit: WeightUnit;
}

function formatDaysAgo(daysSince: number | null): string {
  if (daysSince === null) {
    return 'No recent sessions';
  }

  if (daysSince === 0) {
    return 'today';
  }

  if (daysSince === 1) {
    return '1d ago';
  }

  return `${daysSince}d ago`;
}

function getBestSet(entry: ExerciseEntry): ExerciseSet | null {
  const workingSets = entry.sets.filter((set) => !set.isWarmup);

  if (workingSets.length === 0) {
    return null;
  }

  return [...workingSets].sort((a, b) => {
    const aWeight = a.weightKg ?? -1;
    const bWeight = b.weightKg ?? -1;

    if (bWeight !== aWeight) {
      return bWeight - aWeight;
    }

    return b.reps - a.reps;
  })[0];
}

export default function ExerciseCard({
  exercise,
  daysSince,
  lastEntry,
  rollingBestOneRmKg,
  ageBracket,
  primaryUnit,
}: ExerciseCardProps) {
  const secondaryUnit: WeightUnit = primaryUnit === 'kg' ? 'lbs' : 'kg';

  if (!lastEntry) {
    return (
      <Link
        to={`/log/${exercise.id}`}
        className="block min-h-12 rounded-xl bg-slate-800 p-4 transition hover:bg-slate-700/90 active:scale-[0.99]"
      >
        <h3 className="text-lg font-semibold text-white">{exercise.name}</h3>
        <p className="mt-2 text-sm text-slate-400">No sessions yet</p>
      </Link>
    );
  }

  const isBodyweight = exercise.category === 'bodyweight';
  const bestSet = getBestSet(lastEntry);
  const bestSetAddedWeightKg =
    bestSet && bestSet.weightKg !== null && bestSet.weightKg > 0 ? bestSet.weightKg : null;

  const bestSetSummary = bestSet
    ? isBodyweight
      ? bestSetAddedWeightKg === null
        ? `BW × ${bestSet.reps}`
        : `BW + ${formatWeight(bestSetAddedWeightKg, primaryUnit)}${primaryUnit} × ${bestSet.reps}`
      : bestSet.weightKg === null
        ? `Bodyweight × ${bestSet.reps}`
        : `${formatWeight(bestSet.weightKg, primaryUnit)}${primaryUnit} × ${bestSet.reps}`
    : null;

  const dualUnitSummary =
    bestSet && bestSet.weightKg !== null
      ? isBodyweight
        ? bestSetAddedWeightKg === null
          ? null
          : `BW + ${formatWeight(bestSetAddedWeightKg, secondaryUnit)}${secondaryUnit}`
        : `${formatWeight(bestSet.weightKg, secondaryUnit)}${secondaryUnit}`
      : null;

  return (
    <Link
      to={`/history/${exercise.id}`}
      className="block min-h-12 rounded-xl bg-slate-800 p-4 transition hover:bg-slate-700/90 active:scale-[0.99]"
    >
      <h3 className="text-lg font-semibold text-white">{exercise.name}</h3>

      <p className="mt-1 text-sm text-slate-300">
        {bestSetSummary ?? 'Session logged'} — {formatDaysAgo(daysSince)}
      </p>

      {dualUnitSummary && <p className="text-xs text-slate-400">{dualUnitSummary}</p>}

      {rollingBestOneRmKg !== null && (
        <p className="text-xs text-slate-400">
          Estimated 1RM: {formatWeight(rollingBestOneRmKg, primaryUnit)}{primaryUnit} (
          {formatWeight(rollingBestOneRmKg, secondaryUnit)}{secondaryUnit})
        </p>
      )}

      {daysSince !== null && (
        <div className="mt-3">
          <DetrainingBar daysSince={daysSince} ageBracket={ageBracket} />
        </div>
      )}
    </Link>
  );
}
