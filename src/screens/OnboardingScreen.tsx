import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, CheckCircle2, FileText, Plus, X } from 'lucide-react';

interface VehicleForm {
  registration: string;
  make: string;
  model: string;
  year: string;
  engineNumber: string;
  chassisNumber: string;
  mileage: string;
}

const emptyVehicle: VehicleForm = { registration: '', make: '', model: '', year: '2020', engineNumber: '', chassisNumber: '', mileage: '' };

export default function OnboardingScreen() {
  const { navigate, setOnboarded } = useApp();
  const [step, setStep] = useState(1);
  const [personalForm, setPersonalForm] = useState({ fullName: '', phone: '', idNumber: '', address: '' });
  const [idUploaded, setIdUploaded] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleForm[]>([{ ...emptyVehicle }]);
  const [signed, setSigned] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const steps = ['Personal Details', 'Add Vehicle', 'Agreement', 'Review & Submit'];

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setOnboarded(true);
      navigate('home');
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Application Submitted!</h1>
        <p className="text-muted-foreground text-center max-w-xs">Your application is under review. We'll notify you within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('home')} className="p-2 -ml-2 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Get Started</h1>
      </div>

      {/* Progress */}
      <div className="px-6 pb-6">
        <div className="flex gap-2 mb-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Step {step} of 4 — {steps[step - 1]}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        <div className="max-w-md mx-auto animate-fade-in">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Personal Details</h2>
              {[
                { label: 'Full Name', key: 'fullName', placeholder: 'James Mwangi', type: 'text' },
                { label: 'Phone Number', key: 'phone', placeholder: '+254 712 345 678', type: 'tel' },
                { label: 'ID Number / Company Reg', key: 'idNumber', placeholder: '12345678', type: 'text' },
                { label: 'Physical Address', key: 'address', placeholder: 'Westlands, Nairobi', type: 'text' },
              ].map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{f.label}</label>
                  <Input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(personalForm as any)[f.key]}
                    onChange={(e) => setPersonalForm({ ...personalForm, [f.key]: e.target.value })}
                    className="h-12"
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">ID Document</label>
                <button
                  onClick={() => setIdUploaded(true)}
                  className={`w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors ${idUploaded ? 'border-success bg-success/5' : 'border-border hover:border-primary'}`}
                >
                  {idUploaded ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-success" />
                      <span className="text-sm text-success font-medium">ID uploaded</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Tap to upload</span>
                    </>
                  )}
                </button>
              </div>
              <Button variant="amber" size="full" onClick={() => setStep(2)}>Save & Continue</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Add Your Vehicles</h2>
              {vehicles.map((v, idx) => (
                <div key={idx} className="bg-card rounded-lg border p-4 space-y-3 card-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Vehicle {idx + 1}</span>
                    {vehicles.length > 1 && (
                      <button onClick={() => setVehicles(vehicles.filter((_, i) => i !== idx))} className="text-destructive"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                  {[
                    { label: 'Registration', key: 'registration', placeholder: 'KBZ 123X' },
                    { label: 'Make', key: 'make', placeholder: 'Toyota' },
                    { label: 'Model', key: 'model', placeholder: 'Vitz' },
                    { label: 'Engine Number', key: 'engineNumber', placeholder: '2NR-FKE-0847291' },
                    { label: 'Chassis Number', key: 'chassisNumber', placeholder: 'KSP130-0284751' },
                    { label: 'Current Mileage (KM)', key: 'mileage', placeholder: '50000' },
                  ].map((f) => (
                    <div key={f.key} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                      <Input
                        placeholder={f.placeholder}
                        value={(v as any)[f.key]}
                        onChange={(e) => {
                          const updated = [...vehicles];
                          (updated[idx] as any)[f.key] = e.target.value;
                          setVehicles(updated);
                        }}
                        className="h-10"
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Year</label>
                    <select
                      value={v.year}
                      onChange={(e) => {
                        const updated = [...vehicles];
                        updated[idx].year = e.target.value;
                        setVehicles(updated);
                      }}
                      className="w-full h-10 px-3 rounded-md border bg-card text-sm"
                    >
                      {Array.from({ length: 26 }, (_, i) => 2025 - i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              {vehicles.length < 5 && (
                <button
                  onClick={() => setVehicles([...vehicles, { ...emptyVehicle }])}
                  className="flex items-center gap-2 text-primary text-sm font-medium hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add Another Vehicle
                </button>
              )}
              <Button variant="amber" size="full" onClick={() => setStep(3)}>Save & Continue</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Agreement & Declaration</h2>
              <div className="bg-card rounded-lg border p-4 max-h-48 overflow-y-auto text-sm text-muted-foreground card-shadow">
                <h3 className="font-semibold text-foreground mb-2">Tinlip Autocare Service Agreement</h3>
                <p className="mb-2">This agreement is entered into between Tinlip Autocare Limited ("Provider") and the undersigned client ("Client").</p>
                <p className="mb-2">1. <strong>Coverage Scope:</strong> The Provider shall offer vehicle protection services including roadside assistance, towing, mechanical diagnosis, regular servicing coordination, and spare parts procurement.</p>
                <p className="mb-2">2. <strong>Client Obligations:</strong> The Client agrees to provide accurate vehicle and personal information, maintain valid insurance, and report incidents promptly.</p>
                <p className="mb-2">3. <strong>Payment Terms:</strong> Annual premiums are payable via M-Pesa. Coverage activates upon confirmed payment.</p>
                <p className="mb-2">4. <strong>Claims Process:</strong> All service requests must be initiated through the Tinlip client portal. Unauthorized third-party repairs are not covered.</p>
                <p>5. <strong>Termination:</strong> Either party may terminate with 30 days written notice. No refunds for partial periods.</p>
              </div>
              <Button variant="outline" size="default" className="gap-2">
                <FileText className="w-4 h-4" /> Download PDF
              </Button>
              <div className="bg-card rounded-lg border p-4 card-shadow">
                <p className="text-sm font-medium text-foreground mb-3">Digital Signature</p>
                <button
                  onClick={() => setSigned(!signed)}
                  className={`w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${signed ? 'border-success bg-success/5' : 'border-border hover:border-primary'}`}
                >
                  {signed ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <span className="text-success font-medium text-sm">Signed</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Tap to sign digitally</span>
                  )}
                </button>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mt-1 w-4 h-4 rounded accent-primary" />
                <span className="text-sm text-muted-foreground">I confirm all information provided is accurate and complete</span>
              </label>
              <Button variant="amber" size="full" onClick={() => setStep(4)} disabled={!signed || !declared}>Save & Continue</Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Review & Submit</h2>
              <div className="bg-card rounded-lg border p-4 space-y-3 card-shadow">
                <h3 className="text-sm font-semibold text-foreground">Personal Details</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{personalForm.fullName || 'James Mwangi'}</p>
                  <p>{personalForm.phone || '+254 712 345 678'}</p>
                  <p>{personalForm.address || 'Westlands, Nairobi'}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-success">ID Document uploaded</span>
                </div>
              </div>
              <div className="bg-card rounded-lg border p-4 space-y-3 card-shadow">
                <h3 className="text-sm font-semibold text-foreground">Vehicles ({vehicles.length})</h3>
                {vehicles.map((v, i) => (
                  <div key={i} className="text-sm text-muted-foreground">
                    <p className="font-mono font-medium text-foreground">{v.registration || `Vehicle ${i + 1}`}</p>
                    <p>{v.make} {v.model} {v.year}</p>
                  </div>
                ))}
              </div>
              <div className="bg-card rounded-lg border p-4 card-shadow">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-success">Agreement signed</span>
                </div>
              </div>
              <Button variant="amber" size="full" onClick={handleSubmit}>Submit for Approval</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
