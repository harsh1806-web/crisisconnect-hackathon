import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  LifeBuoy,
  Activity,
  Droplets,
  Home,
  Zap,
  HelpCircle,
  MapPin,
  Navigation,
  CheckCircle,
  Send,
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function UserCreateRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addRequest } = useCrisis();
  const { currentUser } = useAuth();

  const [category, setCategory] = useState(() => searchParams.get('category') || 'Rescue');
  const [urgency, setUrgency] = useState('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState(13.0827);
  const [lng, setLng] = useState(80.2707);
  const [locating, setLocating] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [peopleCount, setPeopleCount] = useState(1);
  const [contactName, setContactName] = useState(currentUser?.name || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [vulnerabilities, setVulnerabilities] = useState([]);

  const categoryOptions = [
    { name: 'Rescue', icon: LifeBuoy, desc: 'Trapped, rising water, evacuation' },
    { name: 'Medical', icon: Activity, desc: 'Injury, oxygen, medications' },
    { name: 'Food & Water', icon: Droplets, desc: 'Drinking water, dry rations' },
    { name: 'Shelter', icon: Home, desc: 'Roof collapse, dry blankets' },
    { name: 'Power & Comms', icon: Zap, desc: 'Phone charge, backup power' },
    { name: 'General', icon: HelpCircle, desc: 'Other emergency support' },
  ];

  const vulnerabilityOptions = [
    'Infants / Children',
    'Elderly (65+)',
    'Mobility Impaired',
    'Chronic Medical Condition',
    'Pregnant',
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
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGpsLocked(true);
        setLocating(false);
        if (!locationName) {
          setLocationName(`GPS: [${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}]`);
        }
        toast.success('Live GPS coordinates locked!');
      },
      () => {
        setLocating(false);
        setLat(13.0827);
        setLng(80.2707);
        setGpsLocked(true);
        toast('Default disaster sector coordinates assigned.');
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a brief title for the emergency.');
      return;
    }

    if (!locationName.trim()) {
      toast.error('Please specify your address or use GPS detection.');
      return;
    }

    const newReq = addRequest({
      title,
      category,
      urgency,
      description,
      locationName,
      lat,
      lng,
      peopleCount: Number(peopleCount) || 1,
      vulnerabilities,
      contactName: contactName || 'Citizen User',
      contactPhone: contactPhone || '+1-555-0100',
    });

    // Directly advances to Step 3 in user flow: Request Submitted Screen
    navigate(`/user/submitted/${newReq.id}`);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24 animate-fade-in">
      {/* Top Back bar */}
      <div className="flex items-center gap-2">
        <Link
          to="/user/dashboard"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-base font-black text-slate-900 leading-tight">
            Create Emergency Request
          </h1>
          <p className="text-[11px] text-slate-500">Step 2: Submit details for authority response</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
          <label className="block text-xs font-bold text-slate-900">
            1. Select Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categoryOptions.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.name;
              return (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-red-500 bg-red-50/60 ring-1 ring-red-300'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-red-600' : 'text-slate-500'}`} />
                  <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                  <p className="text-[9px] text-slate-500 line-clamp-1">{cat.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Urgency Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
          <label className="block text-xs font-bold text-slate-900">
            2. Urgency Level <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { level: 'critical', label: 'CRITICAL', color: 'bg-red-600' },
              { level: 'high', label: 'HIGH', color: 'bg-amber-600' },
              { level: 'medium', label: 'MEDIUM', color: 'bg-blue-600' },
              { level: 'low', label: 'LOW', color: 'bg-slate-600' },
            ].map((u) => (
              <button
                type="button"
                key={u.level}
                onClick={() => setUrgency(u.level)}
                className={`py-2 rounded-xl text-[10px] font-black tracking-wider transition-all cursor-pointer ${
                  urgency === u.level
                    ? `${u.color} text-white shadow-xs`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Title & Situation Description */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-900">
            3. Situation Overview <span className="text-red-500">*</span>
          </label>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Short Incident Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 4 people trapped on roof, water 4ft deep"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Details & Hazards (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact floor, landmark, medical condition, or obstacles..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Caller Name"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Callback Phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1-555-0199"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              People Needing Aid
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={peopleCount}
              onChange={(e) => setPeopleCount(e.target.value)}
              className="w-28 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Vulnerabilities */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              Special Vulnerabilities:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {vulnerabilityOptions.map((v) => {
                const checked = vulnerabilities.includes(v);
                return (
                  <button
                    type="button"
                    key={v}
                    onClick={() => toggleVulnerability(v)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                      checked
                        ? 'bg-red-50 border-red-300 text-red-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
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
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900">
              4. Location & Address <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleDetectLocation}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold transition-colors cursor-pointer"
            >
              <Navigation className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Locating...' : 'Auto-Detect GPS'}</span>
            </button>
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. 14 River Road, Near St. Peter Church"
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {gpsLocked && (
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-[10px] text-emerald-800">
              <span className="font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> GPS Tagged: {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
              <span className="text-emerald-600">Accurate</span>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          <Send className="w-4 h-4" />
          <span>SUBMIT EMERGENCY REQUEST</span>
        </button>
      </form>
    </div>
  );
}
