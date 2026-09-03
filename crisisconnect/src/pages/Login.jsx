import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, UserCheck, HeartHandshake, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS } from '../data/mockData';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { loginAs, currentUser } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleCustomPhoneLogin = (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number or use 1-click test role below.');
      return;
    }
    // Set custom citizen profile
    loginAs('citizen');
    navigate('/');
  };

  const handleQuickRole = (roleKey) => {
    loginAs(roleKey);
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-8 animate-fade-in pb-24 md:pb-12">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-red-500/30">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Sign In to CrisisConnect</h1>
        <p className="text-xs text-slate-500">
          Disaster response identity & coordination portal. Passwords are waived during active crises.
        </p>
      </div>

      {/* 1-Click Hackathon Demo Roles */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 1-Click Hackathon Roles
          </h2>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
            Recommended
          </span>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => handleQuickRole('citizen')}
            className="w-full p-3.5 rounded-2xl border border-red-200 bg-red-50/50 hover:bg-red-50 flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-red-600">
                  Citizen / Requester
                </p>
                <p className="text-[10px] text-slate-500">{DEMO_USERS.citizen.name}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => handleQuickRole('volunteer')}
            className="w-full p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">
                  Volunteer / Field Medic
                </p>
                <p className="text-[10px] text-slate-500">{DEMO_USERS.volunteer.name}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => handleQuickRole('coordinator')}
            className="w-full p-3.5 rounded-2xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-purple-600">
                  Relief Coordinator / EOC
                </p>
                <p className="text-[10px] text-slate-500">{DEMO_USERS.coordinator.name}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Phone Number / SMS OTP Mockup */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Or Quick Phone Verification
        </h2>
        <form onSubmit={handleCustomPhoneLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            Instant Emergency Access
          </button>
        </form>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        Active identity: <strong>{currentUser?.name}</strong> ({currentUser?.role})
      </p>
    </div>
  );
}
