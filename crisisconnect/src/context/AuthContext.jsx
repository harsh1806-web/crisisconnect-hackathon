import { useEffect, useState } from 'react';
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

  // Helper flags for role-based views
  const isVictim = userProfile?.role === USER_ROLES.VICTIM;
  const isVolunteer = userProfile?.role === USER_ROLES.VOLUNTEER;
  const isOrganization = userProfile?.role === USER_ROLES.ORGANIZATION;
  const isAdmin = userProfile?.role === USER_ROLES.ADMIN;

  const value = {
    currentUser,
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
    isVictim,
    isVolunteer,
    isOrganization,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
