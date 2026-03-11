import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailVerifyScreen() {
  const { navigate, registeredEmail } = useApp();
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!registeredEmail) return;
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
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <button onClick={() => navigate('sign-in')} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-scale-in">
          <div className="relative">
            <Mail className="w-10 h-10 text-primary" />
            <CheckCircle2 className="w-5 h-5 text-success absolute -bottom-1 -right-1" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
        <p className="text-muted-foreground text-center max-w-xs mb-8">
          We sent a verification link to <span className="font-medium text-foreground">{registeredEmail || 'your email'}</span>. Click it to activate your account.
        </p>

        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-primary font-medium text-sm hover:underline w-full text-center disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend email'}
          </button>
          <Button variant="outline" size="full" onClick={() => navigate('sign-in')}>
            Back to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
