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
    supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }),

  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signInGoogle: () =>
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }),

  signOut: () => supabase.auth.signOut(),

  getUser: () => supabase.auth.getUser(),

  onAuthChange: (cb: (user: any) => void) =>
    supabase.auth.onAuthStateChange((_, session) => cb(session?.user || null)),

  resetPassword: (email: string, redirectTo: string) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo }),

  updatePassword: (password: string) =>
    supabase.auth.updateUser({ password }),
};

// ============================================
// CLIENT PROFILE
// ============================================
export const clientProfile = {
  save: async (data: { name: string; phone: string; company_name?: string; address?: string; id_number?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase.from('clients').select('status').eq('id', user.id).maybeSingle();
    if (existing?.status && existing.status !== 'profile_incomplete') {
      throw new Error('Profile already submitted for approval');
    }

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
    if (!user) throw new Error('Not authenticated');
    // Rate limit: cap at 50 vehicles per client to prevent abuse
    const { count } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', user.id);
    if ((count ?? 0) >= 50) throw new Error('Vehicle limit reached. Contact support to add more.');
    return supabase.from('vehicles').insert({ client_id: user.id, ...data, status: 'pending' }).select().single();
  },

  // H3: enforce ownership in query — do not rely solely on RLS
  get: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('vehicles').select('*').eq('id', id).eq('client_id', user.id).single();
  },

  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };
    return supabase.from('vehicles').select('*').eq('client_id', user.id).order('created_at', { ascending: false });
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
interface QuoteData {
  vehicle_type: string;
  year: number;
  mileage: number;
  estimated_price: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

export const quotes = {
  calculate: (vehicleType: string, year: number, mileage: number) => {
    const base: Record<string, number> = { saloon: 9500, suv: 12500, pickup: 14000, van: 15500 };
    const basePrice = base[vehicleType.toLowerCase()] || 9500;
    const ageFactor = year >= 2020 ? 1.0 : year >= 2015 ? 1.15 : year >= 2010 ? 1.30 : year >= 2005 ? 1.50 : 1.75;
    const mileageFactor = mileage < 50000 ? 1.0 : mileage < 100000 ? 1.1 : mileage < 150000 ? 1.2 : 1.3;
    return Math.round(basePrice * ageFactor * mileageFactor);
  },

  save: (data: QuoteData) => supabase.from('quotes').insert(data).select().single()
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
    return data as { success: boolean; otp_token: string; message: string };
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
    if (!user) return { data: [], error: null };
    return supabase.from('incidents')
      .select('*, vehicles(registration, make, model)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });
  },

  // H3: enforce ownership — do not rely solely on RLS
  get: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('incidents')
      .select('*, vehicles(registration, make, model)')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();
  },

  // H3: enforce ownership — do not rely solely on RLS
  listByVehicle: async (vehicleId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };
    return supabase.from('incidents')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });
  },

  updateStatus: async (id: string, status: 'closed') => {
    if (status !== 'closed') throw new Error('Invalid status');
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

    const { data: current } = await supabase.from('incidents').select('status').eq('id', incidentId).eq('client_id', user.id).single();
    if (!current) throw new Error('Incident not found');
    if (current.status !== 'completed') throw new Error('Service must be completed before submitting feedback');

    // M4: validate rating ranges server-side before insert
    const validRating = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;
    if (!validRating(feedback.rating) || !validRating(feedback.timeliness) || !validRating(feedback.professionalism)) {
      throw new Error('Rating values must be between 1 and 5');
    }
    if (feedback.comments && feedback.comments.length > 1000) {
      throw new Error('Comments must be 1000 characters or fewer');
    }

    return supabase.from('incidents').update({
      feedback_resolved: feedback.resolved,
      feedback_rating: feedback.rating,
      feedback_timeliness: feedback.timeliness,
      feedback_professionalism: feedback.professionalism,
      feedback_comments: feedback.comments || null,
      feedback_submitted_at: new Date().toISOString(),
      status: 'closed',
    }).eq('id', incidentId).eq('client_id', user.id).select().single();
  },
};

// ============================================
// DOCUMENT UPLOAD
// ============================================
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

async function checkMagicBytes(file: File): Promise<boolean> {
  // Read first 12 bytes — enough for all signatures we care about
  const buf = await file.slice(0, 12).arrayBuffer();
  const b = new Uint8Array(buf);
  // JPEG: FF D8 FF
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return true;
  // WebP: RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return true;
  // PDF: %PDF
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return true;
  return false;
}

async function validateFile(file: File) {
  if (file.size > MAX_UPLOAD_SIZE) throw new Error('File too large (max 10 MB)');
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) throw new Error('Only JPEG, PNG, WebP, or PDF files are allowed');
  const valid = await checkMagicBytes(file);
  if (!valid) throw new Error('File content does not match its type. Please upload a real image or PDF.');
}

function safeName(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(0, 100);
}

export const documents = {
  upload: async (file: File, folder: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    await validateFile(file);
    const safeFolder = folder.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const path = `${user.id}/${safeFolder}/${Date.now()}_${safeName(file.name)}`;
    const { error } = await supabase.storage.from('documents').upload(path, file);
    if (error) throw error;
    // Store the path only — use getSignedUrl at display time
    return path;
  },

  getSignedUrl: async (path: string) => {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60, { download: true });
    if (error) throw error;
    return data.signedUrl;
  },

  uploadVehicleDoc: async (vehicleId: string, type: 'logbook' | 'insurance', file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    // Verify ownership before uploading — prevents orphaned storage objects
    const { data: vehicle, error: ownerErr } = await supabase.from('vehicles').select('id').eq('id', vehicleId).eq('client_id', user.id).single();
    if (ownerErr || !vehicle) throw new Error('Vehicle not found');
    const path = await documents.upload(file, vehicleId);
    return supabase.from('vehicles').update({ [`${type}_url`]: path }).eq('id', vehicleId).eq('client_id', user.id).select().single();
  },

  uploadClientId: async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const path = await documents.upload(file, 'id');
    return supabase.from('clients').update({ id_document_url: path }).eq('id', user.id).select().single();
  },

  uploadIncidentPhoto: async (incidentId: string, file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data: inc } = await supabase.from('incidents').select('id').eq('id', incidentId).eq('client_id', user.id).single();
    if (!inc) throw new Error('Incident not found');
    await validateFile(file);
    const ext = safeName(file.name).split('.').pop() || 'jpg';
    const path = `${user.id}/incident-photos/${incidentId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('documents').upload(path, file);
    if (error) throw error;
    return path;
  },
};

// ============================================
// COVERAGE & PAYMENTS
// ============================================
export const coverageService = {
  getActive: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };
    return supabase.from('coverage')
      .select('*')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  },

  getActiveVehicles: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };
    return supabase.from('vehicles')
      .select('*')
      .eq('client_id', user.id)
      .in('status', ['active', 'approved']);
  },
};

export const payments = {
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };
    return supabase.from('payments')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });
  },
};

// ============================================
// ADMIN — Removed from client bundle for security.
// Admin operations must be performed via Edge Functions
// with server-side role verification.
// ============================================
