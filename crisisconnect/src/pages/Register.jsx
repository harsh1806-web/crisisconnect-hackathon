import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { citizenDB } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { getOrCreateDeviceToken, registerDeviceToken } from '../services/notificationService';
import { registerCitizenInSupabase, supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();

  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [iceName, setIceName] = useState('');
  const [icePhone, setIcePhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Mobile phone number must be exactly 10 digits (no more, no less).');
      return;
    }

    const cleanIcePhone = icePhone.replace(/\D/g, '');
    if (cleanIcePhone.length !== 10) {
      toast.error('ICE emergency phone number must be exactly 10 digits (no more, no less).');
      return;
    }

    if (!password || !password.trim()) {
      toast.error('Password is required. Please set a password for your account.');
      return;
    }

    setIsSubmitting(true);

    // Guard: Prevent duplicate phone number registration
    try {
      if (supabase) {
        const { data: existingSupabase } = await supabase
          .from('citizens')
          .select('id, name, phone')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (existingSupabase) {
          toast.error(
            `Mobile number ${cleanPhone} is ALREADY registered under "${existingSupabase.name}". Phone numbers cannot be repeated!`,
            { duration: 5000 }
          );
          setIsSubmitting(false);
          setTimeout(() => {
            navigate(`/login?phone=${encodeURIComponent(cleanPhone)}`);
          }, 1500);
          return;
        }
      }
    } catch (e) {
      console.warn('Supabase duplicate check warning:', e);
    }

    // Also check local database
    const existingLocal = citizenDB.findByPhone(cleanPhone);
    if (existingLocal) {
      toast.error(
        `Mobile number ${cleanPhone} is ALREADY registered under "${existingLocal.name}". Phone numbers cannot be repeated!`,
        { duration: 5000 }
      );
      setIsSubmitting(false);
      setTimeout(() => {
        navigate(`/login?phone=${encodeURIComponent(cleanPhone)}`);
      }, 1500);
      return;
    }

    // 1. Save citizen into local/offline Database
    citizenDB.register({
      name,
      phone: cleanPhone,
      email,
      address,
      bloodGroup,
      allergies,
      emergencyContactName: iceName || 'Emergency Contact',
      emergencyContactPhone: cleanIcePhone,
    });

    // 2. Persist to Firestore & Register Device Token
    try {
      const devToken = getOrCreateDeviceToken();
      await registerDeviceToken(devToken, {
        name,
        mobileNo: phone,
        age: Number(age) || 25,
        bloodGroup,
        email: email || `${phone.replace(/[^0-9]/g, '')}@crisisconnect.app`,
        role: 'VICTIM',
        location: { address, lat: 19.0760, lng: 72.8777 },
      });

      if (password && email && typeof signup === 'function') {
        await signup(email, password, {
          name,
          mobileNo: phone,
          age: Number(age) || 25,
          bloodGroup,
          location: { address, lat: 19.0760, lng: 72.8777 },
        }).catch(() => {});
      }

      // 3. Persist directly to Supabase Database
      await registerCitizenInSupabase({
        name,
        phone: cleanPhone,
        password,
        age: Number(age) || 25,
        bloodGroup,
        email,
        address,
        emergencyContactName: iceName || 'Emergency Contact',
        emergencyContactPhone: cleanIcePhone,
        lat: 19.0760,
        lng: 72.8777,
      });

      toast.success('Citizen profile saved to Supabase Database! Redirecting to Login...', {
        duration: 3000,
      });
    } catch (err) {
      toast.error('Registration failed: ' + (err.message || 'Database error'));
      setIsSubmitting(false);
      return;
    }

    // Redirect to login after 1.2s with prefilled phone
    setTimeout(() => {
      navigate(`/login?phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}`);
    }, 1200);
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] flex flex-col justify-center items-center px-4 py-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white p-6 relative overflow-hidden">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center p-1.5 shadow-md shadow-black/30">
              <img src="/logo.png" alt="CrisisConnect Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Citizen Registration</h1>
              <p className="text-xs text-slate-300">
                Create emergency profile & save to Disaster Relief Database
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Personal Info */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Personal & Contact Info
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number (e.g. 9850422491)"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 tracking-wide"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Used as your 10-digit login identifier and for rescue dispatch</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 25"
                  min="1"
                  max="120"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (For Login) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Sector / Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 302, Riverview Enclave, Sector 4"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Medical & ICE Info */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Emergency Medical & ICE Contact
            </h2>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                >
                  <option>O+</option>
                  <option>O-</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Allergies / Chronic
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Asthma, Penicillin"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ICE Contact Name
                </label>
                <input
                  type="text"
                  value={iceName}
                  onChange={(e) => setIceName(e.target.value)}
                  placeholder="e.g. Rahul (Brother)"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    ICE Phone <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${
                    icePhone.length === 10 ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {icePhone.length}/10 digits
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={icePhone}
                  onChange={(e) => setIcePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit emergency number"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-xs rounded-2xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all mt-3"
          >
            {isSubmitting ? (
              <span>Saving to Disaster Database...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>SAVE TO DATABASE & CONTINUE TO LOGIN</span>
              </>
            )}
          </button>

          {/* Already have an account */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Already registered in the database?{' '}
              <Link to="/login" className="font-bold text-red-600 hover:underline">
                Log In Directly
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
