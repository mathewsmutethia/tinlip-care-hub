import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { mockVehicles, incidentTypeOptions } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MapPin, Car, CheckCircle2 } from 'lucide-react';

export default function NewIncidentScreen() {
  const { navigate } = useApp();
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [mileage, setMileage] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const activeVehicles = mockVehicles.filter(v => v.status === 'active');

  const handleOtpChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setOtp(cleaned);
    if (cleaned.length === 6) {
      setTimeout(() => setConfirmed(true), 800);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6 animate-scale-in">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Incident Created Successfully</h1>
        <p className="text-sm text-muted-foreground text-center mb-4">Save this reference number — share it with our team</p>
        <div className="bg-primary/10 rounded-xl px-6 py-3 mb-6">
          <span className="font-mono text-xl font-bold text-primary">TIN-2025-00847</span>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <Button variant="amber" size="full" onClick={() => navigate('incident-detail')}>View Incident</Button>
          <Button variant="outline" size="full" onClick={() => navigate('home')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('incidents')} className="p-2 -ml-2 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">New Incident</h1>
      </div>

      {/* Progress */}
      <div className="px-6 pb-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        <div className="max-w-md mx-auto animate-fade-in">
          {step === 1 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground mb-1">Select Vehicle</h2>
              <p className="text-sm text-muted-foreground mb-4">Which vehicle needs service?</p>
              {activeVehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setSelectedVehicle(v.id); setStep(2); }}
                  className={`w-full bg-card border-2 rounded-xl p-4 text-left transition-colors ${selectedVehicle === v.id ? 'border-primary' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Car className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-foreground">{v.registration}</p>
                      <p className="text-sm text-muted-foreground">{v.make} {v.model} · {v.year}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground mb-1">Incident Type</h2>
              <p className="text-sm text-muted-foreground mb-4">What kind of help do you need?</p>
              {incidentTypeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setSelectedType(opt.id); setStep(3); }}
                  className={`w-full bg-card border-2 rounded-xl p-4 text-left transition-colors flex items-center gap-4 ${selectedType === opt.id ? 'border-primary' : 'border-border hover:border-primary/50'}`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Describe the Issue</h2>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">What happened?</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the issue..."
                  className="w-full h-28 px-3 py-2 rounded-lg border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Current Location</label>
                <div className="relative">
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Thika Road, Nairobi" className="h-12 pr-20" />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-primary font-medium">
                    <MapPin className="w-3 h-3" /> Use GPS
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Current Mileage <span className="text-muted-foreground">(optional)</span></label>
                <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g. 67500" className="h-12" />
              </div>
              <Button variant="amber" size="full" onClick={() => setStep(4)}>Continue</Button>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center text-center pt-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Verify Your Identity</h2>
              <p className="text-sm text-muted-foreground mb-8">We sent a 6-digit code to +254 7XX XXX XXX</p>
              <div className="flex justify-center gap-2 mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-xl font-bold font-mono transition-colors ${
                      otp[i] ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground'
                    }`}
                  >
                    {otp[i] || ''}
                  </div>
                ))}
              </div>
              <input
                type="tel"
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                className="absolute opacity-0 pointer-events-none"
                autoFocus
              />
              {/* Tap target for OTP */}
              <button
                onClick={() => {
                  const inp = document.querySelector('input[type="tel"]') as HTMLInputElement;
                  inp?.focus();
                }}
                className="text-sm text-primary font-medium mb-4"
              >
                Tap here to enter code
              </button>
              {otp.length < 6 && <p className="text-xs text-muted-foreground">Resend OTP in 30 seconds</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
