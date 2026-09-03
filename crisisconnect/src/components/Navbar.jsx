import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  PhoneCall,
  User,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCrisis } from '../context/CrisisContext';
import SOSButton from './SOSButton';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const { currentUser, switchRole } = useAuth();
  const { crisisInfo, requests } = useCrisis();
  const location = useLocation();

  const criticalCount = requests.filter(
    (r) => r.urgency === 'critical' && r.status !== 'resolved'
  ).length;

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Aid Requests', path: '/requests', badge: criticalCount > 0 ? criticalCount : null },
    { name: 'Crisis Map', path: '/map' },
    { name: 'Request Help', path: '/create', highlight: true },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top emergency status ticker */}
      <div className="bg-slate-900 text-white text-xs px-4 py-1.5 flex items-center justify-between overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-semibold text-red-400 uppercase tracking-wider text-[11px]">
            {crisisInfo.status}:
          </span>
          <span className="text-slate-300 text-[11px] truncate max-w-[280px] sm:max-w-md">
            {crisisInfo.title}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <a
            href="tel:112"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <PhoneCall className="w-3 h-3" /> Hotline: 112
          </a>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-amber-400 font-medium">
            Active Cases: {crisisInfo.stats.activeRequests}
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  Crisis<span className="text-red-600">Connect</span>
                </span>
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium -mt-1">
                Disaster Relief Network
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  link.highlight
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200'
                    : isActive(link.path)
                    ? 'bg-slate-100 text-red-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.name}
                {link.badge && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons & Role Switcher */}
          <div className="hidden md:flex items-center gap-3">
            <SOSButton variant="compact" />

            {/* Role Demo Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
              >
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  className="w-6 h-6 rounded-full object-cover border border-slate-200"
                />
                <div className="text-left">
                  <p className="text-[11px] font-bold leading-tight text-slate-900 truncate max-w-[100px]">
                    {currentUser?.name?.split(' ')[0]}
                  </p>
                  <p className="text-[9px] text-rose-600 font-bold uppercase tracking-wider">
                    {currentUser?.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-white p-2 shadow-xl border border-slate-200 z-50 animate-fade-in"
                  onMouseLeave={() => setRoleDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Demo Role Switcher
                    </p>
                    <p className="text-xs text-slate-600 font-medium">
                      Simulate different crisis user roles:
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      switchRole('citizen');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                      currentUser?.role === 'citizen'
                        ? 'bg-red-50 text-red-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">Citizen / Requester</p>
                      <p className="text-[10px] text-slate-500">Post SOS & track requests</p>
                    </div>
                    {currentUser?.role === 'citizen' && <span className="text-red-600 text-xs">✓</span>}
                  </button>

                  <button
                    onClick={() => {
                      switchRole('volunteer');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                      currentUser?.role === 'volunteer'
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">Volunteer / Responder</p>
                      <p className="text-[10px] text-slate-500">Accept rescue missions</p>
                    </div>
                    {currentUser?.role === 'volunteer' && <span className="text-emerald-600 text-xs">✓</span>}
                  </button>

                  <button
                    onClick={() => {
                      switchRole('coordinator');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                      currentUser?.role === 'coordinator'
                        ? 'bg-purple-50 text-purple-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">EOC Coordinator</p>
                      <p className="text-[10px] text-slate-500">Broadcast alerts & manage</p>
                    </div>
                    {currentUser?.role === 'coordinator' && <span className="text-purple-600 text-xs">✓</span>}
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <Link
                      to="/profile"
                      onClick={() => setRoleDropdownOpen(false)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5" /> View ICE Profile
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <SOSButton variant="compact" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2 animate-fade-in shadow-xl">
          <div className="py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
                <p className="text-[10px] text-red-600 font-semibold uppercase">{currentUser?.roleLabel}</p>
              </div>
            </div>
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-slate-600 underline"
            >
              Profile
            </Link>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  isActive(link.path)
                    ? 'bg-red-50 text-red-600 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Switch Demo Role:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <button
                onClick={() => switchRole('citizen')}
                className={`p-2 rounded-lg border font-semibold ${
                  currentUser?.role === 'citizen'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Citizen
              </button>
              <button
                onClick={() => switchRole('volunteer')}
                className={`p-2 rounded-lg border font-semibold ${
                  currentUser?.role === 'volunteer'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Volunteer
              </button>
              <button
                onClick={() => switchRole('coordinator')}
                className={`p-2 rounded-lg border font-semibold ${
                  currentUser?.role === 'coordinator'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                EOC Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
