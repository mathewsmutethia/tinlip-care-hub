import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordScreen() {
  const { navigate } = useApp();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <button onClick={() => navigate('sign-in')} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-6 pb-8">
        <div className="max-w-sm mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-2">Forgot Password</h1>
          <p className="text-muted-foreground mb-8">Enter your email and we'll send you a reset link.</p>

          {sent ? (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <CheckCircle2 className="w-16 h-16 text-success mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Reset link sent!</h2>
              <p className="text-muted-foreground mb-6">Check your inbox for the password reset link.</p>
              <Button variant="outline" size="full" onClick={() => navigate('sign-in')}>Back to Sign In</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
              </div>
              <Button variant="amber" size="full" onClick={() => setSent(true)}>Send Reset Link</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
