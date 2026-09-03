import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  PlusCircle,
  Clock,
  User,
  ListFilter,
  Building2,
  HeartHandshake,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthority, isNGO, logout } = useAuth();
  const { t } = useLanguage();

  // Don't render bottom nav on login or registration gateway pages
  if (location.pathname === '/login' || location.pathname === '/register') return null;

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-2xl px-2 pt-1.5 pb-2.5 max-w-md mx-auto sm:border-x">
      {isAuthority ? (
        /* Authority Bottom Navigation (No Emergency creation button) */
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
            <span>Incoming Requests</span>
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

          <button
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="flex flex-col items-center py-1 px-3 text-[10px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <LogOut className="w-5 h-5 mb-0.5" />
            <span>Switch Role</span>
          </button>
        </div>
      ) : isNGO ? (
        /* NGO Bottom Navigation (Volunteer service & Donations) */
        <div className="flex items-center justify-around">
          <Link
            to="/ngo/dashboard"
            className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors ${
              isActive('/ngo/dashboard') ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <HeartHandshake className="w-5 h-5 mb-0.5" />
            <span>Relief Ops</span>
          </Link>

          <Link
            to="/map"
            className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors ${
              isActive('/map') ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-5 h-5 mb-0.5" />
            <span>Map</span>
          </Link>

          <Link
            to="/requests"
            className={`flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors ${
              isActive('/requests') ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span>Feed</span>
          </Link>

          <button
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="flex flex-col items-center py-1 px-3 text-[10px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <LogOut className="w-5 h-5 mb-0.5" />
            <span>Switch</span>
          </button>
        </div>
      ) : (
        /* Citizen User Bottom Navigation */
        <div className="flex items-center justify-between">
          <Link
            to="/user/dashboard"
            className={`flex-1 flex flex-col items-center py-1 px-1 text-[10px] font-semibold transition-colors min-w-0 ${
              isActive('/user/dashboard') ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="truncate max-w-full">{t('nav_home')}</span>
          </Link>

          <Link
            to="/map"
            className={`flex-1 flex flex-col items-center py-1 px-1 text-[10px] font-semibold transition-colors min-w-0 ${
              isActive('/map') ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="truncate max-w-full">{t('nav_map')}</span>
          </Link>

          {/* Floating Center Request Action */}
          <Link to="/user/create" className="flex-1 flex flex-col items-center -mt-3 shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-500/40 border-2 border-white hover:scale-105 active:scale-95 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold text-red-600 mt-0.5 truncate max-w-full">
              {t('nav_request_aid') || 'Request Aid'}
            </span>
          </Link>

          <Link
            to="/requests"
            className={`flex-1 flex flex-col items-center py-1 px-1 text-[10px] font-semibold transition-colors min-w-0 ${
              isActive('/requests') ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="truncate max-w-full">{t('nav_incidents')}</span>
          </Link>

          <Link
            to="/profile"
            className={`flex-1 flex flex-col items-center py-1 px-1 text-[10px] font-semibold transition-colors min-w-0 ${
              isActive('/profile') ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="truncate max-w-full">{t('nav_profile')}</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
