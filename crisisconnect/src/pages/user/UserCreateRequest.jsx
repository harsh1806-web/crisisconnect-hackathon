import { useState, useEffect, useMemo } from 'react';
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
  Wind,
  Truck,
  Pill,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';
import { useAuth } from '../../context/AuthContext';
import { checkForPotentialDuplicates } from '../../services/requestService';
import { classifyDisaster } from '../../services/aiDisasterClassifier';
import toast from 'react-hot-toast';

export default function UserCreateRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addRequest, requests } = useCrisis();
  const { currentUser } = useAuth();

  const [category, setCategory] = useState(() => searchParams.get('category') || 'Rescue');
  const [urgency, setUrgency] = useState('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState(() => currentUser?.location?.lat || 19.0760);
  const [lng, setLng] = useState(() => currentUser?.location?.lng || 72.8777);
  const [locating, setLocating] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [peopleCount, setPeopleCount] = useState(1);
  const [contactName, setContactName] = useState(currentUser?.name || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  // Auto-acquire phone GPS coordinates on mobile load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setGpsLocked(true);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Real-time AI Disaster Classification preview
  const aiPreview = useMemo(() => {
    if (!title.trim() && !description.trim()) return null;
    return classifyDisaster({
      title,
      description,
      category,
      urgency,
      peopleCount,
    });
  }, [title, description, category, urgency, peopleCount]);

  const categoryOptions = [
    { name: 'Rescue', icon: LifeBuoy, desc: 'Trapped, rising water, evacuation' },
    { name: 'Medical', icon: Activity, desc: 'Critical injury, triage, doctors' },
    { name: 'Blood', icon: Droplets, desc: 'Urgent blood units / donor matching' },
    { name: 'Oxygen', icon: Wind, desc: 'Oxygen cylinders & concentrators' },
    { name: 'Medicines', icon: Pill, desc: 'Prescription drugs, insulin, first aid' },
    { name: 'Food & Water', icon: Droplets, desc: 'Drinking water & emergency rations' },
    { name: 'Shelter', icon: Home, desc: 'Evacuation shelter, blankets' },
    { name: 'Transportation', icon: Truck, desc: 'Rescue boat, ambulance, transport' },
    { name: 'Power & Comms', icon: Zap, desc: 'Satellite comms, backup generator' },
    { name: 'General', icon: HelpCircle, desc: 'Other emergency assistance' },
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

  const handleSubmit = async (e, bypassDuplicate = false) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a brief title for the emergency.');
      return;
    }

    const effectiveLocation = locationName.trim() || `GPS: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;

    // Check for potential duplicates within 500m radius
    if (!bypassDuplicate) {
      setIsCheckingDuplicates(true);
      try {
        const duplicates = await checkForPotentialDuplicates(lat, lng, category, 0.5, requests);
        if (duplicates && duplicates.length > 0) {
          setDuplicateWarning(duplicates[0]);
          setIsCheckingDuplicates(false);
          return;
        }
      } catch (err) {
        console.warn('Duplicate check skipped:', err);
      } finally {
        setIsCheckingDuplicates(false);
      }
    }

    setDuplicateWarning(null);

    const newReq = addRequest({
      title,
      category,
      urgency,
      description,
      locationName: effectiveLocation,
      lat,
      lng,
      peopleCount: Number(peopleCount) || 1,
      vulnerabilities,
      contactName: currentUser?.name || contactName || 'Citizen User',
      contactPhone: contactPhone || currentUser?.phone || '',
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

          {/* AI Disaster Routing & Live Triage Preview Card (v2.0) */}
          {aiPreview && (
            <div className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-500/40 shadow-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{aiPreview.targetAuthority.icon}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                        AI LIVE TRIAGE ({aiPreview.confidence} MATCH)
                      </p>
                    </div>
                    <p className="text-xs font-bold text-white leading-tight">
                      Intimated to: {aiPreview.targetAuthority.name}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 block">
                    Hotline {aiPreview.targetAuthority.hotline}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">
                    SLA: ~{aiPreview.targetAuthority.slaMinutes} mins
                  </span>
                </div>
              </div>

              {/* Classification & Urgency Reasoning */}
              <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p>
                    <span className="text-slate-400 font-semibold">Classification:</span>{' '}
                    <strong className="text-white">{aiPreview.disasterType}</strong>
                  </p>
                  <div className="flex items-center gap-1">
                    {aiPreview.triageCode && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-400/40">
                        {aiPreview.triageCode.split(' ')[0]} {aiPreview.triageCode.split(' ')[2] || ''}
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        aiPreview.urgencyLevel === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {aiPreview.urgencyLevel}
                    </span>
                  </div>
                </div>

                {/* DSI Disaster Severity Meter */}
                {aiPreview.severityIndex !== undefined && (
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold">Disaster Severity Index (DSI)</span>
                      <span className={`font-mono font-black ${aiPreview.severityIndex >= 75 ? 'text-red-400' : 'text-amber-400'}`}>
                        {aiPreview.severityIndex} / 100
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          aiPreview.severityIndex >= 75 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-yellow-400 to-amber-500'
                        }`}
                        style={{ width: `${aiPreview.severityIndex}%` }}
                      />
                    </div>
                  </div>
                )}

                {aiPreview.urgencyReasoning && (
                  <p className="text-[10px] text-amber-200/90 font-medium bg-amber-950/40 border border-amber-500/20 p-2 rounded-xl">
                    ⚡ {aiPreview.urgencyReasoning}
                  </p>
                )}

                {/* Environmental Hazards */}
                {aiPreview.extractedEntities?.environmentalHazards && aiPreview.extractedEntities.environmentalHazards.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {aiPreview.extractedEntities.environmentalHazards.map((hz) => (
                      <span
                        key={hz}
                        className="text-[9px] font-black bg-red-950/80 text-red-300 border border-red-500/50 px-2 py-0.5 rounded-md"
                      >
                        {hz}
                      </span>
                    ))}
                  </div>
                )}

                {/* Extracted Vulnerabilities */}
                {aiPreview.extractedVulnerabilities && aiPreview.extractedVulnerabilities.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] text-slate-400">Extracted Vulnerabilities:</span>
                    {aiPreview.extractedVulnerabilities.map((v) => (
                      <span
                        key={v}
                        className="text-[9px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md"
                      >
                        ⚠️ {v}
                      </span>
                    ))}
                  </div>
                )}

                {/* Sized Rescue Logistics */}
                {aiPreview.targetAuthority.requiredEquipment && (
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 block mb-1">
                      🛠️ AI Allocated Rescue Gear:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {aiPreview.targetAuthority.requiredEquipment.slice(0, 3).map((eq) => (
                        <span
                          key={eq}
                          className="text-[9px] bg-slate-800/90 text-slate-200 px-2 py-0.5 rounded-lg border border-slate-700"
                        >
                          ✓ {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Survival Protocols */}
                {aiPreview.survivalProtocol && aiPreview.survivalProtocol.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      🛡️ AI Immediate Survival Protocol (While Awaiting Dispatch):
                    </span>
                    <ul className="space-y-0.5 pl-3 list-disc text-[10px] text-slate-300 leading-relaxed">
                      {aiPreview.survivalProtocol.slice(0, 3).map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

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
              4. Location & Landmark <span className="text-slate-400 font-normal">(Optional if GPS active)</span>
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
              placeholder="e.g. Near St. Peter Church (Optional — GPS will be used)"
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
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
          disabled={isCheckingDuplicates}
          className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-black text-sm shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          <Send className="w-4 h-4" />
          <span>{isCheckingDuplicates ? 'CHECKING PROXIMITY DUPLICATES...' : 'SUBMIT EMERGENCY REQUEST'}</span>
        </button>
      </form>

      {/* 500-Meter Duplicate Emergency Warning Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 border border-amber-300 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                500m Duplicate Prevention Alert
              </span>
              <h3 className="text-sm font-black text-slate-900">
                Active Incident Already Reported Nearby
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                An active emergency request for <strong>{duplicateWarning.category}</strong>{' '}
                <em>"{duplicateWarning.title || 'Emergency Assistance'}"</em> was already registered{' '}
                <strong className="text-amber-700">~{Math.round((duplicateWarning.distance || 0) * 1000)} meters</strong> away{' '}
                (Tracking Ref: <span className="font-mono font-bold text-slate-900">{duplicateWarning.trackingCode || duplicateWarning.id}</span>).
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                Disaster authorities and volunteer units are already prioritizing this sector. Are you adding info to this incident, or filing a separate emergency?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/requests/${duplicateWarning.id}`)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all text-center cursor-pointer"
              >
                View Incident
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(null, true)}
                className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs text-center cursor-pointer"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
