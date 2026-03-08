import { useMemo } from 'react';
import { best1RMFromSets, best1RMFromSetsDetailed } from '../shared/calc/oneRepMax';
import { useExerciseStore } from '../store/useExerciseStore';

interface OneRMHistoryPoint {
  date: string;
  oneRM: number;
}

interface Use1RMResult {
  current1RM: number | null;
  currentSourceReps: number | null;
  best1RM: number | null;
  history: OneRMHistoryPoint[];
}

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
    best1RM,
    history,
  };
}
