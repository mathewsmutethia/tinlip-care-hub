import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { useApp } from '@/context/AppContext';
import { vehicles, incidents } from '@/lib/supabase';
import { Car, Loader2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SERVICE_TYPES = [
  { id: 'regular_service',     label: 'Regular Service',       description: 'Scheduled maintenance',          icon: '🔧', price: 'KES 2,500 – 5,000'    },
  { id: 'roadside_assistance', label: 'Roadside Assistance',   description: 'Jump start, flat tire, lockout', icon: '🚗', price: 'KES 500 – 1,500'      },
  { id: 'towing',              label: 'Towing',                description: 'Vehicle breakdown recovery',     icon: '🚜', price: 'KES 1,500 – 3,000'    },
  { id: 'mechanical_diagnosis',label: 'Mechanical Diagnosis',  description: 'Check engine, diagnostics',      icon: '⚙️', price: 'KES 1,000 – 2,500'   },
  { id: 'spares_request',      label: 'Spares Request',        description: 'Request replacement parts',      icon: '🔩', price: 'Quote on inspection'   },
];

interface Props {
  children: React.ReactNode;
}

export default function GetHelpDrawer({ children }: Props) {
  const { navigate } = useApp();
  const [open, setOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState(1);
  const [vehicleList, setVehicleList] = useState<any[]>([]);
  const [activeVehicleIds, setActiveVehicleIds] = useState<Set<string>>(new Set());
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDrawerStep(1);
    setSelectedVehicle('');
    setSelectedType('');
    loadVehicles();
  }, [open]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const [{ data: vData }, { data: iData }] = await Promise.all([
        vehicles.list(),
        incidents.list(),
      ]);
      const active = vData?.filter((v: any) => ['active', 'approved'].includes(v.status)) ?? [];
      setVehicleList(active);
      const activeIds = new Set(
        (iData ?? [])
          .filter((i: any) => ['open', 'in_progress', 'service_assigned'].includes(i.status))
          .map((i: any) => i.vehicle_id as string)
      );
      setActiveVehicleIds(activeIds);
      if (active.length === 1) {
        setSelectedVehicle(active[0].id);
        setDrawerStep(2);
      }
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedVehicle || !selectedType) return;
    sessionStorage.setItem('tinlip_quickstart', JSON.stringify({ vehicleId: selectedVehicle, type: selectedType }));
    setOpen(false);
    navigate('new-incident');
  };

  const selectedVehicleData = vehicleList.find(v => v.id === selectedVehicle);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-2xl max-h-[90dvh] fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="w-8 h-1 bg-muted rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

          <div className="flex-1 overflow-y-auto px-5 pb-8 pt-3">

            {/* Step 1 — vehicle selection */}
            {drawerStep === 1 && (
              <div className="animate-fade-in">
                <Drawer.Title className="text-lg font-bold text-foreground mb-0.5">
                  Which vehicle?
                </Drawer.Title>
                <p className="text-sm text-muted-foreground mb-4">Select the vehicle that needs help</p>

                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!loading && vehicleList.length === 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl text-sm text-center dark:bg-yellow-950/20 dark:border-yellow-800/30 dark:text-yellow-400">
                    No approved vehicles yet. Complete onboarding to add your car.
                  </div>
                )}

                <div className="space-y-2">
                  {vehicleList.map((v) => {
                    const hasActive = activeVehicleIds.has(v.id);
                    return (
                      <button
                        key={v.id}
                        onClick={() => { setSelectedVehicle(v.id); setDrawerStep(2); }}
                        className={`w-full bg-card border-2 rounded-xl p-4 text-left transition-all ${
                          selectedVehicle === v.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                            <Car className="w-5 h-5 text-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono font-bold text-foreground">{v.registration}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {v.make} {v.model} · {v.year}
                            </p>
                          </div>
                          {hasActive && (
                            <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Active job
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2 — service type selection */}
            {drawerStep === 2 && (
              <div className="animate-fade-in">
                <button
                  onClick={() => { setDrawerStep(1); setSelectedType(''); }}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="font-mono font-bold">{selectedVehicleData?.registration}</span>
                </button>

                <Drawer.Title className="text-lg font-bold text-foreground mb-0.5">
                  What do you need?
                </Drawer.Title>
                <p className="text-sm text-muted-foreground mb-4">Select the type of service</p>

                <div className="space-y-2 mb-5">
                  {SERVICE_TYPES.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedType(opt.id)}
                      className={`w-full bg-card border-2 rounded-xl p-4 text-left transition-all flex items-center gap-3 ${
                        selectedType === opt.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl leading-none flex-shrink-0">{opt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.description}</p>
                      </div>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0">
                        {opt.price}
                      </span>
                    </button>
                  ))}
                </div>

                <Button
                  variant="amber"
                  size="full"
                  className="h-12"
                  disabled={!selectedType}
                  onClick={handleContinue}
                >
                  Continue — Add Details →
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Final price confirmed before work begins
                </p>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
