import { useMemo } from 'react';
import { getDetrainingPhase } from '../shared/calc/detraining';
import type { DetrainingPhase } from '../shared/models/types';
import { useExerciseStore } from '../store/useExerciseStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function useDetrainingStatus(exerciseId: string): {
  daysSince: number | null;
  phase: DetrainingPhase | null;
  percent: number;
  color: string;
  message: string;
} {
  const daysSince = useExerciseStore((state) => state.getDaysSinceLastEntry(exerciseId));
  const ageBracket = useSettingsStore((state) => state.settings.ageBracket);

  return useMemo(() => {
    if (daysSince === null) {
      return {
        daysSince: null,
        phase: null,
        percent: 0,
        color: '#334155',
        message: 'No sessions yet',
      };
    }

    const result = getDetrainingPhase(daysSince, ageBracket);

    return {
      daysSince,
      phase: result.phase,
      percent: result.percent,
      color: result.color,
      message: result.message,
    };
  }, [ageBracket, daysSince]);
}
