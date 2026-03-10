import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { mockIncidents } from '@/lib/mockData';
import StatusBadge from '@/components/StatusBadge';
import { ChevronRight, Plus, Zap, Star, Search } from 'lucide-react';

export default function IncidentsScreen() {
  const { navigate, selectIncident } = useApp();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const activeIncidents = mockIncidents.filter(i => i.status !== 'closed');
  const pastIncidents = mockIncidents.filter(i => i.status === 'closed');
  const displayed = tab === 'active' ? activeIncidents : pastIncidents;

  return (
    <div className="pb-20 md:pb-4 animate-fade-in">
      <div className="px-4 pt-6 pb-4 md:px-0">
        <h1 className="text-2xl font-bold text-foreground">Incidents</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your service requests</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4 md:px-0">
        <div className="flex bg-secondary rounded-lg p-1">
          {(['active', 'past'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === t ? 'bg-card text-foreground card-shadow' : 'text-muted-foreground'}`}
            >
              {t === 'active' ? `Active (${activeIncidents.length})` : 'Past'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3 md:px-0">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-1">
              {tab === 'active' ? 'No active incidents' : 'No past incidents'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {tab === 'active' ? "Hopefully it stays that way 😊" : 'Your history will appear here'}
            </p>
          </div>
        ) : (
          displayed.map((incident) => (
            <button
              key={incident.id}
              onClick={() => { selectIncident(incident.id); navigate('incident-detail'); }}
              className={`w-full bg-card border rounded-xl p-4 card-shadow text-left hover:shadow-md transition-shadow ${incident.status === 'closed' ? 'opacity-80' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-sm font-bold text-foreground">{incident.claimRef}</span>
                <StatusBadge
                  status={incident.statusLabel}
                  variant={incident.status === 'closed' ? 'inactive' : incident.status === 'in-progress' ? 'warning' : 'info'}
                />
              </div>
              <p className="text-sm text-muted-foreground">{incident.vehicleReg}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-foreground font-medium">{incident.typeLabel}</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">{incident.status === 'closed' ? `Closed ${incident.closedAt}` : incident.createdAt}</span>
                <div className="flex items-center gap-2">
                  {incident.rating && (
                    <span className="flex items-center gap-0.5 text-xs text-primary"><Star className="w-3 h-3 fill-primary" />{incident.rating}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('new-incident')}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:brightness-110 transition-all active:scale-95 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
