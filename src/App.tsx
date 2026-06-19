import { lazy, Suspense } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import BottomNav from '@/components/BottomNav';
import DesktopNav from '@/components/DesktopNav';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

const WelcomeScreen        = lazy(() => import('@/screens/WelcomeScreen'));
const SignInScreen         = lazy(() => import('@/screens/SignInScreen'));
const RegisterScreen       = lazy(() => import('@/screens/RegisterScreen'));
const EmailVerifyScreen    = lazy(() => import('@/screens/EmailVerifyScreen'));
const ForgotPasswordScreen = lazy(() => import('@/screens/ForgotPasswordScreen'));
const ResetPasswordScreen  = lazy(() => import('@/screens/ResetPasswordScreen'));
const OnboardingScreen     = lazy(() => import('@/screens/OnboardingScreen'));
const HomeScreen           = lazy(() => import('@/screens/HomeScreen'));
const VehiclesScreen       = lazy(() => import('@/screens/VehiclesScreen'));
const VehicleDetailScreen  = lazy(() => import('@/screens/VehicleDetailScreen'));
const IncidentsScreen      = lazy(() => import('@/screens/IncidentsScreen'));
const IncidentDetailScreen = lazy(() => import('@/screens/IncidentDetailScreen'));
const NewIncidentScreen    = lazy(() => import('@/screens/NewIncidentScreen'));
const CoverageScreen       = lazy(() => import('@/screens/CoverageScreen'));
const ProfileScreen        = lazy(() => import('@/screens/ProfileScreen'));
const ServiceFeedbackScreen = lazy(() => import('@/screens/ServiceFeedbackScreen'));

const ScreenLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function AppRouter() {
  const { screen, isAuthenticated, hasCompletedOnboarding } = useApp();

  if (!isAuthenticated) {
    const authScreen = (() => {
      switch (screen) {
        case 'sign-in':        return <SignInScreen />;
        case 'register':       return <RegisterScreen />;
        case 'email-verify':   return <EmailVerifyScreen />;
        case 'forgot-password':return <ForgotPasswordScreen />;
        case 'reset-password': return <ResetPasswordScreen />;
        default:               return <WelcomeScreen />;
      }
    })();
    return <Suspense fallback={<ScreenLoader />}>{authScreen}</Suspense>;
  }

  if (!hasCompletedOnboarding) {
    return <Suspense fallback={<ScreenLoader />}><OnboardingScreen /></Suspense>;
  }

  if (screen === 'new-incident')    return <Suspense fallback={<ScreenLoader />}><NewIncidentScreen /></Suspense>;
  if (screen === 'service-feedback') return <Suspense fallback={<ScreenLoader />}><ServiceFeedbackScreen /></Suspense>;
  if (screen === 'onboarding')      return <Suspense fallback={<ScreenLoader />}><OnboardingScreen /></Suspense>;

  const mainScreens: Record<string, JSX.Element> = {
    home:              <HomeScreen />,
    vehicles:          <VehiclesScreen />,
    'vehicle-detail':  <VehicleDetailScreen />,
    incidents:         <IncidentsScreen />,
    'incident-detail': <IncidentDetailScreen />,
    coverage:          <CoverageScreen />,
    profile:           <ProfileScreen />,
  };

  return (
    <>
      <DesktopNav />
      <main className="md:ml-64">
        <div className="max-w-2xl mx-auto md:px-6 md:py-4">
          <Suspense fallback={<ScreenLoader />}>
            {mainScreens[screen] || <HomeScreen />}
          </Suspense>
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
