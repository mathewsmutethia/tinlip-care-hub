import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { incidents } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import { ChevronRight, Plus, Zap, Star, Search, Loader2 } from 'lucide-react';

export default function IncidentsScreen() {
  const { navigate, selectIncident } = useApp();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [incidentList, setIncidentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    try {
      const { data, error } = await incidents.list();
      if (error) throw error;
      setIncidentList(data || []);
    } catch (err) {
      console.error('Error loading incidents:', err);
    } finally {
      setLoading(false);
    }
  }

  const activeIncidents = incidentList.filter((i: any) => i.status !== 'closed' && i.status !== 'resolved');
  const pastIncidents = incidentList.filter((i: any) => i.status === 'closed' || i.status === 'resolved');
  const displayed = tab === 'active' ? activeIncidents : pastIncidents;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'assigned': 'Assigned',
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'active' | 'pending' | 'warning' | 'success'> = {
      'open': 'warning',
      'in_progress': 'pending',
      'assigned': 'pending',
      'resolved': 'success',
      'closed': 'success'
    };
    return variants[status] || 'pending';
  };

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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
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
            displayed.map((incident: any) => (
              <button
                key={incident.id}
                onClick={() => { selectIncident(incident.id); navigate('incident-detail'); }}
                className="w-full bg-card border rounded-xl p-4 card-shadow text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-sm font-bold text-foreground">{incident.claim_code || incident.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{incident.vehicles?.registration || 'N/A'}</p>
                  </div>
                  <StatusBadge status={getStatusLabel(incident.status)} variant={getStatusVariant(incident.status)} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{incident.type || 'General'}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))
          )}

          <Button variant="amber" size="full" className="gap-2 mt-4" onClick={() => navigate('new-incident')}>
            <Plus className="w-4 h-4" /> New Incident
          </Button>
        </div>
      )}
    </div>
  );
}

import { Button } from '@/components/ui/button';
