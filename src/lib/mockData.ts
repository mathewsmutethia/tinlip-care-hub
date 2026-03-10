export interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  engineNumber: string;
  chassisNumber: string;
  mileage: number;
  status: 'active' | 'pending' | 'inactive';
  logbookUploaded: boolean;
  insuranceUploaded: boolean;
}

export interface Incident {
  id: string;
  claimRef: string;
  vehicleId: string;
  vehicleReg: string;
  vehicleName: string;
  type: 'regular-service' | 'roadside' | 'towing' | 'diagnosis' | 'spares';
  typeLabel: string;
  description: string;
  location: string;
  status: 'open' | 'in-progress' | 'assigned' | 'completed' | 'closed';
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  providerName?: string;
  providerType?: string;
  rating?: number;
  timeline: TimelineStep[];
}

export interface TimelineStep {
  label: string;
  timestamp?: string;
  completed: boolean;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  invoiceRef: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  memberSince: string;
  avatarInitials: string;
  idUploaded: boolean;
  coverageStatus: 'active' | 'pending-payment' | 'expired';
  coverageStart: string;
  coverageEnd: string;
  planType: string;
}

export const mockUser: UserProfile = {
  id: '1',
  fullName: 'James Mwangi',
  email: 'james.mwangi@gmail.com',
  phone: '+254 712 345 678',
  memberSince: 'March 2024',
  avatarInitials: 'JM',
  idUploaded: true,
  coverageStatus: 'active',
  coverageStart: '14 Jan 2025',
  coverageEnd: '14 Jan 2026',
  planType: 'Tinlip Premium Protection',
};

export const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    registration: 'KBZ 123X',
    make: 'Toyota',
    model: 'Vitz',
    year: 2018,
    engineNumber: '2NR-FKE-0847291',
    chassisNumber: 'KSP130-0284751',
    mileage: 67420,
    status: 'active',
    logbookUploaded: true,
    insuranceUploaded: true,
  },
  {
    id: 'v2',
    registration: 'KDA 456Y',
    make: 'Toyota',
    model: 'Land Cruiser Prado',
    year: 2015,
    engineNumber: '1GD-FTV-1938472',
    chassisNumber: 'GDJ150-0193847',
    mileage: 124850,
    status: 'active',
    logbookUploaded: true,
    insuranceUploaded: true,
  },
];

export const mockIncidents: Incident[] = [
  {
    id: 'i1',
    claimRef: 'TIN-2025-00847',
    vehicleId: 'v1',
    vehicleReg: 'KBZ 123X',
    vehicleName: 'Toyota Vitz 2018',
    type: 'roadside',
    typeLabel: 'Roadside Assistance',
    description: 'Car stalled on Thika Road near Garden City Mall. Engine won\'t start, battery seems dead.',
    location: 'Thika Road, near Garden City Mall',
    status: 'in-progress',
    statusLabel: 'In Progress',
    createdAt: '14 Jan 2025, 9:32 AM',
    updatedAt: '14 Jan 2025, 10:15 AM',
    timeline: [
      { label: 'Incident Opened', timestamp: '14 Jan, 9:32 AM', completed: true },
      { label: 'Under Review', timestamp: '14 Jan, 10:15 AM', completed: true },
      { label: 'Service Provider Assigned', completed: false },
      { label: 'Service Completed', completed: false },
      { label: 'Closed', completed: false },
    ],
  },
  {
    id: 'i2',
    claimRef: 'TIN-2025-00712',
    vehicleId: 'v2',
    vehicleReg: 'KDA 456Y',
    vehicleName: 'Toyota Prado 2015',
    type: 'regular-service',
    typeLabel: 'Regular Service',
    description: 'Scheduled 120,000km service. Oil change, filter replacement, brake inspection needed.',
    location: 'Westlands, Nairobi',
    status: 'closed',
    statusLabel: 'Closed',
    createdAt: '28 Dec 2024, 2:15 PM',
    updatedAt: '30 Dec 2024, 4:00 PM',
    closedAt: '30 Dec 2024',
    providerName: 'Toyota Kenya',
    providerType: 'Authorized Service Centre',
    rating: 4,
    timeline: [
      { label: 'Incident Opened', timestamp: '28 Dec, 2:15 PM', completed: true },
      { label: 'Under Review', timestamp: '28 Dec, 2:45 PM', completed: true },
      { label: 'Service Provider Assigned', timestamp: '29 Dec, 9:00 AM', completed: true },
      { label: 'Service Completed', timestamp: '30 Dec, 3:30 PM', completed: true },
      { label: 'Closed', timestamp: '30 Dec, 4:00 PM', completed: true },
    ],
  },
];

export const mockPayments: Payment[] = [
  { id: 'p1', date: '14 Jan 2025', amount: 11425, method: 'M-Pesa', status: 'completed', invoiceRef: 'INV-2025-001' },
  { id: 'p2', date: '14 Jan 2024', amount: 11425, method: 'M-Pesa', status: 'completed', invoiceRef: 'INV-2024-001' },
  { id: 'p3', date: '14 Jul 2024', amount: 3500, method: 'M-Pesa', status: 'completed', invoiceRef: 'INV-2024-047' },
];

export const incidentTypeOptions = [
  { id: 'regular-service', label: 'Regular Service', icon: '🔧', description: 'Scheduled maintenance & servicing' },
  { id: 'roadside', label: 'Roadside Assistance', icon: '🚗', description: 'Breakdown or emergency on the road' },
  { id: 'towing', label: 'Towing', icon: '🚛', description: 'Vehicle needs to be towed' },
  { id: 'diagnosis', label: 'Mechanical Diagnosis', icon: '🔬', description: 'Identify a mechanical issue' },
  { id: 'spares', label: 'Spares Request', icon: '🛞', description: 'Request for vehicle parts' },
];

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
}

export function getDaysRemaining(endDate: string): number {
  const end = new Date('2026-01-14');
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
