import { Home, Car, Zap, CreditCard, User, Shield, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const navItems = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'vehicles' as const, label: 'My Vehicles', icon: Car },
  { id: 'incidents' as const, label: 'Incidents', icon: Zap },
  { id: 'coverage' as const, label: 'Coverage', icon: CreditCard },
  { id: 'profile' as const, label: 'Profile', icon: User },
];

export default function DesktopNav() {
  const { screen, navigate, logout } = useApp();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r h-screen fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-heading font-bold text-lg text-foreground">Tinlip</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = screen === item.id || (item.id === 'vehicles' && screen === 'vehicle-detail') || (item.id === 'incidents' && (screen === 'incident-detail' || screen === 'new-incident' || screen === 'service-feedback'));
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
