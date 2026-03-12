import type { AgeBracket, DetrainingPhase } from '../models/types';

export const DETRAINING_THRESHOLDS: Record<AgeBracket, { fresh: number; maintain: number; declining: number }> = {
  young:  { fresh: 14, maintain: 21, declining: 35 },
  middle: { fresh: 12, maintain: 17, declining: 28 },
  older:  { fresh: 10, maintain: 14, declining: 21 },
};

const PHASE_COLORS: Record<DetrainingPhase, string> = {
  fresh:     '#22c55e',
  maintain:  '#eab308',
  declining: '#f97316',
  decaying:  '#ef4444',
};

interface DetrainingResult {
  phase: DetrainingPhase;
  percent: number;
  color: string;
  message: string;
}

function formatMessage(daysSince: number, phase: DetrainingPhase): string {
  if (daysSince === 0) return 'Trained today';
  if (phase === 'fresh') return `Trained ${daysSince} day${daysSince === 1 ? '' : 's'} ago`;
  if (phase === 'maintain') return `Maintaining — ${daysSince} days`;
  if (phase === 'declining') return `Strength declining — ${daysSince} days`;
  return `Retrain soon — ${daysSince} days`;
}

export function getDetrainingPhase(daysSince: number, ageBracket: AgeBracket): DetrainingResult {
  const thresholds = DETRAINING_THRESHOLDS[ageBracket];
  const totalTimeline = thresholds.declining;

  let phase: DetrainingPhase;
  if (daysSince <= 0) {
    phase = 'fresh';
  } else if (daysSince <= thresholds.fresh) {
    phase = 'fresh';
  } else if (daysSince <= thresholds.maintain) {
    phase = 'maintain';
  } else if (daysSince <= thresholds.declining) {
    phase = 'declining';
  } else {
    phase = 'decaying';
  }

  const percent = Math.min(100, Math.max(0, Math.round((daysSince / totalTimeline) * 100)));

  return {
    phase,
    percent,
    color: PHASE_COLORS[phase],
    message: formatMessage(daysSince, phase),
  };
}
