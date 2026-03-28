import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { vehicles, incidentService, incidents } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MapPin, Car, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const incidentTypeOptions = [
  { id: 'regular_service', label: 'Regular Service', description: 'Scheduled maintenance', icon: '🔧' },
  { id: 'roadside_assistance', label: 'Roadside Assistance', description: 'Jump start, flat tire, lockout', icon: '🚗' },
  { id: 'towing', label: 'Towing', description: 'Vehicle breakdown recovery', icon: '🚜' },
  { id: 'mechanical_diagnosis', label: 'Mechanical Diagnosis', description: 'Check engine, diagnostics', icon: '⚙️' },
  { id: 'spares_request', label: 'Spares Request', description: 'Request replacement parts', icon: '🔩' },
];

export default function NewIncidentScreen() {
  const { navigate } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const [vehicleList, setVehicleList] = useState<any[]>([]);
  const [activeIncidentVehicleIds, setActiveIncidentVehicleIds] = useState<Set<string>>(new Set());
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [mileage, setMileage] = useState('');

  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => { loadVehicles(); }, []);

  const loadVehicles = async () => {
    try {
      const [{ data: vData }, { data: iData }] = await Promise.all([
        vehicles.list(),
        incidents.list(),
      ]);
      const active = vData?.filter((v: any) => v.status === 'approved') || [];
      setVehicleList(active);
      const activeVehicleIds = new Set(
        (iData ?? [])
          .filter((i: any) => ['open', 'in_progress', 'service_assigned'].includes(i.status))
          .map((i: any) => i.vehicle_id as string)
      );
      setActiveIncidentVehicleIds(activeVehicleIds);
    } catch {
      // non-blocking
    }
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      toast({ title: 'GPS not available on this device', variant: 'destructive' });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const controller = new AbortController();
          const geocodeTimeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: { 'Accept-Language': 'en', 'User-Agent': 'tinlip-client/1.0 (support@tinlipautocare.co.ke)' },
              signal: controller.signal,
            }
          );
          clearTimeout(geocodeTimeout);
          const data = await res.json();
          const address = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setLocation(address);
        } catch {
          const { latitude, longitude } = pos.coords;
          setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast({ title: 'Location access denied', description: 'Please enter your location manually.', variant: 'destructive' });
        } else {
          toast({ title: 'Could not get location', description: 'Please enter your location manually.' });
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleStart = async () => {
    if (!selectedVehicle || !selectedType || !description || !location) {
      setError('Please fill all required fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await incidentService.requestOtp();
      setOtpToken(result.otp_token);
      setOtpMessage(result.message);
      setStep(4);
    } catch (e: any) {
      setError(e.message || 'Failed to request OTP');
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await incidentService.verifyAndCreate({
        otp_token: otpToken,
        otp_code: otp,
        vehicle_id: selectedVehicle,
        type: selectedType,
        description,
        location,
        mileage: mileage ? Number(mileage) : undefined,
      });
      setClaimCode(result.claim_code);
      setConfirmed(true);
    } catch (e: any) {
      setError(e.message || 'Failed to create incident');
    }
    setLoading(false);
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
          <span className="font-mono text-xl font-bold text-primary">{claimCode}</span>
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

      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      )}

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

              {vehicleList.length === 0 && (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                  No approved vehicles. Complete onboarding first.
                </div>
              )}

              {vehicleList.map((v) => {
                const hasActive = activeIncidentVehicleIds.has(v.id);
                return (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVehicle(v.id); setStep(2); }}
                    className={`w-full bg-card border-2 rounded-xl p-4 text-left transition-colors ${selectedVehicle === v.id ? 'border-primary' : 'border-border hover:border-primary/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Car className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-mono font-bold text-foreground">{v.registration}</p>
                        <p className="text-sm text-muted-foreground">{v.make} {v.model} · {v.year}</p>
                      </div>
                      {hasActive && (
                        <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">Active incident</span>
                      )}
                    </div>
                  </button>
                );
              })}
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
                <label className="text-sm font-medium text-foreground">What happened? *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the issue..."
                  className="w-full h-28 px-3 py-2 rounded-lg border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Current Location *</label>
                <div className="relative">
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Thika Road, Nairobi" className="h-12 pr-24" />
                  <button
                    onClick={handleUseGps}
                    disabled={gpsLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-primary font-medium disabled:opacity-60"
                  >
                    {gpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                    Use GPS
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Current Mileage <span className="text-muted-foreground">(optional)</span></label>
                <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g. 67500" className="h-12" />
              </div>
              <Button variant="amber" size="full" onClick={handleStart} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center text-center pt-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Verify Your Identity</h2>
              <p className="text-sm text-muted-foreground mb-8">{otpMessage || 'Enter the 6-digit code sent to your phone'}</p>

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
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(cleaned);
                }}
                className="absolute opacity-0 pointer-events-none"
                autoFocus
              />

              <button
                onClick={() => {
                  const inp = document.querySelector('input[type="tel"]') as HTMLInputElement;
                  inp?.focus();
                }}
                className="text-sm text-primary font-medium mb-4"
              >
                Tap here to enter code
              </button>

              <Button
                variant="amber"
                size="full"
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Create Incident'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
