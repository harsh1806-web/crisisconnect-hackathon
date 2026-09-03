import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  PhoneCall,
  Building2,
  User,
  HeartHandshake,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCrisis } from '../context/CrisisContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthority, isNGO, logout } = useAuth();
  const { crisisInfo } = useCrisis();

  const isLoginPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs w-full max-w-full overflow-hidden">
      {/* Top Status Bar */}
      <div className="bg-slate-950 text-white text-[11px] px-3 py-1.5 flex items-center justify-between w-full max-w-full">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-bold text-red-400 uppercase tracking-wider text-[10px] shrink-0">
            CrisisConnect
          </span>
          <span className="text-slate-400 text-[10px] truncate hidden xs:inline">• {crisisInfo.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher variant="dark" />
          <a
            href="tel:112"
            className="flex items-center gap-1 text-emerald-400 font-bold hover:underline shrink-0 text-[10px]"
          >
            <PhoneCall className="w-3 h-3" /> 112
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="w-full max-w-md mx-auto px-3 py-2 flex items-center justify-between">
        {/* Brand */}
        <Link
          to={
            isAuthority
              ? '/authority/dashboard'
              : isNGO
              ? '/ngo/dashboard'
              : '/user/dashboard'
          }
          className="flex items-center gap-2"
        >
          <img
            src="/logo.png"
            alt="CrisisConnect"
            className="w-8 h-8 rounded-xl object-contain bg-white shadow-xs p-0.5 border border-slate-200"
          />
          <div>
            <span className="font-black text-slate-900 tracking-tight text-sm">
              Crisis<span className="text-red-600">Connect</span>
            </span>
            <span className="text-[9px] text-slate-400 block -mt-1 font-semibold">
              Disaster Response
            </span>
          </div>
        </Link>

        {/* Portal status indicator & switch */}
        {!isLoginPage && (
          <div className="flex items-center gap-2">
            {isAuthority ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                <Building2 className="w-3 h-3" /> Authority EOC
              </span>
            ) : isNGO ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <HeartHandshake className="w-3 h-3" /> Relief NGO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                <User className="w-3 h-3" /> Citizen
              </span>
            )}

            <Link
              to="/login"
              className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1"
              title="Switch between Citizen, NGO, and Authority portals"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
