import { useMemo } from 'react';
import { best1RMFromSets } from '../shared/calc/oneRepMax';
import { useExerciseStore } from '../store/useExerciseStore';

interface OneRMHistoryPoint {
  date: string;
  oneRM: number;
}

interface Use1RMResult {
  current1RM: number | null;
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

  const current1RM = useMemo(() => {
    const latestEntry = entries[0];

    if (!latestEntry) {
      return null;
    }

    return best1RMFromSets(latestEntry.sets);
  }, [entries]);

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
    best1RM,
    history,
  };
}
