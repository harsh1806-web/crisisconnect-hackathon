import { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_PROFILES } from '../data/mockData';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { type: 'user', ...DEMO_PROFILES.user };
      }
    }
    // Default to user demo so testing works out of the box
    return { type: 'user', ...DEMO_PROFILES.user };
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem('crisisconnect_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('crisisconnect_session');
    }
  }, [session]);

  const loginAsUser = (userData = {}) => {
    const userSession = {
      type: 'user',
      ...DEMO_PROFILES.user,
      ...userData,
    };
    setSession(userSession);
    toast.success(`Welcome, ${userSession.name}!`);
    return userSession;
  };

  const loginAsAuthority = (authData = {}) => {
    const authSession = {
      type: 'authority',
      ...DEMO_PROFILES.authority,
      ...authData,
    };
    setSession(authSession);
    toast.success(`Authority Portal: Signed in as ${authSession.rank}`);
    return authSession;
  };

  const logout = () => {
    setSession(null);
    toast('Logged out of CrisisConnect', { icon: '🚪' });
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        currentUser: session,
        isUser: session?.type === 'user',
        isAuthority: session?.type === 'authority',
        loginAsUser,
        loginAsAuthority,
        logout,
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
