import { useEffect, useState, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase.js';
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
  const [loading, setLoading] = useState(true);

  // Local session for 3-role gateway
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_session_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem('crisisconnect_session_v3', JSON.stringify(session));
    } else {
      localStorage.removeItem('crisisconnect_session_v3');
    }
  }, [session]);

  // Sync profile data from Firestore
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchAndSetProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
      await fetchAndSetProfile(result.user.uid);
    }
    return result;
  };

  const loginWithGoogle = async (defaultRole, currentLocation) => {
    const result = await serviceGoogleLogin(defaultRole, currentLocation);
    setUserProfile(result.profile);
    return result;
  };

  const logout = async () => {
    await logoutUser();
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
      return await fetchAndSetProfile(currentUser.uid);
    }
  };

  const updateLocation = async (coords) => {
    if (currentUser && coords) {
      await updateUserLocation(currentUser.uid, coords);
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
      ...(DEMO_PROFILES?.citizen || {}),
      ...userData,
    };
    setSession(s);
    setUserProfile(s);
    toast.success(`Welcome Citizen: ${s.name || 'Citizen'}!`);
    return s;
  };

  const loginAsNGO = (ngoData = {}) => {
    const s = {
      type: 'ngo',
      ...(DEMO_PROFILES?.ngo || {}),
      ...ngoData,
    };
    setSession(s);
    setUserProfile(s);
    toast.success(`NGO Portal: Signed in with ${s.ngoName || 'NGO Partner'}`);
    return s;
  };

  const loginAsAuthority = (authData = {}) => {
    const s = {
      type: 'authority',
      ...(DEMO_PROFILES?.authority || {}),
      ...authData,
    };
    setSession(s);
    setUserProfile(s);
    toast.success(`Authority Command: Signed in as ${s.rank || 'Commander'}`);
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
