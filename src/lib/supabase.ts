// ============================================
// TINLIP SUPABASE CLIENT
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xpjqgcuywecqhkddncjq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwanFnY3V5d2VjcWhrZGRuY2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDI2ODYsImV4cCI6MjA4ODcxODY4Nn0.YwDcaxS0DxP6rrfLjMe0ozrBGLJwQWF2znwmdCdlM9w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// AUTH
// ============================================
export const auth = {
  signUp: (email: string, password: string) => 
    supabase.auth.signUp({ email, password }),
  
  signIn: (email: string, password: string) => 
    supabase.auth.signInWithPassword({ email, password }),
  
  signInGoogle: () => 
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }),
  
  signOut: () => supabase.auth.signOut(),
  
  getUser: () => supabase.auth.getUser(),
  
  onAuthChange: (cb: (user: any) => void) => 
    supabase.auth.onAuthStateChange((_, session) => cb(session?.user || null))
};

// ============================================
// CLIENT PROFILE
// ============================================
export const clientProfile = {
  save: async (data: { name: string; phone: string; company_name?: string; address?: string; id_number?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    return supabase.from('clients').upsert({
      id: user.id,
      email: user.email,
      ...data,
      status: 'profile_incomplete'
    }).select().single();
  },
  
  get: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return supabase.from('clients').select('*').eq('id', user.id).single();
  },
  
  updateStatus: (status: string) => {
    const { data: { user } } = supabase.auth.getUser();
    return supabase.from('clients').update({ status }).eq('id', user?.id);
  }
};

// ============================================
// VEHICLES
// ============================================
export const vehicles = {
  add: async (data: { registration: string; make: string; model: string; year: number; mileage: number; engine_number?: string; chassis_number?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: client } = await supabase.from('clients').select('id').eq('id', user?.id).single();
    return supabase.from('vehicles').insert({ client_id: client.id, ...data, status: 'pending' }).select().single();
  },
  
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: client } = await supabase.from('clients').select('id').eq('id', user?.id).single();
    return supabase.from('vehicles').select('*').eq('client_id', client.id).order('created_at', { ascending: false });
  },
  
  update: (id: string, data: any) => 
    supabase.from('vehicles').update(data).eq('id', id).select().single()
};

// ============================================
// QUOTES (No Auth Required)
// ============================================
export const quotes = {
  calculate: (vehicleType: string, year: number, mileage: number) => {
    const base: Record<string, number> = { saloon: 9500, suv: 12500, pickup: 14000, van: 15500 };
    const basePrice = base[vehicleType.toLowerCase()] || 9500;
    const ageFactor = year >= 2020 ? 1.0 : year >= 2015 ? 1.15 : year >= 2010 ? 1.30 : year >= 2005 ? 1.50 : 1.75;
    const mileageFactor = mileage < 50000 ? 1.0 : mileage < 100000 ? 1.1 : mileage < 150000 ? 1.2 : 1.3;
    return Math.round(basePrice * ageFactor * mileageFactor);
  },
  
  save: (data: any) => supabase.from('quotes').insert(data).select().single()
};

// ============================================
// INCIDENTS
// ============================================
export const incidents = {
  create: async (data: { vehicle_id: string; type: string; description: string; location: string; mileage?: number; otp: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const claimCode = `TLP-${Date.now().toString(36).toUpperCase()}`;
    return supabase.from('incidents').insert({
      client_id: user?.id,
      ...data,
      claim_code: claimCode,
      status: 'open'
    }).select().single();
  },
  
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from('incidents')
      .select('*, vehicles(registration, make, model)')
      .eq('client_id', user?.id)
      .order('created_at', { ascending: false });
  },
  
  get: (id: string) => 
    supabase.from('incidents').select('*, vehicles(*)').eq('id', id).single(),
  
  updateStatus: (id: string, status: string) => 
    supabase.from('incidents').update({ status }).eq('id', id).select().single()
};

// ============================================
// DOCUMENT UPLOAD
// ============================================
export const documents = {
  upload: async (file: File, folder: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user?.id}/${folder}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('documents').upload(path, file);
    if (error) throw error;
    return supabase.storage.from('documents').getPublicUrl(path).data.publicUrl;
  },
  
  uploadVehicleDoc: async (vehicleId: string, type: 'logbook' | 'insurance', file: File) => {
    const url = await documents.upload(file, vehicleId);
    return supabase.from('vehicles').update({ [`${type}_url`]: url }).eq('id', vehicleId).select().single();
  },
  
  uploadClientId: async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    const url = await documents.upload(file, 'id');
    return supabase.from('clients').update({ id_document_url: url }).eq('id', user?.id).select().single();
  }
};

// ============================================
// ADMIN
// ============================================
export const admin = {
  getPendingClients: () => 
    supabase.from('clients').select('*, vehicles(*)').eq('status', 'pending_approval'),
  
  approveClient: (id: string) => 
    supabase.from('clients').update({ status: 'approved_payment_pending' }).eq('id', id),
  
  rejectClient: (id: string, reason: string) => 
    supabase.from('clients').update({ status: 'rejected' }).eq('id', id),
  
  approveVehicle: (id: string) => 
    supabase.from('vehicles').update({ status: 'approved' }).eq('id', id),
  
  getAllIncidents: () => 
    supabase.from('incidents')
      .select('*, clients(name, email, phone), vehicles(registration, make, model)')
      .order('created_at', { ascending: false })
};
