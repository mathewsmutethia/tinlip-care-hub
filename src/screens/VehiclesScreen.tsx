import { useApp } from '@/context/AppContext';
import { mockVehicles } from '@/lib/mockData';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Plus, Car } from 'lucide-react';

export default function VehiclesScreen() {
  const { navigate, selectVehicle } = useApp();

  return (
    <div className="pb-20 md:pb-4 animate-fade-in">
      <div className="px-4 pt-6 pb-4 md:px-0">
        <h1 className="text-2xl font-bold text-foreground">My Vehicles</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{mockVehicles.length} registered vehicles</p>
      </div>

      <div className="px-4 space-y-3 md:px-0">
        {mockVehicles.map((v) => (
          <button
            key={v.id}
            onClick={() => { selectVehicle(v.id); navigate('vehicle-detail'); }}
            className="w-full bg-card border rounded-xl p-4 card-shadow text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Car className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="font-mono text-base font-bold text-foreground">{v.registration}</p>
                  <p className="text-sm text-muted-foreground">{v.make} {v.model} · {v.year}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground mt-1" />
            </div>
            <div className="flex items-center justify-between mt-3">
              <StatusBadge status={v.status === 'active' ? 'Active' : v.status === 'pending' ? 'Pending Approval' : 'Inactive'} variant={v.status === 'active' ? 'active' : v.status === 'pending' ? 'pending' : 'inactive'} />
              <span className="text-xs text-muted-foreground">{v.mileage.toLocaleString()} km</span>
            </div>
          </button>
        ))}

        <Button variant="amber" size="full" className="gap-2 mt-4" onClick={() => navigate('onboarding')}>
          <Plus className="w-4 h-4" /> Add Vehicle
        </Button>
      </div>
    </div>
  );
}
