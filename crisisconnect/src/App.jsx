import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CrisisProvider } from './context/CrisisContext';

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

import Dashboard from './pages/Dashboard';
import Requests from './pages/Requests';
import RequestDetails from './pages/RequestDetails';
import CreateRequest from './pages/CreateRequest';
import MapView from './pages/MapView';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { ShieldAlert, Radio } from 'lucide-react';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CrisisProvider>
          <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
            {/* Notification Toast container */}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  padding: '12px 16px',
                },
              }}
            />

            {/* Global Top Navigation */}
            <Navbar />

            {/* Main Application Routes */}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/requests/:id" element={<RequestDetails />} />
                <Route path="/create" element={<CreateRequest />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </main>

            {/* Global Footer (desktop) */}
            <footer className="hidden md:block bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-900">CrisisConnect</span>
                  <span>— Open Disaster Relief & Citizen Rescue Network</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600 font-medium">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Radio className="w-3.5 h-3.5 animate-pulse" /> EOC Nodes Online
                  </span>
                  <span>•</span>
                  <Link to="/map" className="hover:text-red-600">Disaster Map</Link>
                  <span>•</span>
                  <Link to="/requests" className="hover:text-red-600">Requests Feed</Link>
                  <span>•</span>
                  <Link to="/login" className="hover:text-red-600">Demo Role Switch</Link>
                </div>
              </div>
            </footer>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
          </div>
        </CrisisProvider>
      </AuthProvider>
    </Router>
  );
}
