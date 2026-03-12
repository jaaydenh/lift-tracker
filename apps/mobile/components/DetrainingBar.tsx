import { Text, View } from 'react-native';
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
    <View className="gap-1.5">
      <View className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
        <View
          className={`h-full rounded-full ${PHASE_BAR_COLORS[phase]}`}
          style={{ width: `${percent}%` }}
        />
      </View>
      <Text className="text-xs text-slate-400">{message}</Text>
    </View>
  );
}
