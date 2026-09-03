import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  Activity,
  Droplets,
  Home,
  Zap,
  HelpCircle,
  MapPin,
  Navigation,
  CheckCircle,
  AlertOctagon,
  Send,
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CreateRequest() {
  const navigate = useNavigate();
  const { addRequest } = useCrisis();
  const { currentUser } = useAuth();

  const [category, setCategory] = useState('Rescue');
  const [urgency, setUrgency] = useState('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState(() => (typeof window !== 'undefined' && window.__NATIVE_GPS__?.lat) || 19.0760);
  const [lng, setLng] = useState(() => (typeof window !== 'undefined' && window.__NATIVE_GPS__?.lng) || 72.8777);
  const [locating, setLocating] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [peopleCount, setPeopleCount] = useState(1);
  const [contactName, setContactName] = useState(currentUser?.name || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [vulnerabilities, setVulnerabilities] = useState([]);

  const categoryOptions = [
    { name: 'Rescue', icon: LifeBuoy, desc: 'Flooded, trapped, boat/evacuation needed' },
    { name: 'Medical', icon: Activity, desc: 'Injuries, medicines, oxygen, insulin' },
    { name: 'Food & Water', icon: Droplets, desc: 'Drinking water, rations, baby formula' },
    { name: 'Shelter', icon: Home, desc: 'Roof damage, dry space, blankets' },
    { name: 'Power & Comms', icon: Zap, desc: 'Generators, battery bank, comms relay' },
    { name: 'General', icon: HelpCircle, desc: 'Other emergency assistance' },
  ];

  const vulnerabilityOptions = [
    'Infants / Children',
    'Elderly (65+)',
    'Mobility Impaired',
    'Chronic Medical Condition',
    'Pregnant',
    'Trapped on Upper Floor',
    'Pets / Animals',
  ];

  const toggleVulnerability = (item) => {
    if (vulnerabilities.includes(item)) {
      setVulnerabilities(vulnerabilities.filter((v) => v !== item));
    } else {
      setVulnerabilities([...vulnerabilities, item]);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsLocked(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGpsLocked(true);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setGpsLocked(true);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Automatically lock device GPS on mount
  useEffect(() => {
    handleDetectLocation();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter an incident summary title.');
      return;
    }

    // Address is NOT compulsory because live GPS location is automatically captured
    const resolvedLocation = locationName.trim() || `Device GPS: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;

    const newReq = addRequest({
      title,
      category,
      urgency,
      description,
      locationName: resolvedLocation,
      lat,
      lng,
      peopleCount: Number(peopleCount) || 1,
      vulnerabilities,
      contactName: contactName || 'Anonymous Citizen',
      contactPhone: contactPhone || '+91 112',
    });

    toast.success('Emergency request generated with GPS geotag!');
    navigate(`/requests/${newReq.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12 animate-fade-in">
      <div className="text-center space-y-1">
        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 text-xs font-black uppercase px-3 py-1 rounded-full border border-red-200">
          <AlertOctagon className="w-3.5 h-3.5" /> Emergency Aid Request Form
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Request Disaster Relief or Rescue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Your request will immediately alert verified volunteers and emergency operations personnel.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selector */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <label className="block text-sm font-bold text-slate-900">
            1. Select Primary Aid Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categoryOptions.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.name;
              return (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-red-500 bg-red-50/50 ring-2 ring-red-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-1.5 ${
                      isSelected ? 'text-red-600' : 'text-slate-500'
                    }`}
                  />
                  <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{cat.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Urgency Level */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <label className="block text-sm font-bold text-slate-900">
            2. Urgency Level <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { level: 'critical', label: 'CRITICAL', sub: 'Life threat / Trapped', color: 'red' },
              { level: 'high', label: 'HIGH', sub: 'Needed within 1-3 hrs', color: 'amber' },
              { level: 'medium', label: 'MEDIUM', sub: 'Needed today', color: 'blue' },
              { level: 'low', label: 'LOW', sub: 'Supplies / Non-urgent', color: 'slate' },
            ].map((u) => (
              <button
                type="button"
                key={u.level}
                onClick={() => setUrgency(u.level)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  urgency === u.level
                    ? 'border-red-600 bg-red-600 text-white shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <p className="text-xs font-black tracking-wider uppercase">{u.label}</p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    urgency === u.level ? 'text-red-100' : 'text-slate-400'
                  }`}
                >
                  {u.sub}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Incident Summary & Description */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <label className="block text-sm font-bold text-slate-900">
            3. Situation & Description <span className="text-red-500">*</span>
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Title / Incident Headline
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 3 people stranded on roof, water 4ft deep"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Description & Immediate Hazards
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe exact situation, landmarks, medical conditions, items needed..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* People Count & Vulnerabilities */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Number of People Needing Help
            </label>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="number"
                min="1"
                max="500"
                value={peopleCount}
                onChange={(e) => setPeopleCount(e.target.value)}
                className="w-24 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <span className="text-xs text-slate-500">person / people</span>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Vulnerabilities Present (Select all that apply):
            </label>
            <div className="flex flex-wrap gap-2">
              {vulnerabilityOptions.map((v) => {
                const checked = vulnerabilities.includes(v);
                return (
                  <button
                    type="button"
                    key={v}
                    onClick={() => toggleVulnerability(v)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      checked
                        ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {checked ? '✓ ' : '+ '} {v}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Location & GPS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-900">
              4. Location & Geotag <span className="text-xs font-semibold text-emerald-600">(GPS auto-captured)</span>
            </label>
            <button
              type="button"
              onClick={handleDetectLocation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Locating...' : 'Refresh GPS'}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Address / Landmark <span className="text-[11px] font-normal text-slate-500">(Optional — Device GPS is already attached)</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder={`Optional: e.g. 2nd floor, near gate (Defaults to GPS [${lat.toFixed(4)}, ${lng.toFixed(4)}])`}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {gpsLocked && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
              <span className="font-semibold flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> GPS Geotag Locked: {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                Attached to Request ✓
              </span>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <label className="block text-sm font-bold text-slate-900">
            5. Contact Person for Responders
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Callback Phone Number
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. +1-555-0199"
                className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-base shadow-xl shadow-red-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Send className="w-5 h-5" />
            <span>TRANSMIT EMERGENCY REQUEST</span>
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            By submitting, you consent to sharing location coordinates with emergency rescue personnel.
          </p>
        </div>
      </form>
    </div>
  );
}
