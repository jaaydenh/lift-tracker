import { useLocalSearchParams } from 'expo-router';
import ExerciseSessionEditor from '../../components/ExerciseSessionEditor';

export default function EditEntryScreen() {
  const { entryId } = useLocalSearchParams<{ entryId?: string }>();

  return <ExerciseSessionEditor mode="edit" entryId={entryId} />;
}
