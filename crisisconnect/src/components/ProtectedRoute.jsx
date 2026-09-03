import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { session } = useAuth();
  const location = useLocation();

  // Check React session state or synchronous localStorage fallback to eliminate any async race conditions
  let activeSession = session;
  if (!activeSession) {
    try {
      const saved = localStorage.getItem('crisisconnect_session_v3');
      if (saved) {
        activeSession = JSON.parse(saved);
      }
    } catch (e) {}
  }

  if (!activeSession) {
    // User is logged out: kick back to login and replace history entry
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const roleType = (activeSession.type || activeSession.role || '').toLowerCase();

  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some((r) => r.toLowerCase() === roleType);
    if (!isAllowed) {
      if (roleType === 'authority') return <Navigate to="/authority/dashboard" replace />;
      if (roleType === 'ngo') return <Navigate to="/ngo/dashboard" replace />;
      return <Navigate to="/user/dashboard" replace />;
    }
  }

  return children;
}
