import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
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

export default function PickExerciseScreen() {
  const router = useRouter();
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

    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(normalizedQuery));
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

  function handleExerciseSelect(exerciseId: string): void {
    router.push(`/log/${exerciseId}`);
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

  async function handleCreateCustomExercise(): Promise<void> {
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
      router.push(`/log/${newExerciseId}`);
    } finally {
      setIsSubmittingCustomExercise(false);
    }
  }

  const isAddDisabled = customExerciseName.trim().length === 0 || isSubmittingCustomExercise;

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-4">
          <View className="rounded-xl bg-slate-800 p-3">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search exercises..."
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              className="min-h-12 rounded-lg border border-slate-700 bg-slate-900 px-3 text-white"
            />
          </View>

          {!hasSearchQuery && recentExercises.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-medium uppercase tracking-wide text-slate-300">Recent</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row">
                  {recentExercises.map((exercise, index) => (
                    <Pressable
                      key={exercise.id}
                      onPress={() => handleExerciseSelect(exercise.id)}
                      className={`min-h-12 rounded-full bg-slate-800 px-4 py-3 ${
                        index < recentExercises.length - 1 ? 'mr-2' : ''
                      }`}
                    >
                      <Text className="text-sm font-medium text-white">{exercise.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View className="gap-3">
            <Text className="text-sm font-medium uppercase tracking-wide text-slate-300">
              {hasSearchQuery ? 'Search Results' : 'All Exercises'}
            </Text>

            {filteredExercises.length === 0 && (
              <View className="rounded-xl bg-slate-800 px-4 py-6">
                <Text className="text-center text-slate-300">No exercises found.</Text>
              </View>
            )}

            {visibleCategories.map((category) => {
              const categoryExercises = exercisesByCategory[category];
              const isExpanded = expandedCategories[category];

              return (
                <View key={category} className="overflow-hidden rounded-xl bg-slate-800">
                  <Pressable
                    onPress={() => toggleCategory(category)}
                    className="flex-row items-center justify-between px-4 py-3"
                  >
                    <Text className="font-medium text-white">
                      {CATEGORY_LABELS[category]} ({categoryExercises.length})
                    </Text>
                    <Text className="text-sm text-slate-300">{isExpanded ? '▾' : '▸'}</Text>
                  </Pressable>

                  {isExpanded &&
                    categoryExercises.map((exercise, index) => (
                      <Pressable
                        key={exercise.id}
                        onPress={() => handleExerciseSelect(exercise.id)}
                        className={`flex-row items-center justify-between px-4 py-3 ${
                          index > 0 ? 'border-t border-slate-700' : ''
                        }`}
                      >
                        <Text className="text-white">{exercise.name}</Text>
                        {exercise.isCustom && (
                          <View className="rounded-full bg-indigo-500/20 px-2 py-1">
                            <Text className="text-xs text-indigo-200">Custom</Text>
                          </View>
                        )}
                      </Pressable>
                    ))}
                </View>
              );
            })}
          </View>

          <View className="mt-1 rounded-xl bg-slate-800 p-3">
            {!isCreateFormOpen && (
              <Pressable
                onPress={() => setIsCreateFormOpen(true)}
                className="min-h-12 items-start justify-center rounded-lg bg-slate-700 px-4 py-3"
              >
                <Text className="font-medium text-white">+ Create Custom Exercise</Text>
              </Pressable>
            )}

            {isCreateFormOpen && (
              <View className="gap-3">
                <Text className="text-sm font-medium text-slate-300">Exercise name</Text>
                <TextInput
                  value={customExerciseName}
                  onChangeText={setCustomExerciseName}
                  placeholder="e.g., Safety Bar Squat"
                  placeholderTextColor="#94a3b8"
                  autoFocus
                  className="min-h-12 rounded-lg border border-slate-700 bg-slate-900 px-3 text-white"
                />

                <Text className="text-sm font-medium text-slate-300">Category</Text>
                <View className="flex-row flex-wrap">
                  {CATEGORY_ORDER.map((category, index) => {
                    const isSelected = customCategory === category;

                    return (
                      <Pressable
                        key={category}
                        onPress={() => setCustomCategory(category)}
                        className={`mb-2 rounded-full border px-3 py-2 ${
                          index < CATEGORY_ORDER.length - 1 ? 'mr-2' : ''
                        } ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-500/20'
                            : 'border-slate-600 bg-slate-900'
                        }`}
                      >
                        <Text className={isSelected ? 'text-indigo-100' : 'text-slate-200'}>
                          {CATEGORY_LABELS[category]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View className="flex-row">
                  <Pressable
                    onPress={() => {
                      void handleCreateCustomExercise();
                    }}
                    disabled={isAddDisabled}
                    className={`mr-2 flex-1 items-center rounded-lg px-4 py-3 ${
                      isAddDisabled ? 'bg-indigo-500/60' : 'bg-indigo-500'
                    }`}
                  >
                    <Text className="font-semibold text-white">
                      {isSubmittingCustomExercise ? 'Adding...' : 'Add'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCancelCustomExercise}
                    className="flex-1 items-center rounded-lg bg-slate-700 px-4 py-3"
                  >
                    <Text className="font-semibold text-white">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
