import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    // User is logged out: kick back to login and replace history entry so back button cannot re-enter
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(session.type)) {
    // User is logged in under a different role: send them to their own dashboard
    if (session.type === 'authority') return <Navigate to="/authority/dashboard" replace />;
    if (session.type === 'ngo') return <Navigate to="/ngo/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
}
