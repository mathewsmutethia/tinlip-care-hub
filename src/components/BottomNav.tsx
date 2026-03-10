import { Home, Car, Zap, CreditCard, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const tabs = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'vehicles' as const, label: 'Vehicles', icon: Car },
  { id: 'incidents' as const, label: 'Incidents', icon: Zap },
  { id: 'coverage' as const, label: 'Coverage', icon: CreditCard },
  { id: 'profile' as const, label: 'Profile', icon: User },
];

export default function BottomNav() {
  const { screen, navigate } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav-dark safe-bottom z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = screen === tab.id || (tab.id === 'vehicles' && screen === 'vehicle-detail') || (tab.id === 'incidents' && (screen === 'incident-detail' || screen === 'new-incident' || screen === 'service-feedback'));
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${active ? 'text-primary' : 'text-nav-dark-foreground/50'}`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
