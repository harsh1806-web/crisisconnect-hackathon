import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  User,
  HeartHandshake,
  Building2,
  Phone,
  PhoneCall,
  ArrowRight,
  KeyRound,
  IdCard,
  UserPlus,
  Database,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { registerActiveDeviceSession } from '../services/notificationService';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginAsCitizen, loginAsNGO, loginAsAuthority } = useAuth();
  const [activeTab, setActiveTab] = useState('citizen'); // 'citizen' | 'ngo' | 'authority'

  // Citizen form - initialized directly from searchParams if redirected from registration
  const userName = searchParams.get('name') || '';
  const [userPhone, setUserPhone] = useState(() => searchParams.get('phone') || '');
  const [userPassword, setUserPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // NGO form
  const [ngoName, setNgoName] = useState('Red Cross Disaster Relief Corps');
  const [ngoOfficer, setNgoOfficer] = useState('');

  // Authority form
  const [authDept, setAuthDept] = useState('Disaster Management & Civil Defense (NDMA)');
  const [badgeId, setBadgeId] = useState('');
  const [securityPin, setSecurityPin] = useState('');

  const handleCitizenSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = userPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Mobile phone number must be exactly 10 digits (no more, no less).');
      return;
    }

    const cleanPassword = userPassword.trim();
    if (!cleanPassword) {
      toast.error('Password is required. Please enter your password.');
      return;
    }

    setIsVerifying(true);

    try {
      // 1. Direct Supabase Query to verify registered citizen
      const { data: citizen, error } = await supabase
        .from('citizens')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error) {
        toast.error('Supabase query error: ' + error.message);
        setIsVerifying(false);
        return;
      }

      // 2. If citizen not registered in Supabase, prompt to register first
      if (!citizen) {
        toast.error(`Phone ${cleanPhone} is not registered in Supabase. Please register first!`, {
          duration: 4000,
        });
        setIsVerifying(false);
        navigate(`/register?phone=${encodeURIComponent(cleanPhone)}&name=${encodeURIComponent(userName)}`);
        return;
      }

      // 3. Verify password (mandatory)
      if (citizen.password_hash && citizen.password_hash !== cleanPassword) {
        toast.error('Incorrect password. Please verify and try again.');
        setIsVerifying(false);
        return;
      }

      // 4. Register mobile device token & request push alert permissions
      await registerActiveDeviceSession({
        id: citizen.id,
        phone: citizen.phone,
        name: citizen.name,
        bloodGroup: citizen.blood_group,
        role: 'CITIZEN',
        latitude: citizen.latitude,
        longitude: citizen.longitude,
      });

      toast.success('📱 Mobile device registered in Supabase for live emergency alerts!');

      // 5. Login citizen with real Supabase record
      loginAsCitizen({
        id: citizen.id,
        name: citizen.name,
        phone: citizen.phone,
        email: citizen.email,
        bloodGroup: citizen.blood_group,
        age: citizen.age,
        address: citizen.address,
        emergencyContact: {
          name: citizen.ice_name || 'Primary Contact',
          phone: citizen.ice_phone || citizen.phone || '+91 99999 00000',
        },
        location: {
          lat: citizen.latitude,
          lng: citizen.longitude,
          address: citizen.address,
        },
      });

      toast.success(`Verified from Supabase Database! Welcome, ${citizen.name}.`);
      navigate('/user/dashboard');
    } catch (err) {
      toast.error('Login error: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNGOSubmit = (e) => {
    e.preventDefault();
    loginAsNGO({
      ngoName,
      name: ngoOfficer || 'Field Lead',
    });
    navigate('/ngo/dashboard');
  };

  const handleAuthoritySubmit = (e) => {
    e.preventDefault();
    if (!badgeId.trim() || !securityPin.trim()) {
      toast.error('Please enter Badge ID and PIN.');
      return;
    }
    loginAsAuthority({
      department: authDept,
      badgeId: badgeId.toUpperCase(),
      rank: 'Duty Incident Commander',
    });
    navigate('/authority/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top App Header */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white p-6 text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/40 border border-white/20">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Crisis<span className="text-red-500">Connect</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Emergency Response & Relief Management Platform
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Disaster Database Online
            </span>
          </div>
        </div>

        {/* 3-Role Gateway Segmented Control */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
            Select Your Role to Enter:
          </p>
          <div className="grid grid-cols-3 p-1 bg-slate-200/80 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('citizen')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'citizen'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-red-600" />
              <span>Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ngo')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'ngo'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
              <span>NGO Org</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('authority')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'authority'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Authority</span>
            </button>
          </div>
        </div>

        {/* Tab Forms Body */}
        <div className="p-6">
          {/* TAB 1: CITIZEN */}
          {activeTab === 'citizen' && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-base font-bold text-slate-900">Citizen Login</h2>
                <p className="text-xs text-slate-500">
                  Register in database first or login with registered phone
                </p>
              </div>

              {/* REGISTER FIRST CTA BANNER */}
              <div className="p-3.5 bg-red-50/90 rounded-2xl border-2 border-dashed border-red-300 text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-red-700 font-bold text-xs">
                  <Database className="w-4 h-4 text-red-600" />
                  <span>New Citizen? Register in Database First:</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Save your name, medical notes & ICE emergency contact to the disaster registry.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>REGISTER CITIZEN INFO FIRST</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <form onSubmit={handleCitizenSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Mobile Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number (e.g. 9850422491)"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium tracking-wide"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer mt-1 flex items-center justify-center gap-2"
                >
                  {isVerifying ? 'Verifying with Supabase...' : 'Verify from Database & Enter Dashboard'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: NGO / RELIEF ORGANIZATION */}
          {activeTab === 'ngo' && (
            <div className="space-y-4">
              <div className="text-center mb-3">
                <h2 className="text-base font-bold text-slate-900">NGO Operations Portal</h2>
                <p className="text-xs text-slate-500">
                  Manage field volunteer squads, rescue missions & relief donations
                </p>
              </div>

              <form onSubmit={handleNGOSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Relief Organization
                  </label>
                  <select
                    value={ngoName}
                    onChange={(e) => setNgoName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option>Red Cross Disaster Relief Corps</option>
                    <option>National Disaster Response Force (NDRF)</option>
                    <option>Coastal Volunteer Boat Lifeline</option>
                    <option>Food & Shelter Relief Alliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Coordinator / Lead Name
                  </label>
                  <input
                    type="text"
                    value={ngoOfficer}
                    onChange={(e) => setNgoOfficer(e.target.value)}
                    placeholder="e.g. Capt. Tariq Khan"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer mt-1"
                >
                  Enter NGO Operations Hub
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: DISASTER AUTHORITY */}
          {activeTab === 'authority' && (
            <div className="space-y-4">
              <div className="text-center mb-3">
                <h2 className="text-base font-bold text-slate-900">Disaster Authority Portal</h2>
                <p className="text-xs text-slate-500">
                  Verify incidents, deploy registered NGOs & monitor live SOS situations
                </p>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-tight">
                🔒 <strong>Official Role Notice:</strong> Authorities manage and verify relief responses. Emergency posting is restricted to citizens.
              </div>

              <form onSubmit={handleAuthoritySubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department / Agency
                  </label>
                  <select
                    value={authDept}
                    onChange={(e) => setAuthDept(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option>Disaster Management & Civil Defense (NDMA)</option>
                    <option>State Police & Flood Rescue Unit</option>
                    <option>Coast Guard Maritime Coordination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Badge ID
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
                    Passcode PIN
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
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer mt-1"
                >
                  Access Authority Command Center
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100/70 border-t border-slate-200 text-center">
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Toll-Free Emergency Hotline: 112
          </a>
        </div>
      </div>
    </div>
  );
}
