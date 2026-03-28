import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, CheckCircle2, FileText, Plus, X, Loader2, Download } from 'lucide-react';
import { clientProfile, vehicles, documents } from '@/lib/supabase';

const AGREEMENT_PDF_URL = 'https://xpjqgcuywecqhkddncjq.supabase.co/storage/v1/object/public/public-assets/tinlip-service-agreement.pdf';

interface VehicleForm {
  registration: string;
  make: string;
  model: string;
  year: string;
  engineNumber: string;
  chassisNumber: string;
  mileage: string;
}

const emptyVehicle: VehicleForm = { registration: '', make: '', model: '', year: '2024', engineNumber: '', chassisNumber: '', mileage: '' };

export default function OnboardingScreen() {
  const { navigate, setOnboarded } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [personalForm, setPersonalForm] = useState({ fullName: '', phone: '', idNumber: '', address: '' });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idUploaded, setIdUploaded] = useState(false);
  
  const [vehiclesList, setVehiclesList] = useState<VehicleForm[]>([{ ...emptyVehicle }]);
  const [vehicleDocs, setVehicleDocs] = useState<{ logbook: File | null; insurance: File | null }[]>([{ logbook: null, insurance: null }]);
  
  const [signed, setSigned] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const steps = ['Personal Details', 'Add Vehicle', 'Agreement', 'Review & Submit'];

  // Step 1: Save personal details
  const handlePersonalSubmit = async () => {
    if (!personalForm.fullName || !personalForm.phone || !personalForm.idNumber) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await clientProfile.save({
        name: personalForm.fullName,
        phone: personalForm.phone,
        address: personalForm.address || undefined,
        id_number: personalForm.idNumber,
      });
      setStep(2);
    } catch (e: any) {
      setError(e.message || 'Failed to save. Try again.');
    }
    setLoading(false);
  };

  // Step 2: Save vehicles
  const handleVehicleSubmit = async () => {
    const v = vehiclesList[0];
    if (!v.registration || !v.make || !v.model || !v.mileage) {
      setError('Please fill all required vehicle fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await vehicles.add({
        registration: v.registration.toUpperCase(),
        make: v.make,
        model: v.model,
        year: Number(v.year),
        mileage: Number(v.mileage),
        engine_number: v.engineNumber || undefined,
        chassis_number: v.chassisNumber || undefined,
      });
      setStep(3);
    } catch (e: any) {
      setError(e.message || 'Failed to save vehicle. Try again.');
    }
    setLoading(false);
  };

  // Step 3: Upload documents
  const handleDocumentsSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Upload ID if provided
      if (idFile) {
        await documents.uploadClientId(idFile);
      }
      
      // Get vehicle ID and upload docs
      const { data: vehicleData } = await vehicles.list();
      if (vehicleData && vehicleData[0]) {
        const vid = vehicleData[0].id;
        if (vehicleDocs[0].logbook) {
          await documents.uploadVehicleDoc(vid, 'logbook', vehicleDocs[0].logbook);
        }
        if (vehicleDocs[0].insurance) {
          await documents.uploadVehicleDoc(vid, 'insurance', vehicleDocs[0].insurance);
        }
      }
      setStep(4);
    } catch (e: any) {
      setError(e.message || 'Failed to upload documents. Try again.');
    }
    setLoading(false);
  };

  // Final submit
  const handleSubmit = async () => {
    if (!signed || !declared) {
      setError('Please sign and accept the declaration');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Use secure submitForApproval - cannot bypass admin
      await clientProfile.submitForApproval();
      setSubmitted(true);
      setTimeout(() => {
        setOnboarded(true);
        navigate('home');
      }, 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to submit. Try again.');
    }
    setLoading(false);
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

      {/* Error */}
      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      {/* Content */}
      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        <div className="max-w-md mx-auto animate-fade-in">
          
          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Personal Details</h2>
              {[
                { label: 'Full Name *', key: 'fullName', placeholder: 'James Mwangi', type: 'text' },
                { label: 'Phone Number *', key: 'phone', placeholder: '+254 712 345 678', type: 'tel' },
                { label: 'ID Number *', key: 'idNumber', placeholder: '12345678', type: 'text' },
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
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    setIdFile(e.target.files?.[0] || null);
                    setIdUploaded(!!e.target.files?.[0]);
                  }}
                  className="w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground cursor-pointer"
                />
                {idUploaded && <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />}
              </div>
              <Button variant="amber" size="full" onClick={handlePersonalSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Continue'}
              </Button>
            </div>
          )}

          {/* Step 2: Vehicles */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Add Your Vehicle</h2>
              {vehiclesList.map((v, idx) => (
                <div key={idx} className="bg-card rounded-lg border p-4 space-y-3 card-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Vehicle {idx + 1}</span>
                  </div>
                  {[
                    { label: 'Registration *', key: 'registration', placeholder: 'KBZ 123X' },
                    { label: 'Make *', key: 'make', placeholder: 'Toyota' },
                    { label: 'Model *', key: 'model', placeholder: 'Vitz' },
                    { label: 'Engine Number', key: 'engineNumber', placeholder: '2NR-FKE-0847291' },
                    { label: 'Chassis Number', key: 'chassisNumber', placeholder: 'KSP130-0284751' },
                    { label: 'Current Mileage (KM) *', key: 'mileage', placeholder: '50000' },
                  ].map((f) => (
                    <div key={f.key} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                      <Input
                        placeholder={f.placeholder}
                        value={(v as any)[f.key]}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVehiclesList(vehiclesList.map((item, i) =>
                            i === idx ? { ...item, [f.key]: val } : item
                          ));
                        }}
                        className="h-10"
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Year *</label>
                    <select
                      value={v.year}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVehiclesList(vehiclesList.map((item, i) =>
                          i === idx ? { ...item, year: val } : item
                        ));
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
              <Button variant="amber" size="full" onClick={handleVehicleSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Continue'}
              </Button>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Vehicle Documents</h2>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Logbook *</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setVehicleDocs(vehicleDocs.map((d, i) => i === 0 ? { ...d, logbook: file } : d));
                  }}
                  className="w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Insurance *</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setVehicleDocs(vehicleDocs.map((d, i) => i === 0 ? { ...d, insurance: file } : d));
                  }}
                  className="w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground cursor-pointer"
                />
              </div>

              <Button variant="amber" size="full" onClick={handleDocumentsSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Continue'}
              </Button>
            </div>
          )}

          {/* Step 4: Agreement */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Agreement & Declaration</h2>
              <div className="bg-card rounded-lg border p-4 max-h-48 overflow-y-auto text-sm text-muted-foreground card-shadow">
                <h3 className="font-semibold text-foreground mb-2">Tinlip Autocare Service Agreement</h3>
                <p className="mb-2">This agreement is between Tinlip Autocare Limited ("Provider") and the client ("Client").</p>
                <p className="mb-2">1. Coverage: roadside assistance, towing, mechanical diagnosis, servicing, spares.</p>
                <p className="mb-2">2. Client Obligations: accurate info, valid insurance, prompt reporting.</p>
                <p className="mb-2">3. Payment: annual via M-Pesa. Coverage activates on payment.</p>
                <p>4. Claims: must be initiated through the Tinlip portal.</p>
              </div>
              <Button
                variant="outline"
                size="default"
                className="gap-2"
                onClick={() => window.open(AGREEMENT_PDF_URL, '_blank')}
              >
                <Download className="w-4 h-4" /> Download PDF
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
              <Button variant="amber" size="full" onClick={handleSubmit} disabled={loading || !signed || !declared}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Approval'}
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
