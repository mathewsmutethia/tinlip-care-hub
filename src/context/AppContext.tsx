import React, { createContext, useContext, useState, ReactNode } from 'react';

type AppScreen = 
  | 'welcome' | 'sign-in' | 'register' | 'email-verify' | 'forgot-password'
  | 'onboarding'
  | 'home' | 'vehicles' | 'vehicle-detail' | 'incidents' | 'incident-detail' 
  | 'new-incident' | 'coverage' | 'profile' | 'service-feedback';

interface AppState {
  screen: AppScreen;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  selectedVehicleId: string | null;
  selectedIncidentId: string | null;
  navigate: (screen: AppScreen) => void;
  setAuthenticated: (val: boolean) => void;
  setOnboarded: (val: boolean) => void;
  selectVehicle: (id: string | null) => void;
  selectIncident: (id: string | null) => void;
  logout: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const navigate = (s: AppScreen) => setScreen(s);
  const logout = () => {
    setIsAuthenticated(false);
    setHasCompletedOnboarding(false);
    setScreen('welcome');
  };

  return (
    <AppContext.Provider value={{
      screen,
      isAuthenticated,
      hasCompletedOnboarding,
      selectedVehicleId,
      selectedIncidentId,
      navigate,
      setAuthenticated: setIsAuthenticated,
      setOnboarded: setHasCompletedOnboarding,
      selectVehicle: setSelectedVehicleId,
      selectIncident: setSelectedIncidentId,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
