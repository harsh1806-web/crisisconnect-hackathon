import { useEffect, useState, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle as serviceGoogleLogin,
  logoutUser,
  resetPassword as serviceResetPassword,
  getUserProfile,
  updateUserLocation,
} from '../services/authService';
import {
  getOrCreateDeviceToken,
  listenForIncomingAlerts,
  requestNotificationPermission,
} from '../services/notificationService';
import { USER_ROLES } from '../utils/constants';
import { AuthContext } from './authContextInstance';

export { AuthContext };

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [deviceToken, setDeviceToken] = useState(() => getOrCreateDeviceToken());
  const [loading, setLoading] = useState(true);

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
  // Automatically triggers notification & audio on every device when an emergency is posted/updated
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

  // Helper flags for role-based views (including Sharvari's frontend aliases)
  const isVictim = userProfile?.role === USER_ROLES.VICTIM || userProfile?.role === 'citizen' || !userProfile?.role;
  const isCitizen = isVictim;
  const isVolunteer = userProfile?.role === USER_ROLES.VOLUNTEER || userProfile?.role === 'volunteer';
  const isOrganization = userProfile?.role === USER_ROLES.ORGANIZATION;
  const isAdmin = userProfile?.role === USER_ROLES.ADMIN;
  const isCoordinator = isOrganization || isAdmin || userProfile?.role === 'coordinator';

  // Demo Switch helpers for frontend UI compatibility
  const switchRole = (roleKey) => {
    const roleMapping = {
      citizen: USER_ROLES.VICTIM,
      volunteer: USER_ROLES.VOLUNTEER,
      coordinator: USER_ROLES.ORGANIZATION,
    };
    const targetRole = roleMapping[roleKey] || roleKey;
    setUserProfile((prev) => ({
      ...(prev || {}),
      role: targetRole,
      roleLabel: targetRole,
    }));
  };

  const loginAs = (roleKey) => {
    switchRole(roleKey);
  };

  // Portal view helpers (Sharvari's User & Authority login portals)
  const isUser = isVictim || userProfile?.role === 'user' || userProfile?.role === USER_ROLES.VICTIM || !userProfile?.role;
  const isAuthority = isVolunteer || isOrganization || isAdmin || userProfile?.role === 'authority';

  const loginAsUser = (userData = {}) => {
    const userSession = {
      type: 'user',
      name: 'Aditya Sharma',
      phone: '+91 98765 43210',
      mobileNo: '+91 98765 43210',
      bloodGroup: 'O+',
      age: 28,
      role: USER_ROLES.VICTIM,
      ...userData,
    };
    setUserProfile(userSession);
    return userSession;
  };

  const loginAsAuthority = (authData = {}) => {
    const authSession = {
      type: 'authority',
      name: 'Captain R. Deshmukh',
      authorityId: 'NDRF-W7-409',
      unit: 'National Disaster Response Force (NDRF)',
      rank: 'Senior Operations Commander',
      role: USER_ROLES.ORGANIZATION,
      ...authData,
    };
    setUserProfile(authSession);
    return authSession;
  };

  const value = {
    session: userProfile || currentUser,
    currentUser: currentUser || userProfile,
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
    switchRole,
    loginAs,
    loginAsUser,
    loginAsAuthority,
    isVictim,
    isCitizen,
    isVolunteer,
    isOrganization,
    isAdmin,
    isCoordinator,
    isUser,
    isAuthority,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Re-export useAuth directly from AuthContext for Sharvari's components
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

