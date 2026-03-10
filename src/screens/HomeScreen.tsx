import { useApp } from '@/context/AppContext';
import { mockUser, mockVehicles, mockIncidents, mockPayments, getGreeting, getDaysRemaining, formatKES } from '@/lib/mockData';
import StatusBadge from '@/components/StatusBadge';
import { Zap, Car, CreditCard, ClipboardList, ChevronRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomeScreen() {
  const { navigate, selectIncident, selectVehicle } = useApp();
  const daysRemaining = getDaysRemaining(mockUser.coverageEnd);
  const activeIncident = mockIncidents.find(i => i.status !== 'closed');

  return (
    <div className="pb-20 md:pb-4 animate-fade-in">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{getGreeting()}, James 👋</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Let's keep your vehicles protected</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            JM
          </div>
        </div>
      </div>

      {/* Coverage banner */}
      <div className="px-4 mb-4 md:px-0">
        {mockUser.coverageStatus === 'active' && (
          <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-success flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-success">Coverage Active</p>
              <p className="text-xs text-success/80">Expires {mockUser.coverageEnd}</p>
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
      <div className="px-4 mb-6 md:px-0">
        <h2 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h2>
        <div className="space-y-2">
          {mockIncidents.slice(0, 3).map((incident) => (
            <button
              key={incident.id}
              onClick={() => { selectIncident(incident.id); navigate('incident-detail'); }}
              className="w-full bg-card border rounded-xl p-3 card-shadow text-left flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${incident.status === 'closed' ? 'bg-muted' : 'bg-primary/10'}`}>
                <Zap className={`w-4 h-4 ${incident.status === 'closed' ? 'text-muted-foreground' : 'text-primary'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{incident.typeLabel}</p>
                <p className="text-xs text-muted-foreground">{incident.vehicleReg} · {incident.createdAt}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Coverage Summary */}
      <div className="px-4 md:px-0">
        <h2 className="text-sm font-semibold text-foreground mb-3">Coverage Summary</h2>
        <div className="bg-card border rounded-xl p-4 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Coverage Period</p>
              <p className="text-sm font-medium text-foreground">{mockUser.coverageStart} — {mockUser.coverageEnd}</p>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{daysRemaining} days remaining</span>
              <span className="text-muted-foreground">{Math.round((daysRemaining / 365) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(daysRemaining / 365) * 100}%` }} />
            </div>
          </div>
          {daysRemaining <= 30 && (
            <Button variant="amber" size="sm" className="mt-2" onClick={() => navigate('coverage')}>Renew Now</Button>
          )}
        </div>
      </div>
    </div>
  );
}
