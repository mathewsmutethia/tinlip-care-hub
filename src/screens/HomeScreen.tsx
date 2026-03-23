import { useApp } from '@/context/AppContext';
import { mockIncidents, getGreeting, formatKES } from '@/lib/mockData';
import { vehicles, incidents, clientProfile } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import { Zap, Car, CreditCard, ClipboardList, ChevronRight, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  const { navigate, selectIncident, selectVehicle, profile, user } = useApp();
  const [vehicleCount, setVehicleCount] = useState(0);
  const [incidentCount, setIncidentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const displayName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const initials = (profile?.name || user?.email || 'U').split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || 'U';

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [vehiclesRes, incidentsRes] = await Promise.all([
        vehicles.list(),
        incidents.list()
      ]);
      setVehicleCount(vehiclesRes.data?.length || 0);
      setIncidentCount(incidentsRes.data?.length || 0);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  const activeIncident = mockIncidents.find(i => i.status !== 'closed');
  const hasActiveCoverage = profile?.status === 'active';

  return (
    <div className="pb-20 md:pb-4 animate-fade-in">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{getGreeting()}, {displayName} 👋</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Let's keep your vehicles protected</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            {initials}
          </div>
        </div>
      </div>

      {/* Coverage banner */}
      <div className="px-4 mb-4 md:px-0">
        {hasActiveCoverage ? (
          <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-success flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-success">Coverage Active</p>
              <p className="text-xs text-success/80">Your vehicles are protected</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber/10 border border-amber/20 rounded-xl p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber">Complete setup to activate coverage</p>
              <p className="text-xs text-amber/80">Add vehicles to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6 md:px-0">
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Zap, label: 'New\nIncident', action: () => navigate('new-incident'), color: 'bg-primary/10 text-primary' },
            { icon: Car, label: 'My\nVehicles', action: () => navigate('vehicles'), color: 'bg-secondary text-foreground' },
            { icon: CreditCard, label: 'Pay\nPremium', action: () => navigate('coverage'), color: 'bg-secondary text-foreground' },
            { icon: ClipboardList, label: 'My\nHistory', action: () => navigate('incidents'), color: 'bg-secondary text-foreground' },
          ].map((item, i) => (
            <button key={i} onClick={item.action} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border card-shadow hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-foreground text-center whitespace-pre-line leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-6 md:px-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Registered Vehicles</p>
            <p className="text-2xl font-bold text-foreground">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : vehicleCount}</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Total Incidents</p>
            <p className="text-2xl font-bold text-foreground">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : incidentCount}</p>
          </div>
        </div>
      </div>

      {/* Active Incident */}
      {activeIncident && (
        <div className="px-4 mb-6 md:px-0">
          <h2 className="text-sm font-semibold text-foreground mb-3">Active Incident</h2>
          <button
            onClick={() => { selectIncident(activeIncident.id); navigate('incident-detail'); }}
            className="w-full bg-card border rounded-xl p-4 card-shadow text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="font-mono text-sm font-bold text-foreground">{activeIncident.claimRef}</span>
              <StatusBadge status={activeIncident.statusLabel} variant="warning" />
            </div>
            <p className="text-sm text-muted-foreground">{activeIncident.vehicleReg} · {activeIncident.typeLabel}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">{activeIncident.createdAt}</span>
              <span className="text-xs font-medium text-primary flex items-center gap-1">View Details <ChevronRight className="w-3 h-3" /></span>
            </div>
          </button>
        </div>
      )}

      {/* Recent Activity */}
      <div className="px-4 md:px-0">
        <h2 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h2>
        <div className="bg-card border rounded-xl p-4">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : vehicleCount === 0 && incidentCount === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity. Add your first vehicle to get started!</p>
          ) : (
            <p className="text-sm text-muted-foreground">You have {vehicleCount} vehicle(s) and {incidentCount} incident(s) on record.</p>
          )}
        </div>
      </div>
    </div>
  );
}
