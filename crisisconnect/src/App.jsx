import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CrisisProvider } from './context/CrisisContext';
import { LanguageProvider } from './context/LanguageContext';

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';

// 1. Citizen Portal Pages (Flow: Login -> Dashboard -> Create Request -> Submitted -> Track Status)
import UserDashboard from './pages/user/UserDashboard';
import UserCreateRequest from './pages/user/UserCreateRequest';
import UserRequestSubmitted from './pages/user/UserRequestSubmitted';
import UserTrackStatus from './pages/user/UserTrackStatus';

// 2. NGO Portal Pages (Flow: NGO Login -> Volunteer Service & Missions -> Donations & Supplies Management)
import NGODashboard from './pages/ngo/NGODashboard';

// 3. Authority Portal Pages (Flow: Authority Login -> Situation Monitor -> Verify Incidents -> Assign NGOs -> Mark Safe)
import AuthorityDashboard from './pages/authority/AuthorityDashboard';
import AuthorityRequests from './pages/authority/AuthorityRequests';

// Shared Disaster Modules
import Requests from './pages/Requests';
import RequestDetails from './pages/RequestDetails';
import MapView from './pages/MapView';
import Profile from './pages/Profile';

import React, { useEffect } from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App ErrorBoundary caught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <h2 className="text-xl font-black">Something went wrong</h2>
          <p className="text-xs text-slate-400 max-w-sm">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/';
            }}
            className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RootRedirect() {
  const { session } = useAuth();

  let activeSession = session;
  if (!activeSession) {
    try {
      const saved = localStorage.getItem('crisisconnect_session_v3');
      if (saved) activeSession = JSON.parse(saved);
    } catch {}
  }

  if (activeSession) {
    const roleType = (activeSession.type || activeSession.role || '').toLowerCase();
    if (roleType === 'authority') return <Navigate to="/authority/dashboard" replace />;
    if (roleType === 'ngo') return <Navigate to="/ngo/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  useEffect(() => {
    // Automatically smooth-scroll focused input into view above keypad
    const handleFocusIn = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) {
        setTimeout(() => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };
    window.addEventListener('focusin', handleFocusIn);
    return () => window.removeEventListener('focusin', handleFocusIn);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center antialiased">
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '600',
            borderRadius: '16px',
            padding: '10px 16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          },
        }}
      />

      {/* Main App Container */}
      <div className="w-full sm:max-w-4xl min-h-screen bg-slate-50 flex flex-col relative sm:shadow-xl sm:border-x sm:border-slate-200">
        <Navbar />

        <main className="flex-1 pb-16">
          <Routes>
            {/* Landing: Smart Root Redirect to respective portal or login */}
            <Route path="/" element={<RootRedirect />} />

            {/* 3-Role Gateway Authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 1. CITIZEN PORTAL */}
            <Route path="/user/dashboard" element={<ProtectedRoute allowedRoles={['citizen']}><UserDashboard /></ProtectedRoute>} />
            <Route path="/user/create" element={<ProtectedRoute allowedRoles={['citizen']}><UserCreateRequest /></ProtectedRoute>} />
            <Route path="/user/submitted/:id" element={<ProtectedRoute allowedRoles={['citizen']}><UserRequestSubmitted /></ProtectedRoute>} />
            <Route path="/user/track/:id" element={<ProtectedRoute allowedRoles={['citizen']}><UserTrackStatus /></ProtectedRoute>} />

            {/* 2. NGO OPERATIONS PORTAL */}
            <Route path="/ngo/dashboard" element={<ProtectedRoute allowedRoles={['ngo']}><NGODashboard /></ProtectedRoute>} />

            {/* 3. DISASTER AUTHORITY PORTAL */}
            <Route path="/authority/dashboard" element={<ProtectedRoute allowedRoles={['authority']}><AuthorityDashboard /></ProtectedRoute>} />
            <Route path="/authority/requests" element={<ProtectedRoute allowedRoles={['authority']}><AuthorityRequests /></ProtectedRoute>} />

            {/* SHARED DISASTER MODULES */}
            <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
            <Route path="/requests/:id" element={<ProtectedRoute><RequestDetails /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <CrisisProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </CrisisProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}
