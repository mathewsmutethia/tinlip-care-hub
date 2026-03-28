// ============================================
// TINLIP SUPABASE CLIENT
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)');
}

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
  
  updateNotifications: async (prefs: { status_updates: boolean; payment_reminders: boolean; promotional: boolean }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('clients').update({ notification_preferences: prefs }).eq('id', user.id).select().single();
  },

  // Secure: client can only submit for approval - cannot bypass admin
  submitForApproval: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data: profile } = await supabase.from('clients').select('status').eq('id', user.id).single();
    if (profile?.status !== 'profile_incomplete') {
      throw new Error('Profile already submitted');
    }
    
    return supabase.from('clients').update({
      status: 'pending_approval',
      agreement_signed_at: new Date().toISOString(),
    }).eq('id', user.id).select().single();
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
  
  update: async (id: string, data: { mileage?: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('vehicles').update(data).eq('id', id).eq('client_id', user.id).select().single();
  }
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
// OTP & INCIDENT SERVICE (Server-side via Edge Function)
// ============================================
export const incidentService = {
  requestOtp: async () => {
    const { data, error } = await supabase.functions.invoke('create-incident', {
      body: { action: 'request_otp' },
    });
    if (error) throw error;
    return data as { success: boolean; otp_token: string; message: string; dev_otp?: string };
  },

  verifyAndCreate: async (params: {
    otp_token: string;
    otp_code: string;
    vehicle_id: string;
    type: string;
    description: string;
    location: string;
    mileage?: number;
  }) => {
    const { data, error } = await supabase.functions.invoke('create-incident', {
      body: { action: 'verify_and_create', ...params },
    });
    if (error) throw error;
    return data as { success: boolean; claim_code: string; incident_id: string };
  },
};

// ============================================
// INCIDENTS (read-only client operations)
// ============================================
export const incidents = {
  
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from('incidents')
      .select('*, vehicles(registration, make, model)')
      .eq('client_id', user?.id)
      .order('created_at', { ascending: false });
  },
  
  get: (id: string) => 
    supabase.from('incidents').select('*, vehicles(*)').eq('id', id).single(),
  
  updateStatus: async (id: string, status: 'closed') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('incidents').update({ status }).eq('id', id).eq('client_id', user.id).select().single();
  },

  submitFeedback: async (incidentId: string, feedback: {
    resolved: boolean;
    rating: number;
    timeliness: number;
    professionalism: number;
    comments: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('incidents').update({
      feedback_resolved: feedback.resolved,
      feedback_rating: feedback.rating,
      feedback_timeliness: feedback.timeliness,
      feedback_professionalism: feedback.professionalism,
      feedback_comments: feedback.comments || null,
      feedback_submitted_at: new Date().toISOString(),
    }).eq('id', incidentId).eq('client_id', user.id).select().single();
  },
};

// ============================================
// DOCUMENT UPLOAD
// ============================================
export const documents = {
  upload: async (file: File, folder: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const path = `${user.id}/${folder}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('documents').upload(path, file);
    if (error) throw error;
    // Store the path only — use getSignedUrl at display time
    return path;
  },

  getSignedUrl: async (path: string) => {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60);
    if (error) throw error;
    return data.signedUrl;
  },
  
  uploadVehicleDoc: async (vehicleId: string, type: 'logbook' | 'insurance', file: File) => {
    const path = await documents.upload(file, vehicleId);
    return supabase.from('vehicles').update({ [`${type}_url`]: path }).eq('id', vehicleId).select().single();
  },
  
  uploadClientId: async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const path = await documents.upload(file, 'id');
    return supabase.from('clients').update({ id_document_url: path }).eq('id', user.id).select().single();
  }
};

// ============================================
// ADMIN — Removed from client bundle for security.
// Admin operations must be performed via Edge Functions
// with server-side role verification.
// ============================================
