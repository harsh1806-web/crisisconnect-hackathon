import { supabase, isSupabaseConfigured } from './supabase.js';
import { USER_ROLES } from '../utils/constants.js';
import { registerDeviceToken } from './notificationService.js';

/**
 * Creates a new user with Email/Password and stores their full profile in Supabase:
 * name, mobileNo, email, age, bloodGroup, location, deviceToken, role.
 */
export async function registerWithEmail(email, password, profileData = {}) {
  const fullName = profileData.name || profileData.displayName || email.split('@')[0];
  const mobile = profileData.mobileNo || profileData.phone || '';
  const age = profileData.age ? Number(profileData.age) : 25;
  const bloodGroup = profileData.bloodGroup || 'O+';
  const location = profileData.location || { lat: 19.0760, lng: 72.8777, address: 'Disaster Relief Area' };
  const role = profileData.role || USER_ROLES.VICTIM;

  let uid = `user_${Date.now()}`;
  let user = { id: uid, email, displayName: fullName };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: fullName,
            phone: mobile,
            role,
          },
        },
      });

      if (error) throw error;
      if (data?.user) {
        user = data.user;
        uid = data.user.id;
      }
    } catch (err) {
      console.warn('Supabase Auth signUp fallback:', err.message);
    }
  }

  // Generate & register device token
  const deviceToken = await registerDeviceToken(uid, {
    name: fullName,
    email,
    mobileNo: mobile,
    bloodGroup,
    location,
    role,
  });

  const userProfile = {
    uid,
    id: uid,
    name: fullName,
    displayName: fullName,
    email,
    mobileNo: mobile,
    phone: mobile,
    age,
    bloodGroup,
    role,
    location,
    deviceToken,
    createdAt: new Date().toISOString(),
  };

  // Upsert to Supabase citizens table
  if (isSupabaseConfigured) {
    try {
      await supabase.from('citizens').upsert({
        id: uid,
        name: fullName,
        phone: mobile,
        password_hash: password,
        age,
        blood_group: bloodGroup,
        email,
        address: location.address || '',
        latitude: location.lat,
        longitude: location.lng,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'phone' });
    } catch (err) {
      console.warn('Supabase citizens upsert fallback:', err.message);
    }
  }

  return { user, profile: userProfile };
}

/**
 * Logs in user using email and password against Supabase
 */
export async function loginWithEmail(email, password, currentLocation = null) {
  let user = { id: `user_${Date.now()}`, email, displayName: email.split('@')[0] };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message);
    }
    user = data.user;
  }

  const profile = await getUserProfile(user.id || user.email);

  if (currentLocation && profile) {
    await updateUserLocation(user.id || user.email, currentLocation);
    profile.location = currentLocation;
  }

  return { user, profile };
}

/**
 * Initiates Google OAuth with Supabase
 */
export async function loginWithGoogle() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return { user: data, profile: null };
  }

  const mockUser = {
    id: `goog_${Date.now()}`,
    email: 'google_user@crisisconnect.app',
    name: 'Google Emergency User',
  };
  return { user: mockUser, profile: mockUser };
}

/**
 * Signs out current user from Supabase session
 */
export async function logoutUser() {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut fallback:', err.message);
    }
  }
}

/**
 * Sends Password Reset Email via Supabase
 */
export async function resetPassword(email) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
    return true;
  }
  return true;
}

/**
 * Retrieves User Profile from Supabase
 */
export async function getUserProfile(uid) {
  if (!uid) return null;

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('citizens')
        .select('*')
        .or(`id.eq.${uid},phone.eq.${uid},email.eq.${uid}`)
        .maybeSingle();

      if (data) {
        return {
          uid: data.id,
          id: data.id,
          name: data.name,
          displayName: data.name,
          phone: data.phone,
          mobileNo: data.phone,
          age: data.age,
          bloodGroup: data.blood_group,
          email: data.email,
          location: {
            lat: data.latitude,
            lng: data.longitude,
            address: data.address,
          },
        };
      }
    } catch {
      // Fallback
    }
  }

  return {
    uid,
    id: uid,
    name: 'Citizen User',
    phone: '+91 98765 43210',
    bloodGroup: 'O+',
  };
}

/**
 * Updates User GPS coordinates in Supabase
 */
export async function updateUserLocation(uid, coords) {
  if (!uid || !coords) return;

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('citizens')
        .update({
          latitude: coords.lat || coords.latitude,
          longitude: coords.lng || coords.longitude,
          address: coords.address || '',
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${uid},phone.eq.${uid},email.eq.${uid}`);
    } catch (err) {
      console.warn('Update location fallback:', err.message);
    }
  }
}
