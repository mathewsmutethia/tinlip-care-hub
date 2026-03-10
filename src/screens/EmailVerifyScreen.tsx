import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export default function EmailVerifyScreen() {
  const { navigate } = useApp();

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
          We sent a verification link to <span className="font-medium text-foreground">james@email.com</span>. Click it to activate your account.
        </p>

        <div className="space-y-3 w-full max-w-xs">
          <button className="text-primary font-medium text-sm hover:underline w-full text-center">Resend email</button>
          <Button variant="outline" size="full" onClick={() => navigate('sign-in')}>
            Back to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
