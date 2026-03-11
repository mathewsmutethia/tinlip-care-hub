import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { FileText, Bell, Lock, ScrollText, HelpCircle, LogOut, ChevronRight } from 'lucide-react';

export default function ProfileScreen() {
  const { logout, user, profile } = useApp();

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const email = profile?.email || user?.email || '';
  const phone = profile?.phone || '';
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }) : '';

  const menuItems = [
    { icon: FileText, label: 'My Documents', action: () => {} },
    { icon: Bell, label: 'Notification Preferences', action: () => {} },
    { icon: Lock, label: 'Change Password', action: () => {} },
    { icon: ScrollText, label: 'Terms & Privacy Policy', action: () => {} },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} },
  ];

  return (
    <div className="pb-20 md:pb-4 animate-fade-in">
      <div className="px-4 pt-6 pb-4 md:px-0">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      </div>

      <div className="px-4 space-y-4 md:px-0">
        <div className="bg-card border rounded-xl p-5 card-shadow flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl font-heading">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-lg text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
            {phone && <p className="text-sm text-muted-foreground">{phone}</p>}
            {memberSince && <p className="text-xs text-muted-foreground mt-1">Member since {memberSince}</p>}
          </div>
        </div>

        <div className="bg-card border rounded-xl card-shadow overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary transition-colors ${i < menuItems.length - 1 ? 'border-b' : ''}`}
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 text-destructive font-medium text-sm hover:bg-destructive/5 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
