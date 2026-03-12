import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DETRAINING_THRESHOLDS } from '@lift-tracker/shared';
import type { AgeBracket } from '@lift-tracker/shared';

const AGE_LABELS: Record<AgeBracket, string> = {
  young: 'Under 40',
  middle: '40–59',
  older: '60+',
};

export default function HelpPage() {
  const navigate = useNavigate();

  const detrainingRows = useMemo(() => {
    const young = DETRAINING_THRESHOLDS.young;
    const middle = DETRAINING_THRESHOLDS.middle;
    const older = DETRAINING_THRESHOLDS.older;

    return [
      {
        phase: 'Fresh',
        phaseClassName: 'text-emerald-300',
        youngRange: `0–${young.fresh}d`,
        middleRange: `0–${middle.fresh}d`,
        olderRange: `0–${older.fresh}d`,
      },
      {
        phase: 'Maintain',
        phaseClassName: 'text-yellow-300',
        youngRange: `${young.fresh + 1}–${young.maintain}d`,
        middleRange: `${middle.fresh + 1}–${middle.maintain}d`,
        olderRange: `${older.fresh + 1}–${older.maintain}d`,
      },
      {
        phase: 'Declining',
        phaseClassName: 'text-orange-300',
        youngRange: `${young.maintain + 1}–${young.declining}d`,
        middleRange: `${middle.maintain + 1}–${middle.declining}d`,
        olderRange: `${older.maintain + 1}–${older.declining}d`,
      },
      {
        phase: 'Decaying',
        phaseClassName: 'text-rose-300',
        youngRange: `>${young.declining}d`,
        middleRange: `>${middle.declining}d`,
        olderRange: `>${older.declining}d`,
      },
    ];
  }, []);

  return (
    <div className="page-enter space-y-6 pb-24">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-slate-800 text-xl transition hover:bg-slate-700"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-white">How it works</h1>
      </header>

      <section className="rounded-xl bg-slate-800 p-4 space-y-3">
        <h2 className="text-lg font-semibold text-white">
          How the detraining model works (and why it matters)
        </h2>
        <p className="text-slate-300">
          Strength is specific to each lift and fades when a movement is not trained for too long.
          LiftTracker tracks <span className="font-semibold">days since your last session per exercise</span>{' '}
          and assigns a phase to help you decide what to train next.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-200">
          <li>
            <span className="font-semibold text-emerald-300">Fresh</span>: you recently trained this lift.
          </li>
          <li>
            <span className="font-semibold text-yellow-300">Maintain</span>: still in a good range, but due soon.
          </li>
          <li>
            <span className="font-semibold text-orange-300">Declining</span>: performance may start dropping.
          </li>
          <li>
            <span className="font-semibold text-rose-300">Decaying</span>: highest priority to retrain.
          </li>
        </ul>
        <p className="text-slate-300">
          This matters because it helps you allocate limited training time to lifts that are at greatest risk
          of detraining, instead of guessing or only repeating favorites.
        </p>
      </section>

      <section className="rounded-xl bg-slate-800 p-4 space-y-3">
        <h2 className="text-lg font-semibold text-white">The "Strength Decay" Timer</h2>
        <p className="text-slate-300">
          The table below shows age-adjusted phase windows. Older age brackets use shorter windows, so
          exercises move into Train Soon earlier and help keep strength from slipping.
        </p>

        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/70 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">Phase</th>
                <th className="px-3 py-2 text-left">{AGE_LABELS.young}</th>
                <th className="px-3 py-2 text-left">{AGE_LABELS.middle}</th>
                <th className="px-3 py-2 text-left">{AGE_LABELS.older}</th>
              </tr>
            </thead>
            <tbody>
              {detrainingRows.map((row) => (
                <tr key={row.phase} className="border-t border-slate-700/60 text-slate-100">
                  <td className={`px-3 py-2 font-semibold ${row.phaseClassName}`}>{row.phase}</td>
                  <td className="px-3 py-2">{row.youngRange}</td>
                  <td className="px-3 py-2">{row.middleRange}</td>
                  <td className="px-3 py-2">{row.olderRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400">
          Tip: These ranges are training guidance, not a medical diagnosis. Use them to prioritize what to train next.
        </p>
      </section>
    </div>
  );
}
