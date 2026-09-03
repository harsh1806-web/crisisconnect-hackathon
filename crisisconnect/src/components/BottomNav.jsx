import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  PlusCircle,
  Clock,
  User,
  ListFilter,
  Building2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { isAuthority } = useAuth();

  // Don't render bottom nav on login gateway page
  if (location.pathname === '/login') return null;

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg px-2 py-1 max-w-md mx-auto sm:border-x">
      {isAuthority ? (
        /* Authority Bottom Navigation */
        <div className="flex items-center justify-around">
          <Link
            to="/authority/dashboard"
            className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors ${
              isActive('/authority/dashboard') ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-5 h-5 mb-0.5" />
            <span>Command</span>
          </Link>

          <Link
            to="/authority/requests"
            className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors ${
              isActive('/authority/requests') ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-5 h-5 mb-0.5" />
            <span>Queue</span>
          </Link>

          <Link
            to="/map"
            className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors ${
              isActive('/map') ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-5 h-5 mb-0.5" />
            <span>Disaster Map</span>
          </Link>

          <Link
            to="/login"
            className="flex flex-col items-center py-1 px-3 text-[10px] font-semibold text-slate-500 hover:text-slate-900"
          >
            <LogOut className="w-5 h-5 mb-0.5" />
            <span>Switch</span>
          </Link>
        </div>
      ) : (
        /* Citizen User Bottom Navigation */
        <div className="flex items-center justify-around">
          <Link
            to="/user/dashboard"
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors ${
              isActive('/user/dashboard') ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </Link>

          <Link
            to="/map"
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors ${
              isActive('/map') ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-5 h-5 mb-0.5" />
            <span>Map</span>
          </Link>

          {/* Floating Center Request Action */}
          <Link to="/user/create" className="flex flex-col items-center -mt-5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-500/40 border-2 border-white hover:scale-105 active:scale-95 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-red-600 mt-1">Request Aid</span>
          </Link>

          <Link
            to="/requests"
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors ${
              isActive('/requests') ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span>Feed</span>
          </Link>

          <Link
            to="/profile"
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors ${
              isActive('/profile') ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span>ICE Profile</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
