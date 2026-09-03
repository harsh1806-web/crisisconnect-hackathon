import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MapPin, PlusCircle, ListFilter, User } from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';

export default function BottomNav() {
  const location = useLocation();
  const { requests } = useCrisis();

  const criticalCount = requests.filter(
    (r) => r.urgency === 'critical' && r.status !== 'resolved'
  ).length;

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg px-2 py-1">
      <div className="flex items-center justify-around">
        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors ${
            isActive('/') ? 'text-red-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>

        <Link
          to="/map"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors ${
            isActive('/map') ? 'text-red-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-5 h-5 mb-0.5" />
          <span>Map</span>
        </Link>

        {/* Center Prominent SOS / Create Action */}
        <Link
          to="/create"
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-500/40 border-2 border-white hover:scale-105 active:scale-95 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-red-600 mt-1">Request Aid</span>
        </Link>

        <Link
          to="/requests"
          className={`relative flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors ${
            isActive('/requests') ? 'text-red-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {criticalCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
          <ListFilter className="w-5 h-5 mb-0.5" />
          <span>Feed</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors ${
            isActive('/profile') ? 'text-red-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>ICE Profile</span>
        </Link>
      </div>
    </nav>
  );
}
