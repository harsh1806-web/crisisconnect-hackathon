import { useState, useEffect } from 'react';
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
  AlertOctagon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { registerActiveDeviceSession } from '../services/notificationService';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import PublicEmergencySOSModal from '../components/PublicEmergencySOSModal';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export const AUTHORITY_AGENCIES = [
  {
    id: 'police',
    name: 'State Police & Rapid Action Force (RAF)',
    shortName: 'Police Command',
    badge: 'POLICE-100',
    pin: 'police123',
    officer: 'Inspector General K. S. Rathore',
    rank: 'Chief of Police Operations',
    hotline: '100 / 112',
    icon: '🚓',
    desc: 'Law & order, perimeter cordoning, evacuation corridors, traffic clearance',
    theme: 'border-blue-500/40 bg-blue-50/70 text-blue-900',
  },
  {
    id: 'hospital',
    name: 'Emergency Medical Services & Trauma Center',
    shortName: 'Hospital / CMO (108)',
    badge: 'HOSPITAL-108',
    pin: 'hosp108',
    officer: 'Dr. Ananya Sen, Trauma Chief',
    rank: 'Chief Medical Officer (CMO)',
    hotline: '108',
    icon: '🏥',
    desc: 'Triage, ICU beds, blood bank allocation (O+, AB-), oxygen cylinders, trauma surgery',
    theme: 'border-red-500/40 bg-red-50/70 text-red-900',
  },
  {
    id: 'fire',
    name: 'Directorate of Fire & Rescue Services',
    shortName: 'Fire & HazMat Command (101)',
    badge: 'FIRE-101',
    pin: 'fire101',
    officer: 'Chief Marshal S. Nair',
    rank: 'Chief Fire Officer',
    hotline: '101',
    icon: '🚒',
    desc: 'Active blazes, LPG & toxic gas leaks, chemical neutralization, foam tenders',
    theme: 'border-orange-500/40 bg-orange-50/70 text-orange-900',
  },
  {
    id: 'ndrf',
    name: 'National Disaster Response Force (NDRF)',
    shortName: 'NDRF Water Rescue (1077)',
    badge: 'NDRF-1077',
    pin: 'ndrf1077',
    officer: 'Commander R. K. Verma',
    rank: '5th Battalion Commander',
    hotline: '1077',
    icon: '🚤',
    desc: 'Inflatable rescue boats, swift-water extraction, rooftop airlift, life jackets',
    theme: 'border-sky-500/40 bg-sky-50/70 text-sky-900',
  },
  {
    id: 'usar',
    name: 'Urban Search & Rescue (USAR) & SDRF',
    shortName: 'USAR Structural Rescue (112)',
    badge: 'USAR-112',
    pin: 'usar112',
    officer: 'Col. Vikram Rathore',
    rank: 'USAR Taskforce Commander',
    hotline: '112',
    icon: '🏚️',
    desc: 'Collapsed buildings, heavy concrete cutters, acoustic life detectors, K9 units',
    theme: 'border-purple-500/40 bg-purple-50/70 text-purple-900',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, currentUser, loginAsCitizen, loginAsNGO, loginAsAuthority } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('citizen'); // 'citizen' | 'ngo' | 'authority'

  // If user is already logged in and stored in phone cache, do not show login again; route immediately!
  useEffect(() => {
    let active = session || currentUser;
    if (!active) {
      try {
        const raw = localStorage.getItem('crisisconnect_session_v3') || localStorage.getItem('crisisconnect_persisted_auth');
        if (raw) active = JSON.parse(raw);
      } catch {}
    }
    if (active) {
      const role = (active.type || active.role || '').toLowerCase();
      if (role === 'authority') navigate('/authority/dashboard', { replace: true });
      else if (role === 'ngo') navigate('/ngo/dashboard', { replace: true });
      else navigate('/user/dashboard', { replace: true });
    }
  }, [session, currentUser, navigate]);

  // Citizen form - initialized directly from searchParams if redirected from registration
  const userName = searchParams.get('name') || '';
  const [userPhone, setUserPhone] = useState(() => searchParams.get('phone') || '');
  const [userPassword, setUserPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // NGO form
  const [ngoName, setNgoName] = useState('Red Cross Disaster Relief Corps');
  const [ngoOfficer, setNgoOfficer] = useState('');

  // Keep me signed in toggle
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotModalRole, setForgotModalRole] = useState('citizen');

  // Immediate Public SOS state (no login required)
  const [isPublicSOSOpen, setIsPublicSOSOpen] = useState(false);

  // Authority form - specialized by emergency agency
  const [selectedAgencyId, setSelectedAgencyId] = useState('police');
  const [authDept, setAuthDept] = useState('State Police & Rapid Action Force (RAF)');
  const [badgeId, setBadgeId] = useState('POLICE-100');
  const [securityPin, setSecurityPin] = useState('police123');

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

      // 4. Register mobile device token quietly in background
      try {
        await registerActiveDeviceSession({
          id: citizen.id,
          phone: citizen.phone,
          name: citizen.name,
          bloodGroup: citizen.blood_group,
          role: 'CITIZEN',
          latitude: citizen.latitude,
          longitude: citizen.longitude,
        });
      } catch (devErr) {
        toast.error('Device registration issue: ' + (devErr.message || 'Push alerts limited'));
      }

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
          phone: String(citizen.ice_phone || citizen.phone || '9876543210').replace(/\D/g, '').slice(-10),
        },
        location: {
          lat: citizen.latitude,
          lng: citizen.longitude,
          address: citizen.address,
        },
      });

      toast.success(`Welcome, ${citizen.name}!`);
      navigate('/user/dashboard', { replace: true });
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
    navigate('/ngo/dashboard', { replace: true });
  };

  const handleSelectAgency = (agency) => {
    setSelectedAgencyId(agency.id);
    setAuthDept(agency.name);
    setBadgeId(agency.badge);
    setSecurityPin(agency.pin);
  };

  const handleAuthoritySubmit = (e) => {
    e.preventDefault();
    if (!badgeId.trim()) {
      toast.error('Please enter Badge ID.');
      return;
    }
    const currentAgency = AUTHORITY_AGENCIES.find((a) => a.id === selectedAgencyId) || AUTHORITY_AGENCIES[0];

    loginAsAuthority({
      department: currentAgency.name,
      badgeId: badgeId.toUpperCase(),
      name: currentAgency.officer,
      rank: currentAgency.rank,
      agencyType: currentAgency.id,
      hotline: currentAgency.hotline,
      icon: currentAgency.icon,
    });
    toast.success(`Logged in as ${currentAgency.shortName} (${badgeId.toUpperCase()})`);
    navigate('/authority/dashboard', { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] flex flex-col justify-center items-center px-4 py-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top App Header */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <LanguageSwitcher variant="dark" />
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-black/40 border border-white/20 p-2">
            <img src="/logo.png" alt="CrisisConnect Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Crisis<span className="text-red-500">Connect</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {t('tagline')}
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Disaster Database Online
            </span>
          </div>
        </div>

        {/* EMERGENCY PUBLIC SOS (NO LOGIN REQUIRED) */}
        <div className="p-3 bg-red-950/10 border-b-2 border-red-500/20 text-center">
          <button
            type="button"
            onClick={() => setIsPublicSOSOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 animate-pulse active:scale-98 transition-all cursor-pointer border border-red-500"
          >
            <AlertOctagon className="w-4 h-4 text-white animate-bounce" />
            <span>{t('public_sos_banner_title')}</span>
          </button>
          <p className="text-[10px] text-red-600 font-bold mt-1.5 flex items-center justify-center gap-1">
            <span>{t('public_sos_banner_subtitle')}</span>
          </p>
        </div>

        {/* 3-Role Gateway Segmented Control */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
            {t('select_role_prompt')}
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
              <span>{t('role_citizen')}</span>
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
              <span>{t('role_ngo')}</span>
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
              <span>{t('role_authority')}</span>
            </button>
          </div>
        </div>

        {/* Tab Forms Body */}
        <div className="p-6">
          {/* TAB 1: CITIZEN */}
          {activeTab === 'citizen' && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-base font-bold text-slate-900">{t('citizen_login_title')}</h2>
                <p className="text-xs text-slate-500">
                  {t('citizen_login_subtitle')}
                </p>
              </div>

              {/* REGISTER FIRST CTA BANNER */}
              <div className="p-3.5 bg-red-50/90 rounded-2xl border-2 border-dashed border-red-300 text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-red-700 font-bold text-xs">
                  <Database className="w-4 h-4 text-red-600" />
                  <span>{t('new_citizen_prompt')}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {t('new_citizen_desc')}
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('btn_register_first')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <form onSubmit={handleCitizenSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('mobile_phone_label')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={t('mobile_phone_placeholder')}
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
                      placeholder={t('password_placeholder')}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Keep me signed in & Forgot Password */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                    />
                    <span>{t('keep_signed_in')}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotModalRole('citizen');
                      setIsForgotModalOpen(true);
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                  >
                    {t('forgot_password')}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer mt-1 flex items-center justify-center gap-2"
                >
                  {isVerifying ? t('verifying_login') : t('btn_login')}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: NGO / RELIEF ORGANIZATION */}
          {activeTab === 'ngo' && (
            <div className="space-y-4">
              <div className="text-center mb-3">
                <h2 className="text-base font-bold text-slate-900">{t('ngo_login_title')}</h2>
                <p className="text-xs text-slate-500">
                  {t('ngo_login_subtitle')}
                </p>
              </div>

              <form onSubmit={handleNGOSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('ngo_org_label')}
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
                    {t('ngo_officer_label')}
                  </label>
                  <input
                    type="text"
                    value={ngoOfficer}
                    onChange={(e) => setNgoOfficer(e.target.value)}
                    placeholder="e.g. Capt. Tariq Khan"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Keep me signed in & Forgot Access */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span>{t('keep_signed_in')}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotModalRole('ngo');
                      setIsForgotModalOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Forgot Access?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer mt-1"
                >
                  {t('ngo_login_btn')}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: DISASTER AUTHORITY */}
          {activeTab === 'authority' && (
            <div className="space-y-4">
              <div className="text-center mb-3">
                <h2 className="text-base font-bold text-slate-900">{t('authority_login_title')}</h2>
                <p className="text-xs text-slate-500">
                  {t('authority_login_subtitle')}
                </p>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-tight">
                🔒 <strong>Official Role Notice:</strong> Authorities manage and verify relief responses. Emergency posting is restricted to citizens.
              </div>

              {/* Department / Agency Dropdown Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Emergency Response Authority
                </label>
                <div className="relative">
                  <select
                    value={selectedAgencyId}
                    onChange={(e) => {
                      const agency = AUTHORITY_AGENCIES.find((a) => a.id === e.target.value);
                      if (agency) handleSelectAgency(agency);
                    }}
                    className="w-full text-xs font-bold px-3.5 py-3 rounded-2xl border-2 border-blue-500/30 bg-blue-50/50 hover:bg-blue-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-9 shadow-2xs"
                  >
                    {AUTHORITY_AGENCIES.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.icon} {agency.name} ({agency.badge})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                    ▼
                  </div>
                </div>

                {/* Selected Authority Live Preview Card */}
                {(() => {
                  const currentAgency =
                    AUTHORITY_AGENCIES.find((a) => a.id === selectedAgencyId) || AUTHORITY_AGENCIES[0];
                  return (
                    <div className="p-3 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-slate-50 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl shrink-0">{currentAgency.icon}</span>
                          <div>
                            <p className="text-xs font-black text-slate-900 leading-tight">
                              {currentAgency.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Lead: <strong className="text-slate-700">{currentAgency.officer}</strong> • {currentAgency.rank}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-slate-900 text-white shrink-0">
                          {currentAgency.badge}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-blue-100 pt-1.5 text-[10px] text-slate-600">
                        <span className="line-clamp-1">{currentAgency.desc}</span>
                        <span className="font-bold text-blue-700 shrink-0 ml-2">
                          Hotline: {currentAgency.hotline}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <form onSubmit={handleAuthoritySubmit} className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('auth_badge_label')}
                    </label>
                    <div className="relative">
                      <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={badgeId}
                        onChange={(e) => setBadgeId(e.target.value)}
                        placeholder="e.g. POLICE-100"
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('auth_pin_label')}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={securityPin}
                        onChange={(e) => setSecurityPin(e.target.value)}
                        placeholder="••••"
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Keep me signed in & Forgot Security PIN */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>{t('keep_signed_in')}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotModalRole('authority');
                      setIsForgotModalOpen(true);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Forgot Security PIN?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer mt-1 flex items-center justify-center gap-1.5"
                >
                  <span>Launch {AUTHORITY_AGENCIES.find((a) => a.id === selectedAgencyId)?.shortName || 'Operations Center'}</span>
                  <ArrowRight className="w-4 h-4" />
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
            <PhoneCall className="w-3.5 h-3.5" /> {t('toll_free_hotline')}
          </a>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <ForgotPasswordModal
          role={forgotModalRole}
          initialPhone={userPhone}
          onClose={() => setIsForgotModalOpen(false)}
          onPasswordResetSuccess={(phone, newPass) => {
            setUserPhone(phone);
            setUserPassword(newPass);
            setIsForgotModalOpen(false);
          }}
        />
      )}

      {/* Immediate Public Emergency SOS Modal (No Login Required) */}
      {isPublicSOSOpen && (
        <PublicEmergencySOSModal
          onClose={() => setIsPublicSOSOpen(false)}
        />
      )}
    </div>
  );
}
