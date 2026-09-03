import { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_PROFILES } from '../data/mockData';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
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

  const loginAsCitizen = (userData = {}) => {
    const s = {
      type: 'citizen',
      ...DEMO_PROFILES.citizen,
      ...userData,
    };
    setSession(s);
    toast.success(`Welcome Citizen: ${s.name}!`);
    return s;
  };

  const loginAsNGO = (ngoData = {}) => {
    const s = {
      type: 'ngo',
      ...DEMO_PROFILES.ngo,
      ...ngoData,
    };
    setSession(s);
    toast.success(`NGO Portal: Signed in with ${s.ngoName}`);
    return s;
  };

  const loginAsAuthority = (authData = {}) => {
    const s = {
      type: 'authority',
      ...DEMO_PROFILES.authority,
      ...authData,
    };
    setSession(s);
    toast.success(`Authority Command: Signed in as ${s.rank}`);
    return s;
  };

  const logout = () => {
    setSession(null);
    toast('Signed out from CrisisConnect', { icon: '🚪' });
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        currentUser: session,
        isCitizen: session?.type === 'citizen',
        isUser: session?.type === 'citizen', // alias for citizen
        isNGO: session?.type === 'ngo',
        isAuthority: session?.type === 'authority',
        loginAsCitizen,
        loginAsUser: loginAsCitizen, // alias
        loginAsNGO,
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
