import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const RESEND_COOLDOWN = 45;

export default function EmailVerifyScreen() {
  const { navigate, registeredEmail } = useApp();
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);

  // Countdown tick
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Poll for session — handles case where user verifies in another tab
  useEffect(() => {
    let polls = 0;
    const MAX_POLLS = 200; // ~10 minutes
    const interval = setInterval(async () => {
      polls++;
      if (polls > MAX_POLLS) {
        clearInterval(interval);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.email_confirmed_at) {
        clearInterval(interval);
        navigate('home');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleResend = async () => {
    if (!registeredEmail || countdown > 0) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: registeredEmail,
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Verification email resent!');
      setCountdown(RESEND_COOLDOWN);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <button
          onClick={() => navigate('sign-in')}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Animated envelope icon */}
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-scale-in">
          <div className="relative">
            <Mail className="w-10 h-10 text-primary animate-pulse-amber" />
            <CheckCircle2 className="w-5 h-5 text-success absolute -bottom-1 -right-1" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Check your inbox</h1>

        <p className="text-muted-foreground text-center max-w-xs mb-1">
          We sent a verification link to
        </p>
        <p className="font-semibold text-foreground text-center mb-5 break-all max-w-xs">
          {registeredEmail || 'your email address'}
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-8 leading-relaxed">
          Click the link in the email to activate your account. Check your spam folder if you don't see it within a minute.
        </p>

        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="text-primary font-medium text-sm hover:underline w-full text-center disabled:opacity-50 disabled:no-underline py-1 transition-opacity"
          >
            {resending
              ? 'Sending...'
              : countdown > 0
              ? `Resend available in ${countdown}s`
              : 'Resend verification email'}
          </button>
          <Button variant="outline" size="full" onClick={() => navigate('sign-in')}>
            Back to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
