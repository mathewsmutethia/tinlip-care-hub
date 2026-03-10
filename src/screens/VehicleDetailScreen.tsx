import { useApp } from '@/context/AppContext';
import { mockVehicles, mockIncidents } from '@/lib/mockData';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Car, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

export default function VehicleDetailScreen() {
  const { navigate, selectedVehicleId, selectIncident } = useApp();
  const vehicle = mockVehicles.find(v => v.id === selectedVehicleId);
  if (!vehicle) return null;

  const vehicleIncidents = mockIncidents.filter(i => i.vehicleId === vehicle.id);

  return (
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
              <StatusBadge status={vehicle.status === 'active' ? 'Active' : 'Inactive'} variant={vehicle.status === 'active' ? 'active' : 'inactive'} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Make', vehicle.make],
              ['Model', vehicle.model],
              ['Year', vehicle.year],
              ['Mileage', `${vehicle.mileage.toLocaleString()} km`],
              ['Engine No.', vehicle.engineNumber],
              ['Chassis No.', vehicle.chassisNumber],
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
          <div className="space-y-2">
            {[
              { label: 'Logbook', uploaded: vehicle.logbookUploaded },
              { label: 'Insurance Certificate', uploaded: vehicle.insuranceUploaded },
            ].map((doc) => (
              <div key={doc.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{doc.label}</span>
                </div>
                {doc.uploaded ? <CheckCircle2 className="w-4 h-4 text-success" /> : <span className="text-xs text-muted-foreground">Not uploaded</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Incident History */}
        <div className="bg-card border rounded-xl p-4 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-3">Incident History</h3>
          {vehicleIncidents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No incidents for this vehicle 😊</p>
          ) : (
            <div className="space-y-2">
              {vehicleIncidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => { selectIncident(inc.id); navigate('incident-detail'); }}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 text-left hover:bg-secondary transition-colors"
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-foreground">{inc.claimRef}</p>
                    <p className="text-xs text-muted-foreground">{inc.typeLabel} · {inc.createdAt}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>

        <Button variant="outline" size="full">Update Mileage</Button>
      </div>
    </div>
  );
}
