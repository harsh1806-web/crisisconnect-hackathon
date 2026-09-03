import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CrisisProvider } from './context/CrisisContext';

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

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

import { useEffect } from 'react';

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

        <main className="flex-1 pb-36">
          <Routes>
            {/* Landing: Always show Login page first on localhost */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 3-Role Gateway Authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 1. CITIZEN PORTAL */}
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/create" element={<UserCreateRequest />} />
            <Route path="/user/submitted/:id" element={<UserRequestSubmitted />} />
            <Route path="/user/track/:id" element={<UserTrackStatus />} />

            {/* 2. NGO OPERATIONS PORTAL */}
            <Route path="/ngo/dashboard" element={<NGODashboard />} />

            {/* 3. DISASTER AUTHORITY PORTAL */}
            <Route path="/authority/dashboard" element={<AuthorityDashboard />} />
            <Route path="/authority/requests" element={<AuthorityRequests />} />

            {/* SHARED DISASTER MODULES */}
            <Route path="/requests" element={<Requests />} />
            <Route path="/requests/:id" element={<RequestDetails />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/profile" element={<Profile />} />

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
      <AuthProvider>
        <CrisisProvider>
          <AppRoutes />
        </CrisisProvider>
      </AuthProvider>
    </Router>
  );
}
