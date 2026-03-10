import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { mockUser, mockVehicles, mockPayments, getDaysRemaining, formatKES } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Download, Smartphone, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function CoverageScreen() {
  const { navigate } = useApp();
  const daysRemaining = getDaysRemaining(mockUser.coverageEnd);
  const totalDays = 365;
  const progress = (daysRemaining / totalDays) * 100;
  const [mpesaFlow, setMpesaFlow] = useState<'idle' | 'input' | 'waiting' | 'success' | 'failed'>('idle');
  const [mpesaPhone, setMpesaPhone] = useState('+254 ');

  const handlePay = () => {
    setMpesaFlow('waiting');
    setTimeout(() => setMpesaFlow('success'), 3000);
  };

  return (
    <div className="pb-20 md:pb-4 animate-fade-in">
      <div className="px-4 pt-6 pb-4 md:px-0">
        <h1 className="text-2xl font-bold text-foreground">Coverage</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your protection plan details</p>
      </div>

      <div className="px-4 space-y-4 md:px-0">
        {/* Active Coverage Card */}
        <div className="bg-card border rounded-xl p-5 card-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{mockUser.planType}</p>
              <p className="text-xs text-muted-foreground">Active coverage</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="font-medium text-foreground">{mockUser.coverageStart}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">End Date</p>
              <p className="font-medium text-foreground">{mockUser.coverageEnd}</p>
            </div>
          </div>

          {/* Circular progress */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="28" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="4"
                  strokeDasharray={`${progress * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">{Math.round(progress)}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{daysRemaining} days remaining</p>
              <p className="text-xs text-muted-foreground">of {totalDays} days total</p>
            </div>
          </div>

          {/* Vehicles covered */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Vehicles Covered</p>
            {mockVehicles.filter(v => v.status === 'active').map(v => (
              <p key={v.id} className="text-sm font-mono font-medium text-foreground">{v.registration} — {v.make} {v.model}</p>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-card border rounded-xl p-4 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-3">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {mockPayments.map(p => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2.5 text-foreground">{p.date}</td>
                    <td className="py-2.5 font-medium text-foreground">{formatKES(p.amount)}</td>
                    <td className="py-2.5 text-muted-foreground">{p.method}</td>
                    <td className="py-2.5">
                      <span className={`text-xs font-medium ${p.status === 'completed' ? 'text-success' : 'text-warning'}`}>
                        {p.status === 'completed' ? '✓ Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <button className="text-primary hover:underline text-xs flex items-center gap-1">
                        <Download className="w-3 h-3" /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Renewal / M-Pesa Flow */}
        {daysRemaining <= 30 && mpesaFlow === 'idle' && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-1">Time to Renew</h3>
            <p className="text-sm text-muted-foreground mb-3">Your coverage expires soon. Renew to stay protected.</p>
            <div className="bg-card rounded-lg p-3 mb-3 border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Annual Premium</span>
                <span className="font-bold text-foreground">{formatKES(11425)}</span>
              </div>
            </div>
            <Button variant="amber" size="full" onClick={() => setMpesaFlow('input')}>
              <Smartphone className="w-4 h-4" /> Pay via M-Pesa
            </Button>
          </div>
        )}

        {mpesaFlow === 'input' && (
          <div className="bg-card border rounded-xl p-4 card-shadow animate-fade-in">
            <h3 className="font-semibold text-foreground mb-3">Enter M-Pesa Number</h3>
            <Input value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="+254 7XX XXX XXX" className="h-12 mb-3" />
            <Button variant="amber" size="full" onClick={handlePay}>Send Payment Request</Button>
          </div>
        )}

        {mpesaFlow === 'waiting' && (
          <div className="bg-card border rounded-xl p-6 card-shadow text-center animate-fade-in">
            <Loader2 className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
            <p className="font-semibold text-foreground">Check your phone</p>
            <p className="text-sm text-muted-foreground">Enter your M-Pesa PIN to complete payment</p>
          </div>
        )}

        {mpesaFlow === 'success' && (
          <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="font-semibold text-foreground">Payment Confirmed!</p>
            <p className="text-sm text-muted-foreground">Coverage activated. You're protected. 🚗</p>
          </div>
        )}

        {mpesaFlow === 'failed' && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center animate-fade-in">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="font-semibold text-foreground">Payment Failed</p>
            <p className="text-sm text-muted-foreground mb-3">Please try again</p>
            <Button variant="amber" size="default" onClick={() => setMpesaFlow('input')}>Retry</Button>
          </div>
        )}
      </div>
    </div>
  );
}
