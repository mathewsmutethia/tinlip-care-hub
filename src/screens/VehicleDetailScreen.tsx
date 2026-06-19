import { useEffect, useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { vehicles, incidents, documents } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Car, FileText, CheckCircle2, ChevronRight, Loader2, ExternalLink, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SERVICE_LABELS: Record<string, string> = {
  regular_service: 'Regular Service',
  roadside_assistance: 'Roadside Assistance',
  towing: 'Towing',
  mechanical_diagnosis: 'Mechanical Diagnosis',
  spares_request: 'Spares Request',
};

export default function VehicleDetailScreen() {
  const { navigate, selectedVehicleId, selectIncident } = useApp();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<any>(null);
  const [vehicleIncidents, setVehicleIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [mileageOpen, setMileageOpen] = useState(false);
  const [newMileage, setNewMileage] = useState('');
  const [savingMileage, setSavingMileage] = useState(false);

  const [docUrls, setDocUrls] = useState<{ logbook: string | null; insurance: string | null }>({ logbook: null, insurance: null });
  const [loadingDocUrls, setLoadingDocUrls] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<{ logbook: boolean; insurance: boolean }>({ logbook: false, insurance: false });
  const logbookInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedVehicleId) return;
    Promise.all([
      vehicles.get(selectedVehicleId),
      incidents.listByVehicle(selectedVehicleId),
    ]).then(([vehicleRes, incidentsRes]) => {
      setVehicle(vehicleRes.data);
      setVehicleIncidents(incidentsRes.data ?? []);
      setLoading(false);
    });
  }, [selectedVehicleId]);

  useEffect(() => {
    if (!vehicle) return;
    if (!vehicle.logbook_url && !vehicle.insurance_url) return;
    setLoadingDocUrls(true);
    const promises = [
      vehicle.logbook_url ? documents.getSignedUrl(vehicle.logbook_url).catch(() => null) : Promise.resolve(null),
      vehicle.insurance_url ? documents.getSignedUrl(vehicle.insurance_url).catch(() => null) : Promise.resolve(null),
    ];
    Promise.all(promises).then(([logbook, insurance]) => {
      setDocUrls({ logbook, insurance });
      setLoadingDocUrls(false);
    });
  }, [vehicle]);

  const handleDocUpload = async (type: 'logbook' | 'insurance', file: File) => {
    if (!vehicle?.id) return;
    setUploadingDoc((prev) => ({ ...prev, [type]: true }));
    try {
      const { data, error } = await documents.uploadVehicleDoc(vehicle.id, type, file);
      if (error) throw error;
      setVehicle(data);
      toast({ title: `${type === 'logbook' ? 'Logbook' : 'Insurance'} uploaded` });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
    setUploadingDoc((prev) => ({ ...prev, [type]: false }));
  };

  const handleSaveMileage = async () => {
    const val = Number(newMileage);
    if (!val || val <= 0 || val > 999999) {
      toast({ title: 'Enter a valid mileage (1 – 999,999 km)', variant: 'destructive' });
      return;
    }
    setSavingMileage(true);
    try {
      const { data } = await vehicles.update(selectedVehicleId!, { mileage: val });
      setVehicle(data);
      setMileageOpen(false);
      setNewMileage('');
      toast({ title: 'Mileage updated' });
    } catch {
      toast({ title: 'Failed to update mileage', variant: 'destructive' });
    }
    setSavingMileage(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <>
      <div className="pb-20 md:pb-4 animate-fade-in">
        <div className="px-4 pt-4 pb-4 flex items-center gap-3 md:px-0">
          <button onClick={() => navigate('vehicles')} className="p-2 -ml-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold text-foreground">Vehicle Details</h1>
        </div>

        <div className="px-4 space-y-4 md:px-0">
          {/* Header Card */}
          <div className="bg-card border rounded-xl p-4 card-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                <Car className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-foreground">{vehicle.registration}</p>
                <StatusBadge
                  status={['active','approved'].includes(vehicle.status) ? 'Active' : vehicle.status === 'pending' ? 'Pending' : 'Inactive'}
                  variant={['active','approved'].includes(vehicle.status) ? 'active' : vehicle.status === 'pending' ? 'warning' : 'inactive'}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Make', vehicle.make ?? '—'],
                ['Model', vehicle.model ?? '—'],
                ['Year', vehicle.year ?? '—'],
                ['Mileage', vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} km` : '—'],
                ['Engine No.', vehicle.engine_number ?? '—'],
                ['Chassis No.', vehicle.chassis_number ?? '—'],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium text-foreground">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-card border rounded-xl p-4 card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-3">Documents</h3>
            <input ref={logbookInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload('logbook', f); e.target.value = ''; }} />
            <input ref={insuranceInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload('insurance', f); e.target.value = ''; }} />
            <div className="space-y-2">
              {[
                { label: 'Logbook', type: 'logbook' as const, uploaded: !!vehicle.logbook_url, url: docUrls.logbook, ref: logbookInputRef },
                { label: 'Insurance Certificate', type: 'insurance' as const, uploaded: !!vehicle.insurance_url, url: docUrls.insurance, ref: insuranceInputRef },
              ].map((doc) => (
                <div key={doc.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{doc.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.uploaded ? (
                      loadingDocUrls ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary text-xs font-medium">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      )
                    ) : null}
                    {uploadingDoc[doc.type] ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <button
                        onClick={() => doc.ref.current?.click()}
                        className="flex items-center gap-1 text-primary text-xs font-medium hover:underline"
                      >
                        <Upload className="w-3 h-3" />
                        {doc.uploaded ? 'Replace' : 'Upload'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service History */}
          <div className="bg-card border rounded-xl p-4 card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-3">Service History</h3>
            {vehicleIncidents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No services for this vehicle yet</p>
            ) : (
              <div className="space-y-2">
                {vehicleIncidents.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => { selectIncident(inc.id); navigate('incident-detail'); }}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 text-left hover:bg-secondary transition-colors"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">{inc.claim_code}</p>
                      <p className="text-xs text-muted-foreground">
                        {SERVICE_LABELS[inc.type] ?? inc.type} · {new Date(inc.created_at).toLocaleDateString('en-KE')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" size="full" onClick={() => { setNewMileage(vehicle.mileage?.toString() ?? ''); setMileageOpen(true); }}>
            Update Mileage
          </Button>
        </div>
      </div>

      {/* Update Mileage Dialog */}
      <Dialog open={mileageOpen} onOpenChange={setMileageOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Mileage</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm text-muted-foreground mb-1.5 block">Current odometer reading (km)</label>
            <Input
              type="number"
              value={newMileage}
              onChange={(e) => setNewMileage(e.target.value)}
              placeholder="e.g. 75000"
              className="h-12"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMileageOpen(false)}>Cancel</Button>
            <Button variant="amber" onClick={handleSaveMileage} disabled={savingMileage}>
              {savingMileage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
