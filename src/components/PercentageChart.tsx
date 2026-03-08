import { percentageTable } from '../shared/calc/oneRepMax';
import { formatWeight } from '../shared/calc/units';
import type { WeightUnit } from '../shared/models/types';

interface PercentageChartProps {
  oneRM: number;
  primaryUnit: WeightUnit;
  sourceReps?: number;
}

export default function PercentageChart({ oneRM, primaryUnit, sourceReps }: PercentageChartProps) {
  const rows = percentageTable(oneRM);
  const showAccuracyWarning = sourceReps !== undefined && sourceReps > 10;

  return (
    <details className="rounded-xl bg-slate-800 px-3 py-2">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-semibold text-slate-100">
        <span>1RM % Chart ({formatWeight(oneRM, primaryUnit)} {primaryUnit})</span>
        <span className="text-xs text-slate-400">Tap to expand</span>
      </summary>

      {showAccuracyWarning && (
        <p className="text-xs text-yellow-400 bg-yellow-400/10 rounded-lg px-3 py-2 mt-2 mb-1">
          ⚠️ Estimated from a {sourceReps}-rep set — accuracy decreases above 10 reps
        </p>
      )}

      <div className="mt-2 overflow-hidden rounded-lg border border-slate-700">
        <table className="w-full text-sm font-mono">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">%</th>
              <th className="px-3 py-2 text-right">kg</th>
              <th className="px-3 py-2 text-right">lbs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.percent} className="border-t border-slate-700/60">
                <td className="px-3 py-2 text-left text-slate-100">{row.percent}%</td>
                <td className="px-3 py-2 text-right text-slate-200">{formatWeight(row.kg, 'kg')}</td>
                <td className="px-3 py-2 text-right text-slate-200">{formatWeight(row.kg, 'lbs')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
