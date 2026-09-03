import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  User,
  Building2,
  Phone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  PhoneCall,
  KeyRound,
  IdCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { loginAsUser, loginAsAuthority } = useAuth();
  const [activeTab, setActiveTab] = useState('user'); // 'user' | 'authority'

  // User form states
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Authority form states
  const [authDept, setAuthDept] = useState('Disaster Management & Civil Defense (NDMA)');
  const [badgeId, setBadgeId] = useState('');
  const [securityPin, setSecurityPin] = useState('');

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) {
      toast.error('Please provide your name and contact phone number.');
      return;
    }
    loginAsUser({ name: userName, phone: userPhone });
    navigate('/user/dashboard');
  };

  const handleAuthoritySubmit = (e) => {
    e.preventDefault();
    if (!badgeId.trim() || !securityPin.trim()) {
      toast.error('Please enter your Official Badge ID and Security PIN.');
      return;
    }
    loginAsAuthority({
      department: authDept,
      badgeId: badgeId.toUpperCase(),
      rank: 'Senior Duty Officer',
    });
    navigate('/authority/dashboard');
  };

  const handleQuickCitizenDemo = () => {
    loginAsUser();
    navigate('/user/dashboard');
  };

  const handleQuickAuthorityDemo = () => {
    loginAsAuthority();
    navigate('/authority/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* App Splash Banner */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white p-6 text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/40 border border-white/20">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Crisis<span className="text-red-500">Connect</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Emergency Relief & Disaster Rescue Network
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              EOC Emergency Portal Live
            </span>
          </div>
        </div>

        {/* Portal Selector Tabs */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('user')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'user'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-red-600" />
              <span>Citizen / User</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('authority')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'authority'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Authority / NGO</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {activeTab === 'user' ? (
            /* USER LOGIN FLOW */
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-base font-bold text-slate-900">Citizen Emergency Login</h2>
                <p className="text-xs text-slate-500">
                  Request rescue, track emergency status & receive live relief updates
                </p>
              </div>

              {/* 1-Click Quick Demo User */}
              <button
                type="button"
                onClick={handleQuickCitizenDemo}
                className="w-full p-3 rounded-2xl border-2 border-red-200 bg-red-50/70 hover:bg-red-100 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-red-700">
                      ⚡ 1-Click Demo as Citizen (Alex Taylor)
                    </p>
                    <p className="text-[10px] text-slate-500">Pre-filled profile & active cases</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-red-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="relative flex items-center justify-center my-3">
                <span className="absolute inset-x-0 border-t border-slate-200" />
                <span className="relative bg-white px-2 text-[10px] uppercase font-bold text-slate-400">
                  Or sign in with phone
                </span>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (SMS Alert Updates)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+1 (555) 019-9000"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all cursor-pointer mt-2"
                >
                  Enter Citizen Dashboard
                </button>
              </form>
            </div>
          ) : (
            /* AUTHORITY LOGIN FLOW */
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-base font-bold text-slate-900">Disaster Authority Portal</h2>
                <p className="text-xs text-slate-500">
                  Verify incidents, deploy NGOs, coordinate volunteers & mark safe
                </p>
              </div>

              {/* 1-Click Quick Demo Authority */}
              <button
                type="button"
                onClick={handleQuickAuthorityDemo}
                className="w-full p-3 rounded-2xl border-2 border-blue-200 bg-blue-50/70 hover:bg-blue-100 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      ⚡ 1-Click Demo as Commander Rathore
                    </p>
                    <p className="text-[10px] text-slate-500">NDMA / Incident Operations Command</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="relative flex items-center justify-center my-3">
                <span className="absolute inset-x-0 border-t border-slate-200" />
                <span className="relative bg-white px-2 text-[10px] uppercase font-bold text-slate-400">
                  Or official credentials
                </span>
              </div>

              <form onSubmit={handleAuthoritySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department / Agency
                  </label>
                  <select
                    value={authDept}
                    onChange={(e) => setAuthDept(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Disaster Management & Civil Defense (NDMA)</option>
                    <option>State Police & Flood Rescue Unit</option>
                    <option>Red Cross Emergency Operations</option>
                    <option>Coast Guard Maritime Coordination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Badge / Officer ID
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={badgeId}
                      onChange={(e) => setBadgeId(e.target.value)}
                      placeholder="e.g. NDMA-8821"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Passcode PIN
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={securityPin}
                      onChange={(e) => setSecurityPin(e.target.value)}
                      placeholder="••••"
                      maxLength={6}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer mt-2"
                >
                  Access Authority Command Center
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Emergency Footer Toll-Free */}
        <div className="px-6 py-3 bg-slate-100/70 border-t border-slate-200 text-center">
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Direct Emergency Line: 112
          </a>
        </div>
      </div>
    </div>
  );
}
