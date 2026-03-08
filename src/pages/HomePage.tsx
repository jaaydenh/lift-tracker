import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import ExerciseCard from '../components/ExerciseCard';
import { DETRAINING_THRESHOLDS } from '../shared/calc/detraining';
import { APP_NAME } from '../shared/constants';
import type { Exercise, ExerciseEntry } from '../shared/models/types';
import { useExerciseStore } from '../store/useExerciseStore';
import { useSettingsStore } from '../store/useSettingsStore';

interface LoggedExercise {
  exercise: Exercise;
  daysSince: number;
  lastEntry: ExerciseEntry;
}

export default function HomePage() {
  const exercises = useExerciseStore((state) => state.exercises);
  const entries = useExerciseStore((state) => state.entries);
  const getLatestEntry = useExerciseStore((state) => state.getLatestEntry);
  const getDaysSinceLastEntry = useExerciseStore((state) => state.getDaysSinceLastEntry);
  const { ageBracket, primaryUnit } = useSettingsStore((state) => state.settings);

  const loggedExercises = useMemo(() => {
    return exercises
      .map((exercise) => {
        const lastEntry = getLatestEntry(exercise.id);
        const daysSince = getDaysSinceLastEntry(exercise.id);

        if (!lastEntry || daysSince === null) {
          return null;
        }

        return {
          exercise,
          daysSince,
          lastEntry,
        };
      })
      .filter((value): value is LoggedExercise => value !== null)
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [entries, exercises, getDaysSinceLastEntry, getLatestEntry]);

  const freshThreshold = DETRAINING_THRESHOLDS[ageBracket].fresh;
  const trainSoon = loggedExercises.filter((item) => item.daysSince > freshThreshold);
  const recentlyTrained = loggedExercises.filter((item) => item.daysSince <= freshThreshold);

  return (
    <div className="space-y-6 pb-24">
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
