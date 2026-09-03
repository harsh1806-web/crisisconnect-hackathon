import { useEffect, useState, useContext } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase.js';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle as serviceGoogleLogin,
  logoutUser,
  resetPassword as serviceResetPassword,
  getUserProfile,
  updateUserLocation,
} from '../services/authService.js';
import {
  getOrCreateDeviceToken,
  listenForIncomingAlerts,
  requestNotificationPermission,
  registerActiveDeviceSession,
} from '../services/notificationService.js';
import { USER_ROLES } from '../utils/constants.js';
import { DEMO_PROFILES } from '../data/mockData.js';
import { AuthContext } from './authContextInstance.js';
import toast from 'react-hot-toast';

export { AuthContext };

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [deviceToken, setDeviceToken] = useState(() => getOrCreateDeviceToken());
  const [loading, setLoading] = useState(() => isSupabaseConfigured);

  // Local session for 3-role gateway with persistent device cache
  const [session, setSession] = useState(() => {
    try {
      const saved =
        localStorage.getItem('crisisconnect_session_v3') ||
        localStorage.getItem('crisisconnect_persisted_auth') ||
        sessionStorage.getItem('crisisconnect_session_v3');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      return null;
    }
    return null;
  });

  useEffect(() => {
    if (session) {
      try {
        const payload = JSON.stringify(session);
        localStorage.setItem('crisisconnect_session_v3', payload);
        localStorage.setItem('crisisconnect_persisted_auth', payload);
        sessionStorage.setItem('crisisconnect_session_v3', payload);
      } catch (e) {}
    }
  }, [session]);

  // Sync profile data from Supabase / DB
  const fetchAndSetProfile = async (uid) => {
    try {
      const profile = await getUserProfile(uid);
      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setUserProfile(null);
      return null;
    }
  };

  // Supabase Auth listener
  useEffect(() => {
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, authSession) => {
        if (authSession?.user) {
          setCurrentUser(authSession.user);
          await fetchAndSetProfile(authSession.user.id);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Global Real-Time Emergency Alerts Listener
  useEffect(() => {
    const unsubscribeAlerts = listenForIncomingAlerts();
    return () => unsubscribeAlerts();
  }, []);

  const signup = async (email, password, profileData) => {
    const result = await registerWithEmail(email, password, profileData);
    setUserProfile(result.profile);
    setDeviceToken(result.profile.deviceToken);
    return result;
  };

  const login = async (email, password, currentLocation) => {
    const result = await loginWithEmail(email, password, currentLocation);
    if (result.user) {
      await fetchAndSetProfile(result.user.id || email);
    }
    return result;
  };

  const loginWithGoogle = async (defaultRole, currentLocation) => {
    const result = await serviceGoogleLogin(defaultRole, currentLocation);
    setUserProfile(result.profile);
    return result;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {}
    try {
      localStorage.removeItem('crisisconnect_session_v3');
      localStorage.removeItem('crisisconnect_persisted_auth');
      localStorage.removeItem('crisisconnect_current_user');
      sessionStorage.clear();
    } catch (e) {}
    setCurrentUser(null);
    setUserProfile(null);
    setSession(null);
    toast('Signed out from CrisisConnect', { icon: '🚪' });
  };

  const resetPassword = async (email) => {
    return await serviceResetPassword(email);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      return await fetchAndSetProfile(currentUser.id);
    }
  };

  const updateLocation = async (coords) => {
    if (currentUser && coords) {
      await updateUserLocation(currentUser.id, coords);
      await refreshProfile();
    }
  };

  const enableNotifications = async () => {
    return await requestNotificationPermission();
  };

  // 3-Role Gateway Demo Login Functions
  const loginAsCitizen = (userData = {}) => {
    const s = {
      type: 'citizen',
      role: 'citizen',
      roleLabel: 'CITIZEN / AFFECTED RESIDENT',
      name: userData.name || 'Citizen User',
      phone: userData.phone || '',
      email: userData.email || '',
      bloodGroup: userData.bloodGroup || userData.blood_group || 'O+',
      allergies: userData.allergies || 'None Reported',
      address: userData.address || '',
      emergencyContact: userData.emergencyContact ? {
        name: userData.emergencyContact.name || 'Primary Contact',
        phone: String(userData.emergencyContact.phone || userData.phone || '9876543210').replace(/\D/g, '').slice(-10),
      } : {
        name: userData.ice_name || userData.emergencyContactName || 'Primary Contact',
        phone: String(userData.ice_phone || userData.emergencyContactPhone || userData.phone || '9876543210').replace(/\D/g, '').slice(-10),
      },
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name || 'Citizen')}`,
      ...userData,
    };
    try {
      const payload = JSON.stringify(s);
      localStorage.setItem('crisisconnect_session_v3', payload);
      localStorage.setItem('crisisconnect_persisted_auth', payload);
      sessionStorage.setItem('crisisconnect_session_v3', payload);
    } catch (e) {}
    setSession(s);
    setUserProfile(s);
    registerActiveDeviceSession(s);
    return s;
  };

  const loginAsNGO = (ngoData = {}) => {
    const s = {
      type: 'ngo',
      ...(DEMO_PROFILES?.ngo || {}),
      ...ngoData,
    };
    try {
      const payload = JSON.stringify(s);
      localStorage.setItem('crisisconnect_session_v3', payload);
      localStorage.setItem('crisisconnect_persisted_auth', payload);
      sessionStorage.setItem('crisisconnect_session_v3', payload);
    } catch (e) {}
    setSession(s);
    setUserProfile(s);
    registerActiveDeviceSession(s);
    return s;
  };

  const loginAsAuthority = (authData = {}) => {
    const s = {
      type: 'authority',
      ...(DEMO_PROFILES?.authority || {}),
      ...authData,
    };
    try {
      const payload = JSON.stringify(s);
      localStorage.setItem('crisisconnect_session_v3', payload);
      localStorage.setItem('crisisconnect_persisted_auth', payload);
      sessionStorage.setItem('crisisconnect_session_v3', payload);
    } catch (e) {}
    setSession(s);
    setUserProfile(s);
    registerActiveDeviceSession(s);
    return s;
  };

  const loginAsUser = loginAsCitizen;

  // Role detection flags
  const isCitizen = session?.type === 'citizen' || userProfile?.role === USER_ROLES.VICTIM || userProfile?.role === 'citizen';
  const isNGO = session?.type === 'ngo' || userProfile?.role === USER_ROLES.VOLUNTEER || userProfile?.role === 'ngo';
  const isAuthority = session?.type === 'authority' || userProfile?.role === USER_ROLES.ORGANIZATION || userProfile?.role === USER_ROLES.ADMIN || userProfile?.role === 'authority';

  const value = {
    session: session || userProfile || currentUser,
    currentUser: session || currentUser || userProfile,
    userProfile,
    deviceToken,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    refreshProfile,
    updateLocation,
    enableNotifications,
    loginAsCitizen,
    loginAsNGO,
    loginAsAuthority,
    loginAsUser,
    isCitizen,
    isUser: isCitizen,
    isNGO,
    isVolunteer: isNGO,
    isAuthority,
    isOrganization: isAuthority,
    isAdmin: isAuthority,
    isVictim: isCitizen,
    isCoordinator: isAuthority,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
