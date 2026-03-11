import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { use1RM } from '../hooks/use1RM';
import { best1RMFromSetsDetailed } from '../shared/calc/oneRepMax';
import { formatWeight } from '../shared/calc/units';
import type { ExerciseSet, WeightUnit } from '../shared/models/types';
import { useSettingsStore } from '../store/useSettingsStore';
import { useExerciseStore } from '../store/useExerciseStore';

const CHART_MAX_POINTS = 20;
const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 100;
const X_PADDING = 8;
const Y_PADDING = 8;

interface TrendPoint {
  date: string;
  oneRM: number;
}

interface OneRMTrendChartProps {
  points: TrendPoint[];
  unit: WeightUnit;
}

function formatSessionDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatAxisDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatWeightWithUnit(valueKg: number, unit: WeightUnit): string {
  return `${formatWeight(valueKg, unit)} ${unit}`;
}

function formatDualWeight(valueKg: number, primaryUnit: WeightUnit): string {
  const secondaryUnit: WeightUnit = primaryUnit === 'kg' ? 'lbs' : 'kg';

  return `${formatWeightWithUnit(valueKg, primaryUnit)} (${formatWeightWithUnit(valueKg, secondaryUnit)})`;
}

function formatSetLine(set: ExerciseSet, primaryUnit: WeightUnit): string {
  if (set.weightKg === null) {
    return `Bodyweight × ${set.reps}${set.isWarmup ? ' (warm-up)' : ''}`;
  }

  return `${formatDualWeight(set.weightKg, primaryUnit)} × ${set.reps}${set.isWarmup ? ' (warm-up)' : ''}`;
}

function sortEntriesByPerformedAtDesc(a: { performedAt: string }, b: { performedAt: string }): number {
  return new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime();
}

function OneRMTrendChart({ points, unit }: OneRMTrendChartProps) {
  if (points.length < 2) {
    return (
      <section className="rounded-xl bg-slate-800 p-4">
        <h2 className="text-lg font-semibold text-white">1RM Trend</h2>
        <p className="mt-4 text-slate-300">Not enough data for chart</p>
      </section>
    );
  }

  const values = points.map((point) => point.oneRM);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const chartHeight = VIEWBOX_HEIGHT - Y_PADDING * 2;
  const chartWidth = VIEWBOX_WIDTH - X_PADDING * 2;

  const chartPoints = points.map((point, index) => {
    const x =
      points.length === 1
        ? VIEWBOX_WIDTH / 2
        : X_PADDING + (index / (points.length - 1)) * chartWidth;

    const y =
      maxValue === minValue
        ? VIEWBOX_HEIGHT / 2
        : Y_PADDING + ((maxValue - point.oneRM) / (maxValue - minValue)) * chartHeight;

    return { x, y };
  });

  const polylinePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const firstDate = points[0]?.date;
  const lastDate = points[points.length - 1]?.date;

  return (
    <section className="rounded-xl bg-slate-800 p-4">
      <h2 className="text-lg font-semibold text-white">1RM Trend</h2>

      <div className="mt-4 flex items-stretch gap-3">
        <div className="flex shrink-0 flex-col justify-between text-xs text-slate-300">
          <span>{formatWeightWithUnit(maxValue, unit)}</span>
          <span>{formatWeightWithUnit(minValue, unit)}</span>
        </div>

        <svg
          className="h-48 w-full"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          role="img"
          aria-label="Estimated 1RM trend"
        >
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="rgb(129 140 248)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chartPoints.map((point, index) => (
            <circle
              key={`${points[index]?.date}-${points[index]?.oneRM}`}
              cx={point.x}
              cy={point.y}
              r="2"
              fill="rgb(224 231 255)"
              stroke="rgb(67 56 202)"
              strokeWidth="0.5"
            />
          ))}
        </svg>
      </div>

      <div className="mt-2 flex justify-between text-xs text-slate-300">
        <span>{firstDate ? formatAxisDate(firstDate) : ''}</span>
        <span>{lastDate ? formatAxisDate(lastDate) : ''}</span>
      </div>
    </section>
  );
}

