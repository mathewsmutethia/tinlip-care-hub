// ============================================
// TINLIP INCIDENT CREATE
// ============================================

import { useState, useEffect } from 'react';
import { vehicles, incidents } from '../lib/supabase';

export default function IncidentCreate() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otp, setOtp] = useState('');
  const [vehicleList, setVehicleList] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [mileage, setMileage] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState('');

  const incidentTypes = [
    { value: 'regular_service', label: 'Regular Service' },
    { value: 'roadside_assistance', label: 'Roadside Assistance' },
    { value: 'towing', label: 'Towing' },
    { value: 'mechanical_diagnosis', label: 'Mechanical Diagnosis' },
    { value: 'spares_request', label: 'Spares Request' },
  ];

  useEffect(() => { loadVehicles(); }, []);

  const loadVehicles = async () => {
    const { data } = await vehicles.list();
    const approved = data?.filter((v: any) => v.status === 'approved') || [];
    setVehicleList(approved);
  };

  const handleStart = () => {
    if (!selectedVehicle || !incidentType || !description || !location) {
      setError('Please fill all fields');
      return;
    }
    setError('');
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    
    setStep(2);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp !== generatedOtp) {
      setError('Invalid OTP');
      return;
    }
    setLoading(true);
    try {
      const { data, error: e } = await incidents.create({
        vehicle_id: selectedVehicle,
        type: incidentType,
        description,
        location,
        mileage,
        otp,
      });
      if (e) throw e;
      setSuccess(`Incident created! Claim code: ${data.claim_code}`);
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg">
          <div className="font-bold">{success}</div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Start New Incident</h2>

          <select
            value={selectedVehicle}
            onChange={e => setSelectedVehicle(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Select Vehicle *</option>
            {vehicleList.map(v => (
              <option key={v.id} value={v.id}>{v.registration} - {v.make} {v.model}</option>
            ))}
          </select>

          <div className="grid grid-cols-1 gap-2">
            {incidentTypes.map(t => (
              <button
                key={t.value}
                onClick={() => setIncidentType(t.value)}
                className={`p-3 border-2 rounded-lg text-left ${
                  incidentType === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-3 border rounded-lg"
            rows={3}
            placeholder="Describe the issue *"
          />

          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Current Location *"
            className="w-full p-3 border rounded-lg"
          />

          <input
            type="number"
            value={mileage}
            onChange={e => setMileage(Number(e.target.value))}
            placeholder="Current Mileage (optional)"
            className="w-full p-3 border rounded-lg"
          />

          <button onClick={handleStart} className="w-full py-3 bg-blue-600 text-white rounded-lg">
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Verify with OTP</h2>
          <p className="text-sm text-gray-600">Enter the 6-digit code sent to your phone</p>
          <input
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            className="w-full p-3 border rounded-lg text-center text-2xl tracking-widest"
            placeholder="000000"
            maxLength={6}
          />
          <button
            onClick={handleVerifyOtp}
            disabled={loading || otp.length !== 6}
            className="w-full py-3 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Verify & Create'}
          </button>
          <button onClick={() => setStep(1)} className="w-full py-2 text-gray-600">Back</button>
        </div>
      )}

      {step === 3 && (
        <div className="text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold">Incident Created!</h2>
          <button
            onClick={() => { setStep(1); setSuccess(''); setOtp(''); }}
            className="w-full py-3 bg-blue-600 text-white rounded-lg"
          >
            Start Another
          </button>
        </div>
      )}
    </div>
  );
}
