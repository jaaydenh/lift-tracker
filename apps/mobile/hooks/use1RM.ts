import { useEffect, useMemo, useState } from 'react';
import { best1RMFromSets, best1RMFromSetsDetailed } from '@lift-tracker/shared';
import { useExerciseStore } from '../store/useExerciseStore';

interface OneRMHistoryPoint {
  date: string;
  oneRM: number;
}

interface Use1RMResult {
  current1RM: number | null;
  currentSourceReps: number | null;
  rollingBest1RM: number | null;
  best1RM: number | null;
  history: OneRMHistoryPoint[];
}

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const ROLLING_WINDOW_DAYS = 42;

interface HistoryCandidate {
  date: string;
  oneRM: number | null;
}

function isHistoryPoint(candidate: HistoryCandidate): candidate is OneRMHistoryPoint {
  return candidate.oneRM !== null;
}

function sortByDateAsc(a: OneRMHistoryPoint, b: OneRMHistoryPoint): number {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function sortByPerformedAtDesc(a: { performedAt: string }, b: { performedAt: string }): number {
  return new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime();
}

export function use1RM(exerciseId: string): Use1RMResult {
  const allEntries = useExerciseStore((state) => state.entries);
  const entries = useMemo(
    () =>
      allEntries
        .filter((entry) => entry.exerciseId === exerciseId)
        .sort(sortByPerformedAtDesc),
    [allEntries, exerciseId],
  );

  const [rollingWindowStartMs, setRollingWindowStartMs] = useState<number | null>(null);

  useEffect(() => {
    function updateRollingWindowStart(): void {
      setRollingWindowStartMs(Date.now() - ROLLING_WINDOW_DAYS * DAY_IN_MS);
    }

    updateRollingWindowStart();
    const intervalId = setInterval(updateRollingWindowStart, DAY_IN_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const current1RMData = useMemo(() => {
    const latestEntry = entries[0];

    if (!latestEntry) {
      return null;
    }

    return best1RMFromSetsDetailed(latestEntry.sets);
  }, [entries]);

  const current1RM = current1RMData?.value ?? null;
  const currentSourceReps = current1RMData?.sourceReps ?? null;

  const history = useMemo(() => {
    return entries
      .map((entry) => ({
        date: entry.performedAt,
        oneRM: best1RMFromSets(entry.sets),
      }))
      .filter(isHistoryPoint)
      .sort(sortByDateAsc);
  }, [entries]);

  const rollingBest1RM = useMemo(() => {
    if (rollingWindowStartMs === null) {
      return null;
    }

    const recentPoints = history.filter(
      (point) => new Date(point.date).getTime() >= rollingWindowStartMs,
    );

    if (recentPoints.length === 0) {
      return null;
    }

    return recentPoints.reduce((best, point) => {
      return point.oneRM > best ? point.oneRM : best;
    }, recentPoints[0].oneRM);
  }, [history, rollingWindowStartMs]);

  const best1RM = useMemo(() => {
    if (history.length === 0) {
      return null;
    }

    return history.reduce((best, point) => {
      return point.oneRM > best ? point.oneRM : best;
    }, history[0].oneRM);
  }, [history]);

  return {
    current1RM,
    currentSourceReps,
    rollingBest1RM,
    best1RM,
    history,
  };
}
