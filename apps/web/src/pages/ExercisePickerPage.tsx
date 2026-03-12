import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Exercise, ExerciseCategory } from '@lift-tracker/shared';
import { useExerciseStore } from '../store/useExerciseStore';

const CATEGORY_ORDER: ExerciseCategory[] = [
  'barbell',
  'dumbbell',
  'bodyweight',
  'machine',
  'cable',
  'other',
];

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  bodyweight: 'Bodyweight',
  machine: 'Machine',
  cable: 'Cable',
  other: 'Other',
};

const DEFAULT_EXPANDED_CATEGORIES: Record<ExerciseCategory, boolean> = {
  barbell: true,
  dumbbell: true,
  bodyweight: true,
  machine: true,
  cable: true,
  other: true,
};

function byNameAsc(a: Exercise, b: Exercise): number {
  return a.name.localeCompare(b.name);
}

export default function ExercisePickerPage() {
  const navigate = useNavigate();
  const exercises = useExerciseStore((state) => state.exercises);
  const getRecentExerciseIds = useExerciseStore((state) => state.getRecentExerciseIds);
  const addCustomExercise = useExerciseStore((state) => state.addCustomExercise);

  const [query, setQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(DEFAULT_EXPANDED_CATEGORIES);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customCategory, setCustomCategory] = useState<ExerciseCategory>('barbell');
  const [isSubmittingCustomExercise, setIsSubmittingCustomExercise] = useState(false);

  const hasSearchQuery = query.trim().length > 0;

  const filteredExercises = useMemo(() => {
    if (!hasSearchQuery) {
      return exercises;
    }

    const normalizedQuery = query.trim().toLowerCase();

    return exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(normalizedQuery),
    );
  }, [exercises, hasSearchQuery, query]);

  const exercisesByCategory = useMemo(() => {
    const grouped: Record<ExerciseCategory, Exercise[]> = {
      barbell: [],
      dumbbell: [],
      bodyweight: [],
      machine: [],
      cable: [],
      other: [],
    };

    for (const exercise of filteredExercises) {
      grouped[exercise.category].push(exercise);
    }

    for (const category of CATEGORY_ORDER) {
      grouped[category].sort(byNameAsc);
    }

    return grouped;
  }, [filteredExercises]);

  const visibleCategories = useMemo(() => {
    return CATEGORY_ORDER.filter((category) => exercisesByCategory[category].length > 0);
  }, [exercisesByCategory]);

  const recentExercises = useMemo(() => {
    if (hasSearchQuery) {
      return [];
    }

    const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

    return getRecentExerciseIds(5)
      .map((exerciseId) => exerciseById.get(exerciseId))
      .filter((exercise): exercise is Exercise => exercise !== undefined);
  }, [exercises, getRecentExerciseIds, hasSearchQuery]);

  function handleBack(): void {
    navigate(-1);
  }

  function handleExerciseSelect(exerciseId: string): void {
    navigate(`/log/${exerciseId}`);
  }

  function toggleCategory(category: ExerciseCategory): void {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }

  function handleCancelCustomExercise(): void {
    setCustomExerciseName('');
    setCustomCategory('barbell');
    setIsCreateFormOpen(false);
  }

  async function handleCreateCustomExercise(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedName = customExerciseName.trim();

    if (!trimmedName || isSubmittingCustomExercise) {
      return;
    }

    const newExerciseId = `custom-${uuidv4()}`;

    setIsSubmittingCustomExercise(true);

    try {
      await addCustomExercise({
        id: newExerciseId,
        name: trimmedName,
        category: customCategory,
        isCustom: true,
      });

      setCustomExerciseName('');
      setCustomCategory('barbell');
      setIsCreateFormOpen(false);
      navigate(`/log/${newExerciseId}`);
    } finally {
      setIsSubmittingCustomExercise(false);
    }
  }

  return (
    <div className="page-enter flex flex-col gap-4 pb-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-slate-800 text-xl text-white transition hover:bg-slate-700"
          aria-label="Go back"
        >
          ←
        </button>
        <h1 className="text-2xl font-semibold text-white">Choose Exercise</h1>
      </header>

      <section className="rounded-xl bg-slate-800 p-3">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search exercises..."
          className="min-h-12 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
        />
      </section>

      {!hasSearchQuery && recentExercises.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-300">Recent</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentExercises.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => handleExerciseSelect(exercise.id)}
                className="min-h-12 shrink-0 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                {exercise.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-300">
          {hasSearchQuery ? 'Search Results' : 'All Exercises'}
        </h2>

        {filteredExercises.length === 0 && (
          <p className="rounded-xl bg-slate-800 px-4 py-6 text-center text-slate-300">
            No exercises found.
          </p>
        )}

        {visibleCategories.map((category) => {
          const categoryExercises = exercisesByCategory[category];
          const isExpanded = expandedCategories[category];

          return (
            <div key={category} className="overflow-hidden rounded-xl bg-slate-800">
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-700/50"
              >
                <span className="font-medium text-white">
                  {CATEGORY_LABELS[category]} ({categoryExercises.length})
                </span>
                <span className="text-sm text-slate-300">{isExpanded ? '▾' : '▸'}</span>
              </button>

              {isExpanded && (
                <ul className="divide-y divide-slate-700">
                  {categoryExercises.map((exercise) => (
                    <li key={exercise.id}>
                      <button
                        type="button"
                        onClick={() => handleExerciseSelect(exercise.id)}
                        className="flex min-h-12 w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-slate-700/50"
                      >
                        <span className="text-white">{exercise.name}</span>
                        {exercise.isCustom && (
                          <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-xs text-indigo-200">
                            Custom
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <section className="mt-2 rounded-xl bg-slate-800 p-3">
        {!isCreateFormOpen && (
          <button
            type="button"
            onClick={() => setIsCreateFormOpen(true)}
            className="min-h-12 w-full rounded-lg bg-slate-700 px-4 py-3 text-left font-medium text-white transition hover:bg-slate-600"
          >
            + Create Custom Exercise
          </button>
        )}

        {isCreateFormOpen && (
          <form className="space-y-3" onSubmit={handleCreateCustomExercise}>
            <label className="block text-sm font-medium text-slate-300" htmlFor="custom-exercise-name">
              Exercise name
            </label>
            <input
              id="custom-exercise-name"
              type="text"
              value={customExerciseName}
              onChange={(event) => setCustomExerciseName(event.target.value)}
              placeholder="e.g., Safety Bar Squat"
              autoFocus
              className="min-h-12 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
            />

            <label className="block text-sm font-medium text-slate-300" htmlFor="custom-exercise-category">
              Category
            </label>
            <select
              id="custom-exercise-category"
              value={customCategory}
              onChange={(event) => setCustomCategory(event.target.value as ExerciseCategory)}
              className="min-h-12 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-white focus:border-indigo-400 focus:outline-none"
            >
              {CATEGORY_ORDER.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={customExerciseName.trim().length === 0 || isSubmittingCustomExercise}
                className="min-h-12 flex-1 rounded-lg bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingCustomExercise ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={handleCancelCustomExercise}
                className="min-h-12 flex-1 rounded-lg bg-slate-700 px-4 py-3 font-semibold text-white transition hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
