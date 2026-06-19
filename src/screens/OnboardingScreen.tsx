import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, CheckCircle2, Loader2, FileText,
  Shield, Car, Lock, Zap, Truck, Clock, ChevronRight,
} from 'lucide-react';
import { clientProfile, vehicles, documents } from '@/lib/supabase';

const AGREEMENT_PDF_URL =
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/public-assets/tinlip-service-agreement.pdf`;

const CAR_MAKES = [
  'Toyota', 'Subaru', 'Nissan', 'Mitsubishi', 'Honda', 'Mazda',
  'Mercedes-Benz', 'BMW', 'Volkswagen', 'Isuzu', 'Land Rover',
  'Suzuki', 'Hyundai', 'Kia', 'Peugeot',
];

const MAKE_MODELS: Record<string, string[]> = {
  Toyota:          ['Vitz', 'Corolla', 'Fielder', 'Axio', 'Premio', 'Prado', 'Hilux', 'Land Cruiser', 'Camry', 'RAV4', 'Probox'],
  Subaru:          ['Impreza', 'Forester', 'Legacy', 'Outback', 'XV', 'Levorg'],
  Nissan:          ['Note', 'Tiida', 'X-Trail', 'Juke', 'Patrol', 'Navara', 'March'],
  Mitsubishi:      ['Colt', 'Galant', 'Outlander', 'Pajero', 'L200', 'Lancer', 'Eclipse'],
  Honda:           ['Fit', 'Civic', 'Accord', 'CR-V', 'Vezel', 'Freed', 'Jazz'],
  Mazda:           ['Demio', 'Axela', 'Atenza', 'CX-5', 'BT-50'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLE', 'GLC', 'Sprinter', 'Vito'],
  BMW:             ['3 Series', '5 Series', 'X5', 'X3', '1 Series', 'X1'],
  Volkswagen:      ['Golf', 'Passat', 'Polo', 'Tiguan', 'Amarok', 'Caddy'],
  Isuzu:           ['D-Max', 'MU-X', 'NKR'],
  'Land Rover':    ['Defender', 'Discovery', 'Freelander', 'Range Rover'],
  Suzuki:          ['Swift', 'Alto', 'Vitara', 'Jimmy', 'Baleno'],
  Hyundai:         ['i10', 'i20', 'Tucson', 'Santa Fe', 'Elantra'],
  Kia:             ['Picanto', 'Rio', 'Sportage', 'Sorento'],
  Peugeot:         ['206', '207', '208', '307', '308', 'Partner'],
};

interface VehicleForm {
  registration: string;
  make: string;
  model: string;
  year: string;
  engineNumber: string;
  chassisNumber: string;
  mileage: string;
}

const emptyVehicle: VehicleForm = {
  registration: '', make: '', model: '', year: '2024',
  engineNumber: '', chassisNumber: '', mileage: '',
};

const CONFETTI_PIECES = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 4.5) % 98 + 1,
  size: 7 + (i % 4) * 3,
  color: ['#D4A12B', '#2ECC71', '#3498DB', '#E74C3C', '#9B59B6', '#F39C12'][i % 6],
  isCircle: i % 3 === 0,
  delay: (i * 0.08) % 0.9,
  duration: 1.8 + (i % 4) * 0.25,
}));

const BENEFITS = [
  { icon: Zap,   label: 'Roadside Rescue',  desc: 'Help dispatched in minutes', delay: '0.3s' },
  { icon: Truck, label: 'Towing Covered',   desc: 'Up to 25 km from breakdown point', delay: '0.6s' },
  { icon: Clock, label: '24/7 Support',     desc: 'Always here when you need',  delay: '0.9s' },
];

const JOURNEY_STEPS = ['Your Details', 'Your Car', 'Protected!'];

function safeErrorMessage(e: any, fallback: string): string {
  const msg: string = e?.message || '';
  if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique'))
    return 'This entry already exists. Please check and try again.';
  if (msg.toLowerCase().includes('violates') || msg.toLowerCase().includes('constraint'))
    return fallback;
  if (msg.length > 0 && msg.length < 120) return msg;
  return fallback;
}

function ValidMark({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <CheckCircle2 className="w-4 h-4 text-success absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
  );
}

export default function OnboardingScreen() {
  const { navigate, setOnboarded, profile, refreshProfile } = useApp();
  const isAddingVehicle = !!(profile?.name && profile?.phone && profile?.status !== 'profile_incomplete');

  const [step, setStep] = useState(isAddingVehicle ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ firstName: string; registration: string } | null>(null);

  const [personalForm, setPersonalForm] = useState({ fullName: '', phone: '', idNumber: '', address: '' });
  const [clientIdFile, setClientIdFile] = useState<File | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({ ...emptyVehicle });
  const [logbookFile, setLogbookFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);

  const nameValid = personalForm.fullName.trim().length > 0 && personalForm.fullName.length <= 100;
  const phoneValid = /^\+?[\d\s\-]{7,15}$/.test(personalForm.phone.trim());
  const idNumberValid = personalForm.idNumber.trim().length > 0;
  const addressValid = personalForm.address.trim().length > 0;
  const regValid = vehicleForm.registration.trim().length > 0 && vehicleForm.registration.length <= 20;
  const makeValid = vehicleForm.make.trim().length > 0 && vehicleForm.make.length <= 50;
  const modelValid = vehicleForm.model.trim().length > 0 && vehicleForm.model.length <= 50;
  const mileageValid =
    vehicleForm.mileage !== '' &&
    Number.isFinite(Number(vehicleForm.mileage)) &&
    Number(vehicleForm.mileage) >= 0 &&
    Number(vehicleForm.mileage) <= 999999;

  const currentModels = MAKE_MODELS[vehicleForm.make] ?? [];

  const handlePersonalSubmit = async () => {
    const name = personalForm.fullName.trim();
    const phone = personalForm.phone.trim();
    const idNumber = personalForm.idNumber.trim();
    const address = personalForm.address.trim();
    if (!name || !phone) { setError('Please enter your name and phone number'); return; }
    if (name.length > 100) { setError('Name is too long (max 100 characters)'); return; }
    if (!/^\+?[\d\s\-]{7,15}$/.test(phone)) { setError('Enter a valid phone number (e.g. +254 712 345 678)'); return; }
    if (!idNumber) { setError('Please enter your ID or company registration number'); return; }
    if (!address) { setError('Please enter your physical address'); return; }
    if (!clientIdFile) { setError('Please upload a photo or scan of your ID document'); return; }
    setLoading(true);
    setError('');
    try {
      await clientProfile.save({ name, phone, id_number: idNumber, address });
      await documents.uploadClientId(clientIdFile);
      setStep(2);
    } catch (e: any) {
      setError(safeErrorMessage(e, 'Failed to save. Try again.'));
    }
    setLoading(false);
  };

  const handleVehicleSubmit = async () => {
    if (!vehicleForm.registration || !vehicleForm.make || !vehicleForm.model || !vehicleForm.mileage) {
      setError('Please fill the required vehicle fields'); return;
    }
    if (vehicleForm.registration.trim().length > 20) { setError('Registration plate is too long'); return; }
    if (vehicleForm.make.trim().length > 50 || vehicleForm.model.trim().length > 50) { setError('Make or model name is too long'); return; }
    const mileageNum = Number(vehicleForm.mileage);
    if (!Number.isFinite(mileageNum) || mileageNum < 0 || mileageNum > 999999) {
      setError('Enter a valid mileage (0 – 999,999 km)'); return;
    }
    if (!isAddingVehicle && !agreed) { setError('Please agree to the Service Agreement to continue'); return; }
    setLoading(true);
    setError('');
    try {
      const { data: newVehicle } = await vehicles.add({
        registration: vehicleForm.registration.toUpperCase().trim(),
        make: vehicleForm.make.trim(),
        model: vehicleForm.model.trim(),
        year: Number(vehicleForm.year),
        mileage: Number(vehicleForm.mileage),
        engine_number: vehicleForm.engineNumber.trim() || undefined,
        chassis_number: vehicleForm.chassisNumber.trim() || undefined,
      });

      if (newVehicle?.id) {
        if (logbookFile) await documents.uploadVehicleDoc(newVehicle.id, 'logbook', logbookFile);
        if (insuranceFile) await documents.uploadVehicleDoc(newVehicle.id, 'insurance', insuranceFile);
      }

      if (isAddingVehicle) {
        navigate('vehicles');
        return;
      }

      await clientProfile.submitForApproval();
      await refreshProfile();
      setOnboarded(true);
      setLoading(false);

      const firstName = personalForm.fullName.split(' ')[0] || profile?.name?.split(' ')[0] || 'Driver';
      setCelebrationData({ firstName, registration: vehicleForm.registration.toUpperCase().trim() });
      setCelebrating(true);
      setTimeout(() => navigate('home'), 3200);
    } catch (e: any) {
      setError(safeErrorMessage(e, 'Failed to save vehicle. Try again.'));
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Celebration overlay ── */}
      {celebrating && celebrationData && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-nav-dark">
          <div className="welcome-gradient-bg absolute inset-0 opacity-80" />

          {CONFETTI_PIECES.map((piece, i) => (
            <div
              key={i}
              className="absolute top-[-20px] pointer-events-none"
              style={{
                left: `${piece.x}%`,
                width: `${piece.size}px`,
                height: `${piece.size}px`,
                backgroundColor: piece.color,
                borderRadius: piece.isCircle ? '50%' : '2px',
                animation: `confetti-fall ${piece.duration}s ease-in forwards`,
                animationDelay: `${piece.delay}s`,
              }}
            />
          ))}

          <div className="relative z-10 text-center px-8 max-w-sm w-full">
            <div className="w-24 h-24 rounded-2xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6 animate-scale-in shadow-lg shadow-primary/20">
              <Shield className="w-12 h-12 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-nav-dark-foreground mb-1 animate-fade-in">
              Welcome to the<br />Tinlip family!
            </h2>
            <p className="text-nav-dark-foreground/70 mb-1 animate-fade-in">
              {celebrationData.firstName}, your vehicle is registered.
            </p>
            <p className="font-mono text-sm font-bold text-primary mb-6 animate-fade-in tracking-wider">
              {celebrationData.registration}
            </p>

            <div className="space-y-2 mb-6">
              {BENEFITS.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/[0.07] rounded-xl px-4 py-3 chip-pop"
                  style={{ animationDelay: b.delay }}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <b.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-nav-dark-foreground">{b.label}</p>
                    <p className="text-xs text-nav-dark-foreground/55">{b.desc}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                </div>
              ))}
            </div>

            <p className="text-xs text-nav-dark-foreground/40 animate-fade-in">
              Taking you to your dashboard…
            </p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-background flex flex-col">

        {/* ── Add-vehicle mode: simple header ── */}
        {isAddingVehicle && (
          <div className="p-4 flex items-center gap-3 border-b">
            <button
              onClick={() => navigate('vehicles')}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Add Vehicle</h1>
          </div>
        )}

        {/* ── Step 1 hero header ── */}
        {!isAddingVehicle && step === 1 && (
          <div className="bg-nav-dark relative overflow-hidden flex-shrink-0">
            <div className="welcome-gradient-bg absolute inset-0 opacity-70" />
            <div className="relative z-10 px-6 pt-10 pb-7">
              <button
                onClick={() => navigate('home')}
                className="flex items-center gap-1.5 text-nav-dark-foreground/50 hover:text-nav-dark-foreground/80 transition-colors mb-6 -ml-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>

              {/* Progress bars */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex gap-1.5">
                  <div className="w-8 h-1.5 rounded-full bg-primary" />
                  <div className="w-8 h-1.5 rounded-full bg-white/15" />
                </div>
                <span className="text-xs text-nav-dark-foreground/45">Step 1 of 2</span>
              </div>

              {/* Title */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/10">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-nav-dark-foreground leading-tight">
                    Let's get you protected
                  </h1>
                  <p className="text-xs text-nav-dark-foreground/55 mt-0.5">Takes about 2 minutes</p>
                </div>
              </div>

              {/* Journey preview */}
              <div className="flex items-center gap-1">
                {JOURNEY_STEPS.map((label, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className={`flex items-center gap-1 ${i === 0 ? 'text-primary' : 'text-nav-dark-foreground/30'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${i === 0 ? 'bg-primary text-white' : 'bg-white/10 text-nav-dark-foreground/40'}`}>
                        {i + 1}
                      </div>
                      <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>
                    </div>
                    {i < JOURNEY_STEPS.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-nav-dark-foreground/20 flex-shrink-0 mx-0.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2 hero header ── */}
        {!isAddingVehicle && step === 2 && (
          <div className="bg-nav-dark relative overflow-hidden flex-shrink-0">
            <div className="welcome-gradient-bg absolute inset-0 opacity-70" />
            <div className="relative z-10 px-6 pt-10 pb-7">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-nav-dark-foreground/50 hover:text-nav-dark-foreground/80 transition-colors mb-6 -ml-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>

              {/* Progress bars */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex gap-1.5">
                  <div className="w-8 h-1.5 rounded-full bg-success" />
                  <div className="w-8 h-1.5 rounded-full bg-primary" />
                </div>
                <span className="text-xs text-nav-dark-foreground/45">Step 2 of 2 — Almost there!</span>
              </div>

              {/* Title */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/10">
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-nav-dark-foreground leading-tight">
                    Register your car
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    <p className="text-xs text-success">Your details are saved</p>
                  </div>
                </div>
              </div>

              {/* Journey preview */}
              <div className="flex items-center gap-1">
                {JOURNEY_STEPS.map((label, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className={`flex items-center gap-1 ${i === 1 ? 'text-primary' : i === 0 ? 'text-success' : 'text-nav-dark-foreground/30'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${i === 1 ? 'bg-primary text-white' : i === 0 ? 'bg-success text-white' : 'bg-white/10 text-nav-dark-foreground/40'}`}>
                        {i === 0
                          ? <CheckCircle2 className="w-3 h-3" />
                          : <span className="text-[9px] font-bold">{i + 1}</span>
                        }
                      </div>
                      <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>
                    </div>
                    {i < JOURNEY_STEPS.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-nav-dark-foreground/20 flex-shrink-0 mx-0.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* ── Form content ── */}
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <div key={step} className="max-w-md mx-auto animate-fade-in">

            {/* Step 1: Personal details */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="e.g. James Mwangi"
                      value={personalForm.fullName}
                      onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                      className={`h-12 pr-10 ${nameValid ? 'border-success/50' : ''}`}
                    />
                    <ValidMark show={nameValid} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">WhatsApp / Phone Number</label>
                  <p className="text-xs text-muted-foreground -mt-1">
                    We'll use this to dispatch help to you
                  </p>
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="+254 712 345 678"
                      value={personalForm.phone}
                      onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                      className={`h-12 pr-10 ${phoneValid ? 'border-success/50' : ''}`}
                    />
                    <ValidMark show={phoneValid} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    National ID / Passport / Company Reg.
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="e.g. 12345678"
                      value={personalForm.idNumber}
                      onChange={(e) => setPersonalForm({ ...personalForm, idNumber: e.target.value })}
                      className={`h-12 pr-10 ${idNumberValid ? 'border-success/50' : ''}`}
                    />
                    <ValidMark show={idNumberValid} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Your Location</label>
                  <p className="text-xs text-muted-foreground -mt-1">
                    For faster dispatch when you need help
                  </p>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="e.g. Westlands, Nairobi"
                      value={personalForm.address}
                      onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                      className={`h-12 pr-10 ${addressValid ? 'border-success/50' : ''}`}
                    />
                    <ValidMark show={addressValid} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">ID Document</label>
                  <p className="text-xs text-muted-foreground -mt-1">
                    Photo or scan of your national ID, passport, or company certificate
                  </p>
                  <label
                    className={`flex items-center gap-3 w-full h-12 px-4 rounded-lg border cursor-pointer transition-colors ${
                      clientIdFile
                        ? 'border-success/50 bg-success/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <FileText className={`w-4 h-4 flex-shrink-0 ${clientIdFile ? 'text-success' : 'text-muted-foreground'}`} />
                    <span className={`text-sm flex-1 truncate ${clientIdFile ? 'text-success font-medium' : 'text-muted-foreground'}`}>
                      {clientIdFile ? clientIdFile.name : 'Tap to upload ID document'}
                    </span>
                    {clientIdFile && <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => setClientIdFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                {/* Security badge */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-success/5 border border-success/20">
                  <Lock className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  <p className="text-xs text-success/80">
                    256-bit encrypted · Your data is never shared with third parties
                  </p>
                </div>

                <Button
                  variant="amber"
                  size="full"
                  className="h-12 gap-2 font-semibold"
                  onClick={handlePersonalSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Next: Register My Car</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground pb-2">
                  Joining 2,000+ Kenyan drivers already protected
                </p>
              </div>
            )}

            {/* Step 2: Vehicle */}
            {step === 2 && (
              <div className="space-y-4">
                <datalist id="car-makes">
                  {CAR_MAKES.map((m) => <option key={m} value={m} />)}
                </datalist>
                <datalist id="car-models">
                  {currentModels.map((m) => <option key={m} value={m} />)}
                </datalist>

                {/* Vehicle card */}
                <div className="bg-card rounded-xl border card-shadow overflow-hidden">
                  <div className="bg-primary/5 border-b px-4 py-3 flex items-center gap-2">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Vehicle Details</span>
                    <span className="text-xs text-muted-foreground ml-auto">* required</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Registration Plate *</label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="KBZ 123X"
                          value={vehicleForm.registration}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, registration: e.target.value })}
                          className={`h-11 pr-10 font-mono uppercase ${regValid ? 'border-success/50' : ''}`}
                        />
                        <ValidMark show={regValid} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Make *</label>
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="Toyota"
                            list="car-makes"
                            value={vehicleForm.make}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value, model: '' })}
                            className={`h-11 pr-10 ${makeValid ? 'border-success/50' : ''}`}
                          />
                          <ValidMark show={makeValid} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Model *</label>
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="Vitz"
                            list="car-models"
                            value={vehicleForm.model}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                            className={`h-11 pr-10 ${modelValid ? 'border-success/50' : ''}`}
                          />
                          <ValidMark show={modelValid} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Year</label>
                        <select
                          value={vehicleForm.year}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                          className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                        >
                          {Array.from({ length: 26 }, (_, i) => 2025 - i).map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Mileage (km) *</label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="50000"
                            value={vehicleForm.mileage}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, mileage: e.target.value })}
                            className={`h-11 pr-10 ${mileageValid ? 'border-success/50' : ''}`}
                          />
                          <ValidMark show={mileageValid} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Serial numbers (optional) */}
                <div className="bg-card rounded-xl border card-shadow overflow-hidden">
                  <div className="px-4 py-3 flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Serial Numbers</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      optional
                    </span>
                  </div>
                  <div className="px-4 pb-4 space-y-3">
                    {(
                      [
                        { label: 'Engine Number',  key: 'engineNumber'  as const, placeholder: '2NR-FKE-0847291' },
                        { label: 'Chassis Number', key: 'chassisNumber' as const, placeholder: 'KSP130-0284751'  },
                      ] as const
                    ).map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">{f.label}</label>
                        <Input
                          type="text"
                          placeholder={f.placeholder}
                          value={vehicleForm[f.key]}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, [f.key]: e.target.value })}
                          className="h-11"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional documents */}
                <div className="bg-card rounded-xl border card-shadow overflow-hidden">
                  <div className="px-4 py-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Vehicle Documents</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto">
                      optional
                    </span>
                  </div>
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-xs text-muted-foreground">Upload now or from your profile later</p>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Logbook</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => setLogbookFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                      />
                      {logbookFile && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          <span className="text-xs text-success">{logbookFile.name}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        Insurance Certificate
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                      />
                      {insuranceFile && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          <span className="text-xs text-success">{insuranceFile.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Agreement */}
                {!isAddingVehicle && (
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="agree"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-primary flex-shrink-0"
                    />
                    <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer leading-snug">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => window.open(AGREEMENT_PDF_URL, '_blank', 'noopener,noreferrer')}
                        className="text-primary underline underline-offset-2"
                      >
                        Tinlip Service Agreement
                      </button>{' '}
                      — <span className="text-muted-foreground text-xs">subject to cancellation terms</span>
                    </label>
                  </div>
                )}

                {/* What you unlock */}
                {!isAddingVehicle && (
                  <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
                    <p className="text-xs font-semibold text-primary mb-2.5">
                      After this you'll have instant access to:
                    </p>
                    <div className="space-y-2">
                      {[
                        'Roadside rescue dispatched in minutes',
                        'Towing to any garage in Nairobi',
                        '24/7 support line for emergencies',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                          <span className="text-xs text-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2.5">KES 1,000 deductible applies per covered repair.</p>
                  </div>
                )}

                <Button
                  variant="amber"
                  size="full"
                  className="h-12 font-semibold gap-2 btn-pulse"
                  onClick={handleVehicleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Setting everything up…</span>
                    </>
                  ) : isAddingVehicle ? (
                    'Add Vehicle'
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Protect My Car</span>
                    </>
                  )}
                </Button>

                {!isAddingVehicle && (
                  <p className="text-xs text-muted-foreground text-center pb-2">
                    Documents can be uploaded from your profile anytime
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
