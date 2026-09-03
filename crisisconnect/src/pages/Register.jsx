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
import { registerCitizenInSupabase } from '../services/supabase';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();

  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('26');
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

    if (!phone.trim()) {
      toast.error('Please enter a mobile phone number for emergency contact.');
      return;
    }

    setIsSubmitting(true);

    // 1. Save citizen into local/offline Database
    const res = citizenDB.register({
      name,
      phone,
      email,
      address,
      bloodGroup,
      allergies,
      emergencyContactName: iceName,
      emergencyContactPhone: icePhone,
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

      // 3. Persist to Supabase Database
      await registerCitizenInSupabase({
        name,
        phone,
        password,
        age: Number(age) || 25,
        bloodGroup,
        email,
        address,
        emergencyContactName: iceName,
        emergencyContactPhone: icePhone,
        lat: 19.0760,
        lng: 72.8777,
      }).catch(() => {});
    } catch {
      // Offline fallback
    }

    toast.success(
      res.isUpdate
        ? 'Citizen profile updated in Database! Redirecting to Login...'
        : 'Registered successfully in Disaster Database! Redirecting to Login...',
      { duration: 3000 }
    );

    // Redirect to login after 1.2s with prefilled phone
    setTimeout(() => {
      navigate(`/login?phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}`);
    }, 1200);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 animate-fade-in">
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
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-500/30">
              <ShieldAlert className="w-6 h-6" />
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
                  placeholder="e.g. Sharvari Chavan"
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
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1-555-0199"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Used as your login identifier and for SMS rescue dispatch</p>
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
                  placeholder="e.g. name@example.com"
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
                  placeholder="26"
                  min="1"
                  max="120"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (For Login)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ICE Phone
                </label>
                <input
                  type="tel"
                  value={icePhone}
                  onChange={(e) => setIcePhone(e.target.value)}
                  placeholder="+1-555-0188"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
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
