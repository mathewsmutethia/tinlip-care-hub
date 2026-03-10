import { useApp } from '@/context/AppContext';
import { mockIncidents } from '@/lib/mockData';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, Car, MessageSquare } from 'lucide-react';

export default function IncidentDetailScreen() {
  const { navigate, selectedIncidentId } = useApp();
  const incident = mockIncidents.find(i => i.id === selectedIncidentId);
  if (!incident) return null;

  return (
    <div className="pb-20 md:pb-4 animate-fade-in">
      <div className="px-4 pt-4 pb-4 flex items-center gap-3 md:px-0">
        <button onClick={() => navigate('incidents')} className="p-2 -ml-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold text-foreground">Incident Details</h1>
      </div>

      <div className="px-4 space-y-4 md:px-0">
        {/* Header */}
        <div className="bg-card border rounded-xl p-4 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-lg font-bold text-foreground">{incident.claimRef}</span>
            <StatusBadge
              status={incident.statusLabel}
              variant={incident.status === 'closed' ? 'inactive' : incident.status === 'in-progress' ? 'warning' : incident.status === 'completed' ? 'success' : 'info'}
            />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Car className="w-4 h-4" />
              <span>{incident.vehicleReg} · {incident.vehicleName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-secondary px-2 py-0.5 rounded-full text-xs font-medium text-foreground">{incident.typeLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{incident.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{incident.createdAt}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-foreground">{incident.description}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card border rounded-xl p-4 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-4">Status Timeline</h3>
          <div className="space-y-0">
            {incident.timeline.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${step.completed ? 'bg-primary border-primary' : 'bg-card border-muted'}`} />
                  {i < incident.timeline.length - 1 && (
                    <div className={`w-0.5 h-8 ${step.completed ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
                <div className="pb-4 -mt-0.5">
                  <p className={`text-sm font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                  {step.timestamp && <p className="text-xs text-muted-foreground">{step.timestamp}</p>}
                  {!step.completed && !step.timestamp && <p className="text-xs text-muted-foreground">Pending</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider */}
        {incident.providerName && (
          <div className="bg-card border rounded-xl p-4 card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-2">Assigned Provider</h3>
            <p className="text-sm text-foreground font-medium">{incident.providerName}</p>
            <p className="text-xs text-muted-foreground">{incident.providerType}</p>
          </div>
        )}

        {/* Feedback prompt */}
        {incident.status === 'completed' && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-sm font-medium text-foreground mb-3">Please confirm your service was completed</p>
            <Button variant="amber" size="full" onClick={() => navigate('service-feedback')}>Confirm & Rate Service</Button>
          </div>
        )}
      </div>
    </div>
  );
}
