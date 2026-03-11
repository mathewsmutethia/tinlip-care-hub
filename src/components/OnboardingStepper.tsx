// ============================================
// TINLIP ONBOARDING STEPPER
// ============================================

import { useState } from 'react';
import { clientProfile, vehicles, documents, auth } from '../lib/supabase';

interface OnboardingData {
  name: string;
  phone: string;
  companyName: string;
  address: string;
  idNumber: string;
  idDocument: File | null;
  vehicles: {
    registration: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
    engineNumber: string;
    chassisNumber: string;
    logbook: File | null;
    insurance: File | null;
  }[];
}

export default function OnboardingStepper() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    phone: '',
    companyName: '',
    address: '',
    idNumber: '',
    idDocument: null,
    vehicles: [{
      registration: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: 0,
      engineNumber: '',
      chassisNumber: '',
      logbook: null,
      insurance: null,
    }],
  });

  const steps = [
    { num: 1, title: 'Your Details' },
    { num: 2, title: 'Vehicle Info' },
    { num: 3, title: 'Documents' },
    { num: 4, title: 'Agreement' },
  ];

  const handleClientDetails = async () => {
    if (!data.name || !data.phone || !data.idNumber) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      await clientProfile.save({
        name: data.name,
        phone: data.phone,
        company_name: data.companyName || undefined,
        address: data.address || undefined,
        id_number: data.idNumber,
      });
      setStep(2);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleVehicleDetails = async () => {
    const v = data.vehicles[0];
    if (!v.registration || !v.make || !v.model || !v.mileage) {
      setError('Please fill all required vehicle fields');
      return;
    }
    setLoading(true);
    try {
      await vehicles.add({
        registration: v.registration,
        make: v.make,
        model: v.model,
        year: v.year,
        mileage: v.mileage,
        engine_number: v.engineNumber || undefined,
        chassis_number: v.chassisNumber || undefined,
      });
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleDocumentUpload = async () => {
    setLoading(true);
    try {
      if (data.idDocument) {
        await documents.uploadClientId(data.idDocument);
      }
      const { data: vehicleList } = await vehicles.list();
      if (vehicleList && vehicleList[0]) {
        const vid = vehicleList[0].id;
        if (data.vehicles[0].logbook) {
          await documents.uploadVehicleDoc(vid, 'logbook', data.vehicles[0].logbook);
        }
        if (data.vehicles[0].insurance) {
          await documents.uploadVehicleDoc(vid, 'insurance', data.vehicles[0].insurance);
        }
      }
      setStep(4);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!agreed) {
      setError('Please accept the agreement');
      return;
    }
    setLoading(true);
    try {
      await clientProfile.updateStatus('pending_approval');
      alert('Application submitted! We will review within 24 hours.');
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress */}
      <div className="flex justify-between mb-8">
        {steps.map(s => (
          <div key={s.num} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= s.num ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              {s.num}
            </div>
            <div className="text-xs mt-1">{s.title}</div>
          </div>
        ))}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Your Details</h2>
          <input
            type="text"
            value={data.name}
            onChange={e => setData({ ...data, name: e.target.value })}
            placeholder="Full Name *"
            className="w-full p-3 border rounded-lg"
          />
          <input
            type="tel"
            value={data.phone}
            onChange={e => setData({ ...data, phone: e.target.value })}
            placeholder="Phone *"
            className="w-full p-3 border rounded-lg"
          />
          <input
            type="text"
            value={data.companyName}
            onChange={e => setData({ ...data, companyName: e.target.value })}
            placeholder="Company Name (optional)"
            className="w-full p-3 border rounded-lg"
          />
          <input
            type="text"
            value={data.idNumber}
            onChange={e => setData({ ...data, idNumber: e.target.value })}
            placeholder="ID Number *"
            className="w-full p-3 border rounded-lg"
          />
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setData({ ...data, idDocument: e.target.files?.[0] || null })}
            className="w-full p-3 border rounded-lg"
          />
          <button onClick={handleClientDetails} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg">
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Vehicle Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={data.vehicles[0].registration}
              onChange={e => setData({ ...data, vehicles: [{ ...data.vehicles[0], registration: e.target.value.toUpperCase() }] })}
              placeholder="Registration *"
              className="w-full p-3 border rounded-lg"
            />
            <select
              value={data.vehicles[0].year}
              onChange={e => setData({ ...data, vehicles: [{ ...data.vehicles[0], year: Number(e.target.value) }] })}
              className="w-full p-3 border rounded-lg"
            >
              {Array.from({ length: 30 }, (_, i) => 2025 - i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={data.vehicles[0].make}
              onChange={e => setData({ ...data, vehicles: [{ ...data.vehicles[0], make: e.target.value }] })}
              placeholder="Make *"
              className="w-full p-3 border rounded-lg"
            />
            <input
              type="text"
              value={data.vehicles[0].model}
              onChange={e => setData({ ...data, vehicles: [{ ...data.vehicles[0], model: e.target.value }] })}
              placeholder="Model *"
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <input
            type="number"
            value={data.vehicles[0].mileage}
            onChange={e => setData({ ...data, vehicles: [{ ...data.vehicles[0], mileage: Number(e.target.value) }] })}
            placeholder="Current Mileage (KM) *"
            className="w-full p-3 border rounded-lg"
          />
          <button onClick={handleVehicleDetails} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg">
            {loading ? 'Saving...' : 'Continue'}
          </button>
          <button onClick={() => setStep(1)} className="w-full py-2 text-gray-600">Back</button>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Vehicle Documents</h2>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setData({ ...data, vehicles: [{ ...data.vehicles[0], logbook: e.target.files?.[0] || null }] })}
            placeholder="Logbook *"
            className="w-full p-3 border rounded-lg"
          />
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setData({ ...data, vehicles: [{ ...data.vehicles[0], insurance: e.target.files?.[0] || null }] })}
            placeholder="Insurance *"
            className="w-full p-3 border rounded-lg"
          />
          <button onClick={handleDocumentUpload} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg">
            {loading ? 'Uploading...' : 'Continue'}
          </button>
          <button onClick={() => setStep(2)} className="w-full py-2 text-gray-600">Back</button>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Agreement & Declaration</h2>
          <div className="p-4 bg-gray-50 rounded-lg text-sm">
            <p className="font-semibold mb-2">Tinlip Autocare Service Agreement</p>
            <p className="text-gray-600">By checking this box, I confirm all information is accurate and agree to the terms.</p>
          </div>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1" />
            <span className="text-sm">I confirm all information is accurate and agree to the terms.</span>
          </label>
          <button onClick={handleSubmit} disabled={loading || !agreed} className="w-full py-3 bg-green-600 text-white rounded-lg disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
          <button onClick={() => setStep(3)} className="w-full py-2 text-gray-600">Back</button>
        </div>
      )}
    </div>
  );
}
