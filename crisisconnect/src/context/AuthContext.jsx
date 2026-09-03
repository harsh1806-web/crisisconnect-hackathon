import { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS } from '../data/mockData';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEMO_USERS.citizen;
      }
    }
    return DEMO_USERS.citizen;
  });

  useEffect(() => {
    localStorage.setItem('crisisconnect_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const switchRole = (roleKey) => {
    if (DEMO_USERS[roleKey]) {
      setCurrentUser(DEMO_USERS[roleKey]);
      toast.success(`Switched role to ${DEMO_USERS[roleKey].roleLabel}`);
    }
  };

  const loginAs = (roleKey) => {
    if (DEMO_USERS[roleKey]) {
      setCurrentUser(DEMO_USERS[roleKey]);
      toast.success(`Signed in as ${DEMO_USERS[roleKey].name}`);
    }
  };

  const logout = () => {
    // Reverts to citizen guest
    setCurrentUser(DEMO_USERS.citizen);
    toast('Logged out to default guest view', { icon: 'ℹ️' });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchRole,
        loginAs,
        logout,
        isVolunteer: currentUser?.role === 'volunteer',
        isCoordinator: currentUser?.role === 'coordinator',
        isCitizen: currentUser?.role === 'citizen',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