export default function ExerciseHistoryPage() {
  const navigate = useNavigate();
  const { exerciseId } = useParams();
  const primaryUnit = useSettingsStore((state) => state.settings.primaryUnit);

  const safeExerciseId = exerciseId ?? '';

  const exercise = useExerciseStore((state) =>
    state.exercises.find((item) => item.id === safeExerciseId),
  );
  const deleteEntry = useExerciseStore((state) => state.deleteEntry);
  const allEntries = useExerciseStore((state) => state.entries);
  const entries = useMemo(
    () =>
      allEntries
        .filter((entry) => entry.exerciseId === safeExerciseId)
        .sort(sortEntriesByPerformedAtDesc),
    [allEntries, safeExerciseId],
  );
  const { current1RM, rollingBest1RM, best1RM, history } = use1RM(safeExerciseId);

  const chartPoints = useMemo(() => history.slice(-CHART_MAX_POINTS), [history]);

  function handleBack(): void {
    navigate(-1);
  }

  function handleDeleteEntry(entryId: string): void {
    if (!window.confirm('Delete this entry?')) {
      return;
    }

    void deleteEntry(entryId);
  }

  return (
    <div className="page-enter flex flex-col gap-4 pb-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-slate-800 text-xl text-white transition hover:bg-slate-700"
          aria-label="Go back"
        >
          ←
        </button>
        <h1 className="text-2xl font-semibold text-white">{exercise?.name ?? 'Exercise History'}</h1>
      </header>

      {!exercise && (
        <section className="rounded-xl bg-slate-800 p-6 text-center text-slate-300">
          Exercise not found.
        </section>
      )}

      {exercise && entries.length === 0 && (
        <section className="rounded-xl bg-slate-800 p-10 text-center text-slate-300">
          No sessions logged yet
        </section>
      )}

      {exercise && entries.length > 0 && (
        <>
          <section className="rounded-xl bg-slate-800 p-4">
            <h2 className="text-lg font-semibold text-white">1RM Summary</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-700/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-300">Current</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {current1RM === null ? '—' : formatWeightWithUnit(current1RM, primaryUnit)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-700/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-300">Rolling Best (6w)</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {rollingBest1RM === null ? '—' : formatWeightWithUnit(rollingBest1RM, primaryUnit)}
                </p>
              </div>
              <div className="col-span-2 rounded-lg bg-slate-700/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-300">Best (All-time)</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {best1RM === null ? '—' : formatWeightWithUnit(best1RM, primaryUnit)}
                </p>
              </div>
            </div>
          </section>

          <OneRMTrendChart points={chartPoints} unit={primaryUnit} />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Past Sessions</h2>

            {entries.map((entry) => {
              const session1RMData = best1RMFromSetsDetailed(entry.sets);
              const sessionOneRM = session1RMData?.value ?? null;
              const sessionSourceReps = session1RMData?.sourceReps;

              return (
                <article key={entry.id} className="relative rounded-xl bg-slate-800 p-4">
                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/edit/${entry.id}`)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-slate-400 transition hover:bg-indigo-600 hover:text-white"
                      aria-label={`Edit session from ${formatSessionDate(entry.performedAt)}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-slate-400 transition hover:bg-red-600 hover:text-white"
                      aria-label={`Delete session from ${formatSessionDate(entry.performedAt)}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 className="pr-24 text-base font-semibold text-white">
                    {formatSessionDate(entry.performedAt)}
                  </h3>

                  <ul className="mt-3 space-y-2 text-sm text-slate-100">
                    {entry.sets.map((set) => (
                      <li
                        key={set.id}
                        className="flex min-h-12 items-center rounded-lg bg-slate-700/40 px-3 py-2"
                      >
                        {formatSetLine(set, primaryUnit)}
                      </li>
                    ))}
                  </ul>

                  {sessionOneRM !== null && (
                    <>
                      <p className="mt-3 text-sm font-medium text-indigo-200">
                        Estimated 1RM: {formatDualWeight(sessionOneRM, primaryUnit)}
                      </p>
                      {sessionSourceReps !== undefined && sessionSourceReps > 10 && (
                        <p className="mt-1 text-xs text-yellow-400">
                          ⚠️ Est. from {sessionSourceReps}-rep set
                        </p>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
