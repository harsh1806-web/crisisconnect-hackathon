import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta?.env) || {};

const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

export const isSupabaseConfigured = Boolean(
  env.VITE_SUPABASE_URL && 
  env.VITE_SUPABASE_ANON_KEY && 
  !env.VITE_SUPABASE_URL.includes('xyzcompany')
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * 1. Register a new citizen in Supabase 'citizens' table
 */
export async function registerCitizenInSupabase(citizenData) {
  if (!isSupabaseConfigured) {
    console.warn('Supabase credentials not configured in .env. Using resilient local fallback.');
    return { success: true, citizen: citizenData };
  }

  const { data, error } = await supabase
    .from('citizens')
    .upsert(
      {
        name: citizenData.name,
        phone: citizenData.phone,
        password_hash: citizenData.password || '', // or supabase.auth
        age: Number(citizenData.age) || 25,
        blood_group: citizenData.bloodGroup || 'O+',
        email: citizenData.email || '',
        address: citizenData.address || '',
        latitude: citizenData.lat || 19.0760,
        longitude: citizenData.lng || 72.8777,
        ice_name: citizenData.emergencyContactName || '',
        ice_phone: citizenData.emergencyContactPhone || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'phone' }
    )
    .select()
    .single();

  if (error) {
    console.error('Supabase registration error:', error);
    throw error;
  }
  return { success: true, citizen: data };
}

/**
 * 2. Authenticate Citizen from Supabase
 */
export async function loginCitizenInSupabase(phone, password) {
  if (!isSupabaseConfigured) {
    return { success: true, user: { phone, name: 'Demo Citizen' } };
  }

  const { data, error } = await supabase
    .from('citizens')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error || !data) {
    throw new Error('Citizen not found with this mobile number. Please register first.');
  }

  if (password && data.password_hash && data.password_hash !== password) {
    throw new Error('Incorrect password. Please verify and try again.');
  }

  return { success: true, user: data };
}

/**
 * 3. Store Device Token in Supabase 'device_tokens' table for Notifications
 */
export async function registerDeviceTokenInSupabase(token, metadata = {}) {
  if (!isSupabaseConfigured) {
    return { success: true, token };
  }

  const { data, error } = await supabase
    .from('device_tokens')
    .upsert(
      {
        token,
        user_phone: metadata.mobileNo || metadata.phone || '',
        user_name: metadata.name || '',
        blood_group: metadata.bloodGroup || '',
        role: metadata.role || 'CITIZEN',
        latitude: metadata.location?.lat || null,
        longitude: metadata.location?.lng || null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    )
    .select()
    .single();

  if (error) {
    console.error('Supabase device token error:', error);
  }
  return { success: !error, data };
}

/**
 * 4. Create Emergency Request in Supabase
 */
export async function createEmergencyRequestInSupabase(reqData) {
  if (!isSupabaseConfigured) {
    return { success: true, id: `sup-req-${Date.now()}` };
  }

  const { data, error } = await supabase
    .from('emergency_requests')
    .insert({
      tracking_token: reqData.trackingCode || `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
      title: reqData.title,
      description: reqData.description,
      category: reqData.category,
      urgency: reqData.urgency,
      status: reqData.status || 'PENDING',
      verification_status: reqData.verificationStatus || 'UNVERIFIED',
      contact_name: reqData.contactName || '',
      contact_phone: reqData.contactPhone || reqData.mobileNo || '',
      people_count: Number(reqData.peopleCount) || 1,
      latitude: reqData.lat || reqData.location?.lat || 19.0760,
      longitude: reqData.lng || reqData.location?.lng || 72.8777,
      location_name: reqData.locationName || reqData.location?.address || '',
      vulnerabilities: reqData.vulnerabilities || [],
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return { success: true, data };
}

/**
 * 5. Real-Time Supabase Channel Subscription for Incoming Emergencies
 */
export function subscribeToSupabaseEmergencies(callback) {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel('public:emergency_requests')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'emergency_requests' },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
