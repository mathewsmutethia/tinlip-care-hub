import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPasswordScreen() {
  const { navigate } = useApp();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      setTimeout(() => navigate('home'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-bold text-foreground mb-2">Set New Password</h1>
        <p className="text-muted-foreground mb-8">Choose a new password for your account.</p>

        {done ? (
          <div className="text-center animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <p className="text-foreground font-semibold">Password updated</p>
            <p className="text-muted-foreground text-sm mt-1">Taking you home...</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); handleReset(); }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <Input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <Input
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-12"
              />
            </div>
            <Button type="submit" variant="amber" size="full" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
