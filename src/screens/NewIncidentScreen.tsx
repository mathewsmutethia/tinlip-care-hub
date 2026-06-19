import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { vehicles, incidentService, incidents, documents } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, MapPin, Car, CheckCircle2, Loader2, Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const incidentTypeOptions = [
  { id: 'regular_service', label: 'Regular Service', description: 'Scheduled maintenance', icon: '🔧', price: 'KES 2,500 – 5,000' },
  { id: 'roadside_assistance', label: 'Roadside Assistance', description: 'Jump start, flat tire, lockout', icon: '🚗', price: 'KES 500 – 1,500' },
  { id: 'towing', label: 'Towing', description: 'Vehicle breakdown recovery', icon: '🚜', price: 'KES 1,500 – 3,000' },
  { id: 'mechanical_diagnosis', label: 'Mechanical Diagnosis', description: 'Check engine, diagnostics', icon: '⚙️', price: 'KES 1,000 – 2,500' },
  { id: 'spares_request', label: 'Spares Request', description: 'Request replacement parts', icon: '🔩', price: 'Quote on inspection' },
];

export default function NewIncidentScreen() {
  const { navigate, selectIncident } = useApp();
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

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => { loadVehicles(); }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('tinlip_quickstart');
    if (!raw) return;
    sessionStorage.removeItem('tinlip_quickstart');
    try {
      const { vehicleId, type } = JSON.parse(raw);
      if (vehicleId) setSelectedVehicle(vehicleId);
      if (type) setSelectedType(type);
      if (vehicleId && type) setStep(3);
    } catch {
      // malformed — ignore, start at step 1
    }
  }, []);

  const loadVehicles = async () => {
    try {
      const [{ data: vData }, { data: iData }] = await Promise.all([
        vehicles.list(),
        incidents.list(),
      ]);
      const active = vData?.filter((v: any) => ['active', 'approved'].includes(v.status)) || [];
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

  const extractFunctionError = async (e: any, fallback: string): Promise<string> => {
    try {
      if (e?.context?.error) return e.context.error;
      if (typeof e?.context?.clone === 'function') {
        const body = await e.context.clone().json().catch(() => null);
        if (body?.error) return body.error;
      }
    } catch {
      // ignore — fall through to fallback
    }
    return fallback;
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
      const msg = await extractFunctionError(e, 'Failed to request OTP');
      setError(msg);
    }
    setLoading(false);
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - photos.length;
    const MAX = 10 * 1024 * 1024;
    const valid = files.filter(f => {
      if (f.size > MAX) { toast.error(`${f.name} is too large (max 10 MB)`); return false; }
      return true;
    });
    const toAdd = valid.slice(0, remaining);
    setPhotos(prev => [...prev, ...toAdd]);
    setPhotoPreviewUrls(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
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
      // Upload photos in background — don't block on failure
      if (photos.length > 0 && result.incident_id) {
        photos.forEach(photo => {
          documents.uploadIncidentPhoto(result.incident_id, photo).catch(() => {});
        });
      }
      if (result.incident_id) selectIncident(result.incident_id);
      setClaimCode(result.claim_code);
      setConfirmed(true);
    } catch (e: any) {
      const msg = await extractFunctionError(e, 'Failed to create incident');
      setError(msg);
    }
    setLoading(false);
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6 animate-scale-in">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Service Requested!</h1>
        <p className="text-sm text-muted-foreground text-center mb-4">Save your reference number — share it with our team</p>
        <div className="bg-primary/10 rounded-xl px-6 py-3 mb-6">
          <span className="font-mono text-xl font-bold text-primary">{claimCode}</span>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <Button variant="amber" size="full" onClick={() => navigate('incident-detail')}>View Service</Button>
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
        <h1 className="text-lg font-semibold text-foreground">Request Service</h1>
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
                        <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">Active job</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground mb-1">What do you need?</h2>
              <p className="text-sm text-muted-foreground mb-4">Select the type of service</p>
              {incidentTypeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setSelectedType(opt.id); setStep(3); }}
                  className={`w-full bg-card border-2 rounded-xl p-4 text-left transition-colors flex items-center gap-4 ${selectedType === opt.id ? 'border-primary' : 'border-border hover:border-primary/50'}`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg whitespace-nowrap">
                    {opt.price}
                  </span>
                </button>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-1">Final price confirmed before work begins</p>
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

              {/* Photo capture */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Photos <span className="text-muted-foreground">(optional, max 3)</span></label>
                  {photos.length < 3 && (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary"
                    >
                      <Camera className="w-3.5 h-3.5" /> Add Photo
                    </button>
                  )}
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={handleAddPhotos}
                />
                {photoPreviewUrls.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {photoPreviewUrls.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 3 && (
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center"
                      >
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}
                {photoPreviewUrls.length === 0 && (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-sm">Tap to add a photo of the issue</span>
                  </button>
                )}
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

              <div className="flex justify-center mb-8">
                <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                variant="amber"
                size="full"
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Submit'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
