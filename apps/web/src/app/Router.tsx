import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthCallbackPage from '../pages/AuthCallbackPage';
import ExerciseHistoryPage from '../pages/ExerciseHistoryPage';
import ExercisePickerPage from '../pages/ExercisePickerPage';
import HelpPage from '../pages/HelpPage';
import HomePage from '../pages/HomePage';
import LogExercisePage from '../pages/LogExercisePage';
import SettingsPage from '../pages/SettingsPage';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/log/:exerciseId" element={<LogExercisePage />} />
        <Route path="/edit/:entryId" element={<LogExercisePage />} />
        <Route path="/pick" element={<ExercisePickerPage />} />
        <Route path="/history/:exerciseId" element={<ExerciseHistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Routes>
    </BrowserRouter>
  );
}
