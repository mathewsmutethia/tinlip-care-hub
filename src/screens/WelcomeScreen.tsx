import { useApp } from '@/context/AppContext';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WelcomeScreen() {
  const { navigate } = useApp();

  return (
    <div className="min-h-screen bg-nav-dark flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full border border-primary/20 animate-pulse-amber" />
        <div className="absolute bottom-1/3 -right-16 w-48 h-48 rounded-full border border-primary/10 animate-pulse-amber" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-primary/5 animate-pulse-amber" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-8">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <Shield className="w-10 h-10 text-primary-foreground" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-nav-dark-foreground tracking-tight">Tinlip Autocare</h1>
          <p className="text-lg text-nav-dark-foreground/70 font-body">Your vehicle. Protected.</p>
        </div>

        <div className="w-full max-w-xs space-y-3 pt-8">
          <Button variant="amber" size="full" onClick={() => navigate('sign-in')}>
            Sign In
          </Button>
          <Button variant="amber-outline" size="full" onClick={() => navigate('register')}>
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
}
