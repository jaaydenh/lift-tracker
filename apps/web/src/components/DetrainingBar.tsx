import { getDetrainingPhase } from '@lift-tracker/shared';
import type { AgeBracket, DetrainingPhase } from '@lift-tracker/shared';

interface DetrainingBarProps {
  daysSince: number;
  ageBracket: AgeBracket;
}

const PHASE_BAR_COLORS: Record<DetrainingPhase, string> = {
  fresh: 'bg-green-500',
  maintain: 'bg-yellow-500',
  declining: 'bg-orange-500',
  decaying: 'bg-red-500',
};

export default function DetrainingBar({ daysSince, ageBracket }: DetrainingBarProps) {
  const { phase, percent, message } = getDetrainingPhase(daysSince, ageBracket);

  return (
    <div className="space-y-1.5">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${PHASE_BAR_COLORS[phase]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">{message}</p>
    </div>
  );
}
