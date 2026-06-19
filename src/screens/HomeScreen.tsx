import { useApp } from '@/context/AppContext';
import { vehicles, incidents } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import GetHelpDrawer from '@/components/GetHelpDrawer';
import { Button } from '@/components/ui/button';
import {
  Zap, Car, CreditCard, ClipboardList, ChevronRight,
  Shield, Loader2, CheckCircle2, Circle, ArrowRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const SERVICE_LABELS: Record<string, string> = {
  regular_service:     'Regular Service',
  roadside_assistance: 'Roadside Assistance',
  towing:              'Towing',
  mechanical_diagnosis:'Mechanical Diagnosis',
  spares_request:      'Spares Request',
};

export default function HomeScreen() {
  const { navigate, selectIncident, profile, user } = useApp();
  const [vehicleCount, setVehicleCount] = useState(0);
  const [incidentCount, setIncidentCount] = useState(0);
  const [activeIncident, setActiveIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [displayedName, setDisplayedName] = useState('');
  const [typingDone, setTypingDone] = useState(false);

  const fullFirstName =
    profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const initials = (profile?.name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  // Typewriter greeting
  useEffect(() => {
    setDisplayedName('');
    setTypingDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayedName(fullFirstName.slice(0, i));
      if (i >= fullFirstName.length) {
        clearInterval(timer);
        setTypingDone(true);
      }
    }, 60);
    return () => clearInterval(timer);
  }, [fullFirstName]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [vehiclesRes, incidentsRes] = await Promise.all([
        vehicles.list(),
        incidents.list(),
      ]);
      setVehicleCount(vehiclesRes.data?.filter((v: any) => ['active', 'approved'].includes(v.status)).length || 0);
      setIncidentCount(incidentsRes.data?.length || 0);
      const active = (incidentsRes.data ?? []).find(
        (i: any) => i.status !== 'closed' && i.status !== 'resolved',
      );
      setActiveIncident(active || null);
    } catch {
      // non-fatal — dashboard still renders
    } finally {
      setLoading(false);
    }
  }

  const hasActiveCoverage = profile?.status === 'active';
  const isPending = profile?.status === 'pending_approval';
  const isNewUser = !loading && vehicleCount === 0;

  const setupSteps = [
    { label: 'Account created', done: true },
    { label: 'Add your vehicle', done: vehicleCount > 0, action: () => navigate('onboarding'), cta: 'Add Now' },
    { label: 'Activate coverage', done: hasActiveCoverage, action: () => navigate('coverage'), cta: 'Pay via M-Pesa' },
  ];

  // Context-aware nudge (shown when there's something actionable)
  const nudge = (() => {
    if (loading) return null;
    if (isNewUser) return { text: 'Add your first vehicle to get covered', cta: 'Add Vehicle', action: () => navigate('onboarding') };
    if (isPending) return { text: "Your account is under review — we'll notify you shortly", cta: null, action: null };
    if (hasActiveCoverage) return null;
    return null;
  })();

  return (
    <div className="pb-20 md:pb-4 animate-fade-in">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Hello, {displayedName}
              {!typingDone && <span className="animate-pulse-amber">|</span>}
            </h1>
            {nudge ? (
              nudge.action ? (
                <button
                  onClick={nudge.action}
                  className="text-sm text-primary font-medium mt-0.5 flex items-center gap-1 hover:underline"
                >
                  {nudge.text} <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <p className="text-sm text-muted-foreground mt-0.5">{nudge.text}</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">
                {hasActiveCoverage ? 'Your vehicles are protected' : 'Let\'s get your car covered'}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
            {initials}
          </div>
        </div>
      </div>

      {/* Hero CTA — primary revenue action */}
      <div className="px-4 mb-4 md:px-0">
        <GetHelpDrawer>
          <Button
            variant="amber"
            size="full"
            className="h-14 text-base font-bold gap-2 shadow-lg btn-pulse"
          >
            <Zap className="w-5 h-5" />
            Get Help Now
          </Button>
        </GetHelpDrawer>
      </div>

      {/* Secondary actions */}
      <div className="px-4 mb-5 md:px-0">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Car,          label: 'My Vehicles', action: () => navigate('vehicles')  },
            { icon: CreditCard,   label: 'Pay Premium', action: () => navigate('coverage')  },
            { icon: ClipboardList,label: 'History',     action: () => navigate('incidents') },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border card-shadow hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary text-foreground">
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Status card */}
      <div className="px-4 mb-4 md:px-0">
        {loading ? (
          <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading…</span>
          </div>
        ) : hasActiveCoverage ? (
          <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-success flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-success">Coverage Active</p>
              <p className="text-xs text-success/80">Your vehicles are protected</p>
            </div>
          </div>
        ) : isNewUser ? (
          <div className="bg-card border rounded-xl p-4 card-shadow">
            <p className="text-sm font-semibold text-foreground mb-3">Complete your setup</p>
            <div className="space-y-3">
              {setupSteps.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  {s.done
                    ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    : <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  }
                  <span className={`text-sm flex-1 ${s.done ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>
                    {s.label}
                  </span>
                  {!s.done && s.action && (
                    <button
                      onClick={s.action}
                      className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap"
                    >
                      {s.cta}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : isPending ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 dark:bg-amber-950/20 dark:border-amber-800/30">
            <Shield className="w-5 h-5 text-warning flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-warning">Coverage pending approval</p>
              <p className="text-xs text-warning/80">We'll notify you once your account is activated</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Stats */}
      <div className="px-4 mb-5 md:px-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Registered Vehicles</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : vehicleCount}
            </p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Services Requested</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : incidentCount}
            </p>
          </div>
        </div>
      </div>

      {/* Active Job */}
      {!loading && activeIncident && (
        <div className="px-4 mb-5 md:px-0">
          <h2 className="text-sm font-semibold text-foreground mb-3">Active Job</h2>
          <button
            onClick={() => { selectIncident(activeIncident.id); navigate('incident-detail'); }}
            className="w-full bg-card border rounded-xl p-4 card-shadow text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground">Reference #</p>
                <span className="font-mono text-sm font-bold text-foreground">{activeIncident.claim_code}</span>
              </div>
              <StatusBadge status={activeIncident.status} variant="warning" />
            </div>
            <p className="text-sm text-muted-foreground">
              {activeIncident.vehicles?.registration ?? '—'} · {SERVICE_LABELS[activeIncident.type] ?? activeIncident.type}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">
                {new Date(activeIncident.created_at).toLocaleDateString('en-KE')}
              </span>
              <span className="text-xs font-medium text-primary flex items-center gap-1">
                View Details <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Recent Activity */}
      {!loading && (
        <div className="px-4 md:px-0">
          <h2 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h2>
          <div className="bg-card border rounded-xl p-4">
            {vehicleCount === 0 ? (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground mb-3">
                  No activity yet. Add your vehicle to get started.
                </p>
                <Button variant="amber" size="sm" onClick={() => navigate('onboarding')}>
                  Add Vehicle
                </Button>
              </div>
            ) : incidentCount === 0 ? (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground mb-3">
                  No services yet. Tap "Get Help Now" when you need assistance.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {vehicleCount} vehicle{vehicleCount !== 1 ? 's' : ''} · {incidentCount} service{incidentCount !== 1 ? 's' : ''} on record
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
