import { useContext } from 'react';
import { AuthContext } from '../context/authContextInstance';

/**
 * Custom hook to consume the AuthContext
 *
 * @returns {Object} auth state and methods
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
