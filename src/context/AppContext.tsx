import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

type AppScreen =
  | 'welcome' | 'sign-in' | 'register' | 'email-verify' | 'forgot-password' | 'reset-password'
  | 'onboarding'
  | 'home' | 'vehicles' | 'vehicle-detail' | 'incidents' | 'incident-detail'
  | 'new-incident' | 'coverage' | 'profile' | 'service-feedback';

interface ClientProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  status: string | null;
  company_name: string | null;
  address: string | null;
  id_number: string | null;
  id_document_url: string | null;
  notification_preferences: { status_updates: boolean; payment_reminders: boolean; promotional: boolean } | null;
  [key: string]: unknown;
}

interface AppState {
  screen: AppScreen;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  selectedVehicleId: string | null;
  selectedIncidentId: string | null;
  user: User | null;
  profile: ClientProfile | null;
  authLoading: boolean;
  navigate: (screen: AppScreen) => void;
  setAuthenticated: (val: boolean) => void;
  setOnboarded: (val: boolean) => void;
  selectVehicle: (id: string | null) => void;
  selectIncident: (id: string | null) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  registeredEmail: string;
  setRegisteredEmail: (email: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

// Screens that are valid destinations for an authenticated user.
// Only these are persisted and restored across reloads.
const AUTHENTICATED_SCREENS = new Set<AppScreen>([
  'home', 'vehicles', 'vehicle-detail', 'incidents', 'incident-detail',
  'new-incident', 'coverage', 'profile', 'service-feedback', 'onboarding',
]);

const SK_SCREEN   = 'tlp_screen';
const SK_VEHICLE  = 'tlp_vid';
const SK_INCIDENT = 'tlp_iid';

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    sessionStorage.getItem(SK_VEHICLE),
  );
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    sessionStorage.getItem(SK_INCIDENT),
  );
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('clients')
      .select('id, email, name, phone, status, company_name, address, id_number, id_document_url, notification_preferences')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile(data as unknown as ClientProfile);
      // Check onboarding status
      const onboarded = data.status !== 'profile_incomplete' && !!data.name && !!data.phone;
      setHasCompletedOnboarding(onboarded);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);

      if (currentUser) {
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(() => fetchProfile(currentUser.id), 0);
        if (event === 'PASSWORD_RECOVERY') {
          setScreen('reset-password');
        } else if (event === 'SIGNED_IN') {
          setScreen(currentUser.email_confirmed_at ? 'home' : 'email-verify');
        }
      } else {
        setProfile(null);
        setHasCompletedOnboarding(false);
        setScreen('welcome');
      }
      setAuthLoading(false);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
        if (currentUser.email_confirmed_at) {
          // Restore the screen the user was on before the reload, or fall back to home.
          const saved = sessionStorage.getItem(SK_SCREEN) as AppScreen | null;
          setScreen(saved && AUTHENTICATED_SCREENS.has(saved) ? saved : 'home');
        } else {
          setScreen('email-verify');
        }
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigate = (s: AppScreen) => {
    setScreen(s);
    if (AUTHENTICATED_SCREENS.has(s)) {
      sessionStorage.setItem(SK_SCREEN, s);
    } else {
      // Leaving authenticated space — clear all persisted nav state.
      sessionStorage.removeItem(SK_SCREEN);
      sessionStorage.removeItem(SK_VEHICLE);
      sessionStorage.removeItem(SK_INCIDENT);
    }
  };

  const selectVehicle = (id: string | null) => {
    setSelectedVehicleId(id);
    if (id) sessionStorage.setItem(SK_VEHICLE, id);
    else sessionStorage.removeItem(SK_VEHICLE);
  };

  const selectIncident = (id: string | null) => {
    setSelectedIncidentId(id);
    if (id) sessionStorage.setItem(SK_INCIDENT, id);
    else sessionStorage.removeItem(SK_INCIDENT);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem(SK_SCREEN);
    sessionStorage.removeItem(SK_VEHICLE);
    sessionStorage.removeItem(SK_INCIDENT);
    setIsAuthenticated(false);
    setHasCompletedOnboarding(false);
    setUser(null);
    setProfile(null);
    setScreen('welcome');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      screen, isAuthenticated, hasCompletedOnboarding,
      selectedVehicleId, selectedIncidentId,
      user, profile, authLoading,
      navigate,
      setAuthenticated: setIsAuthenticated,
      setOnboarded: setHasCompletedOnboarding,
      selectVehicle,
      selectIncident,
      logout, refreshProfile,
      registeredEmail, setRegisteredEmail,
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
