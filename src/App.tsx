import { AppProvider, useApp } from '@/context/AppContext';
import BottomNav from '@/components/BottomNav';
import DesktopNav from '@/components/DesktopNav';
import WelcomeScreen from '@/screens/WelcomeScreen';
import SignInScreen from '@/screens/SignInScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import EmailVerifyScreen from '@/screens/EmailVerifyScreen';
import ForgotPasswordScreen from '@/screens/ForgotPasswordScreen';
import ResetPasswordScreen from '@/screens/ResetPasswordScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import HomeScreen from '@/screens/HomeScreen';
import VehiclesScreen from '@/screens/VehiclesScreen';
import VehicleDetailScreen from '@/screens/VehicleDetailScreen';
import IncidentsScreen from '@/screens/IncidentsScreen';
import IncidentDetailScreen from '@/screens/IncidentDetailScreen';
import NewIncidentScreen from '@/screens/NewIncidentScreen';
import CoverageScreen from '@/screens/CoverageScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ServiceFeedbackScreen from '@/screens/ServiceFeedbackScreen';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

function AppRouter() {
  const { screen, isAuthenticated, hasCompletedOnboarding } = useApp();

  // Auth screens
  if (!isAuthenticated) {
    switch (screen) {
      case 'sign-in': return <SignInScreen />;
      case 'register': return <RegisterScreen />;
      case 'email-verify': return <EmailVerifyScreen />;
      case 'forgot-password': return <ForgotPasswordScreen />;
      case 'reset-password': return <ResetPasswordScreen />;
      default: return <WelcomeScreen />;
    }
  }

  // Onboarding
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  // Full-screen flows (no nav)
  if (screen === 'new-incident') return <NewIncidentScreen />;
  if (screen === 'service-feedback') return <ServiceFeedbackScreen />;
  if (screen === 'onboarding') return <OnboardingScreen />;

  // Main app with nav
  const mainScreens: Record<string, JSX.Element> = {
    home: <HomeScreen />,
    vehicles: <VehiclesScreen />,
    'vehicle-detail': <VehicleDetailScreen />,
    incidents: <IncidentsScreen />,
    'incident-detail': <IncidentDetailScreen />,
    coverage: <CoverageScreen />,
    profile: <ProfileScreen />,
  };

  return (
    <>
      <DesktopNav />
      <main className="md:ml-64">
        <div className="max-w-2xl mx-auto md:px-6 md:py-4">
          {mainScreens[screen] || <HomeScreen />}
        </div>
      </main>
      <BottomNav />
    </>
  );
}

const App = () => (
  <AppProvider>
    <Toaster />
    <Sonner />
    <AppRouter />
  </AppProvider>
);

export default App;
