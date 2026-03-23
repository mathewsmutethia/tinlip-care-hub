import { useApp } from '@/context/AppContext';
import { vehicles } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Plus, Car, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function VehiclesScreen() {
  const { navigate, selectVehicle } = useApp();
  const [vehicleList, setVehicleList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    try {
      const { data, error } = await vehicles.list();
      if (error) throw error;
      setVehicleList(data || []);
    } catch (err) {
      console.error('Error loading vehicles:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-4 animate-fade-in">
      <div className="px-4 pt-6 pb-4 md:px-0">
        <h1 className="text-2xl font-bold text-foreground">My Vehicles</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{vehicleList.length} registered vehicles</p>
      </div>

      <div className="px-4 space-y-3 md:px-0">
        {vehicleList.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No vehicles registered yet.</p>
          </div>
        ) : (
          vehicleList.map((v) => (
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
                <StatusBadge status={v.status === 'approved' ? 'Active' : v.status === 'pending' ? 'Pending Approval' : 'Inactive'} variant={v.status === 'approved' ? 'active' : v.status === 'pending' ? 'pending' : 'inactive'} />
                <span className="text-xs text-muted-foreground">{v.mileage?.toLocaleString()} km</span>
              </div>
            </button>
          ))
        )}

        <Button variant="amber" size="full" className="gap-2 mt-4" onClick={() => navigate('onboarding')}>
          <Plus className="w-4 h-4" /> Add Vehicle
        </Button>
      </div>
    </div>
  );
}
