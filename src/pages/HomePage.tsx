import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ExerciseCard from '../components/ExerciseCard';
import { DETRAINING_THRESHOLDS } from '../shared/calc/detraining';
import { APP_NAME } from '../shared/constants';
import type { Exercise, ExerciseEntry } from '../shared/models/types';
import { useExerciseStore } from '../store/useExerciseStore';
import { useSettingsStore } from '../store/useSettingsStore';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function getDaysSinceDate(isoDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / DAY_IN_MS));
}

interface LoggedExercise {
  exercise: Exercise;
  daysSince: number;
  lastEntry: ExerciseEntry;
  rollingBestOneRmKg: number | null;
}

const ROLLING_WINDOW_DAYS = 42;

export default function HomePage() {
  const exercises = useExerciseStore((state) => state.exercises);
  const entries = useExerciseStore((state) => state.entries);
  const { ageBracket, primaryUnit } = useSettingsStore((state) => state.settings);

  const [rollingWindowStartMs, setRollingWindowStartMs] = useState<number | null>(null);

  useEffect(() => {
    function updateRollingWindowStart(): void {
      setRollingWindowStartMs(Date.now() - ROLLING_WINDOW_DAYS * DAY_IN_MS);
    }

    updateRollingWindowStart();
    const intervalId = window.setInterval(updateRollingWindowStart, DAY_IN_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const loggedExercises = useMemo(() => {
    // Find the latest entry per exercise directly from entries
    const latestByExercise = new Map<string, ExerciseEntry>();
    const rollingBestByExercise = new Map<string, number>();

    for (const entry of entries) {
      const performedAtMs = new Date(entry.performedAt).getTime();

      const existing = latestByExercise.get(entry.exerciseId);
      if (!existing || performedAtMs > new Date(existing.performedAt).getTime()) {
        latestByExercise.set(entry.exerciseId, entry);
      }

      if (
        rollingWindowStartMs !== null &&
        performedAtMs >= rollingWindowStartMs &&
        entry.estimated1RM_kg !== null
      ) {
        const previousBest = rollingBestByExercise.get(entry.exerciseId);
        if (previousBest === undefined || entry.estimated1RM_kg > previousBest) {
          rollingBestByExercise.set(entry.exerciseId, entry.estimated1RM_kg);
        }
      }
    }

    return exercises
      .map((exercise) => {
        const lastEntry = latestByExercise.get(exercise.id);
        if (!lastEntry) return null;
        const daysSince = getDaysSinceDate(lastEntry.performedAt);
        const rollingBestOneRmKg = rollingBestByExercise.get(exercise.id) ?? null;
        return { exercise, daysSince, lastEntry, rollingBestOneRmKg };
      })
      .filter((value): value is LoggedExercise => value !== null)
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [exercises, entries, rollingWindowStartMs]);

  const freshThreshold = DETRAINING_THRESHOLDS[ageBracket].fresh;
  const trainSoon = loggedExercises.filter((item) => item.daysSince > freshThreshold);
  const recentlyTrained = loggedExercises.filter((item) => item.daysSince <= freshThreshold);

  return (
    <div className="page-enter space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
        <Link
          to="/settings"
          aria-label="Open settings"
          className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-slate-800 text-xl transition hover:bg-slate-700"
        >
          ⚙️
        </Link>
      </header>

      <Link
        to="/pick"
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-400 active:bg-indigo-500/90"
      >
        Log Exercise
      </Link>

      {entries.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center text-slate-300">
          <p className="max-w-xs text-lg font-medium">Log your first exercise to get started</p>
          <p className="mt-2 text-3xl text-indigo-400" aria-hidden="true">
            ↑
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Train Soon</h2>
            {trainSoon.length === 0 ? (
              <p className="rounded-xl bg-slate-800 p-4 text-sm text-slate-400">Nothing urgent right now.</p>
            ) : (
              <div className="space-y-3">
                {trainSoon.map((item) => (
                  <ExerciseCard
                    key={item.exercise.id}
                    exercise={item.exercise}
                    daysSince={item.daysSince}
                    lastEntry={item.lastEntry}
                    rollingBestOneRmKg={item.rollingBestOneRmKg}
                    ageBracket={ageBracket}
                    primaryUnit={primaryUnit}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Recently Trained
            </h2>
            {recentlyTrained.length === 0 ? (
              <p className="rounded-xl bg-slate-800 p-4 text-sm text-slate-400">No recent exercises yet.</p>
            ) : (
              <div className="space-y-3">
                {recentlyTrained.map((item) => (
                  <ExerciseCard
                    key={item.exercise.id}
                    exercise={item.exercise}
                    daysSince={item.daysSince}
                    lastEntry={item.lastEntry}
                    rollingBestOneRmKg={item.rollingBestOneRmKg}
                    ageBracket={ageBracket}
                    primaryUnit={primaryUnit}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
