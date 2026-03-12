import AuthGate from '../auth/AuthGate';
import Layout from '../components/Layout';
import OnboardingPage from '../pages/OnboardingPage';
import { useSettingsStore } from '../store/useSettingsStore';
import Providers from './Providers';
import Router from './Router';

function AppContent() {
  const hasCompletedOnboarding = useSettingsStore(
    (state) => state.settings.hasCompletedOnboarding,
  );

  if (!hasCompletedOnboarding) {
    return <OnboardingPage />;
  }

  return (
    <Layout>
      <Router />
    </Layout>
  );
}

export default function App() {
  return (
    <Providers>
      <AuthGate>
        <AppContent />
      </AuthGate>
    </Providers>
  );
}
