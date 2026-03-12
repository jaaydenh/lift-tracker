import { useLocalSearchParams } from 'expo-router';
import ExerciseSessionEditor from '../../components/ExerciseSessionEditor';

export default function LogExerciseScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string }>();

  return <ExerciseSessionEditor mode="create" exerciseId={exerciseId} />;
}
