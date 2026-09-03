import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  MapPin,
  Navigation,
  CheckCircle,
  Camera,
  User,
  Phone,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Bot,
  Plus,
  Minus,
  Sparkles,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import { useAuth } from '../context/AuthContext';
import { analyzeEmergency } from '../services/mockEmergencyAnalysis';
import AIAnalysisLoader from '../components/AIAnalysisLoader';
import toast from 'react-hot-toast';

export default function ReportEmergency() {
  const navigate = useNavigate();
  const { addRequest } = useCrisis();
  const { currentUser } = useAuth();

  // Core Emergency State
  const [description, setDescription] = useState('');
  
  // Location State
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState(13.0827);
  const [lng, setLng] = useState(80.2707);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'detecting' | 'detected' | 'failed' | 'manual'

  // Photo State
  const [photoPreview, setPhotoPreview] = useState(null);

  // Contact State
  const [contactName, setContactName] = useState(currentUser?.name || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');

  // Secondary Collapsible Section State
  const [showAdditional, setShowAdditional] = useState(false);
  const [peopleCount, setPeopleCount] = useState(1);
  const [selectedAssistance, setSelectedAssistance] = useState([]);
  const [additionalHazards, setAdditionalHazards] = useState('');

  // AI Loading Screen Trigger State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPayload, setAnalysisPayload] = useState(null);

  const specialAssistanceOptions = [
    'Seniors / Elderly',
    'Children',
    'Person with disability',
    'Pregnant person',
    'Pets / Animals',
  ];

  const toggleAssistance = (item) => {
    setSelectedAssistance((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Browser Geolocation Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('failed');
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('detecting');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        setLocationStatus('detected');
        if (!locationName) {
          setLocationName(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        toast.success('Location detected via GPS!');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationStatus('failed');
        toast.error('Could not detect location. Please enter address manually.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Photo Upload Mock
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please describe what happened in the emergency.');
      return;
    }

    if (!locationName.trim() && locationStatus !== 'detected') {
      toast.error('Please provide the emergency location.');
      return;
    }

    // 1. Run isolated AI emergency intelligence analysis
    const aiResult = analyzeEmergency(description, {
      peopleCount,
      vulnerabilities: selectedAssistance,
      additionalHazards,
    });

    // 2. Add to CrisisContext persistent state
    const createdReq = addRequest({
      title: description.length > 55 ? `${description.slice(0, 52)}...` : description,
      category: aiResult.category,
      urgency: aiResult.severity === 'Critical' ? 'critical' : aiResult.severity === 'High' ? 'high' : 'medium',
      description,
      locationName: locationName || `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
      peopleCount,
      vulnerabilities: selectedAssistance,
      contactName: contactName || 'Citizen Reporter',
      contactPhone: contactPhone || '+1-555-0100',
    });

    // Keep payload ready for result page
    setAnalysisPayload({
      aiResult,
      createdReq,
      description,
      locationName: locationName || `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      photoPreview,
      contactName,
      contactPhone,
      peopleCount,
      selectedAssistance,
      additionalHazards,
    });

    // 3. Show AI processing screen
    setIsAnalyzing(true);
  };

  const handleAIAnalysisComplete = () => {
    setIsAnalyzing(false);
    navigate('/emergency-result', {
      state: analysisPayload,
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5 pb-24 animate-fade-in">
      {/* Top Back bar & Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/user/dashboard"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-red-600 text-white flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">CrisisConnect</h1>
          </div>
          <p className="text-[11px] text-slate-500">
            Report an emergency quickly. Our AI will analyze the situation and route it appropriately.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1 — WHAT HAPPENED? (MOST PROMINENT) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-black text-slate-900">
              What happened? <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Bot className="w-3 h-3" /> AI Analyzed
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Describe the emergency in your own words. Include anything that may help responders.
          </p>

          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: There is a fire in an apartment building. Two people are trapped inside on the second floor."
            className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-slate-900 leading-relaxed resize-none"
            required
          />

          <p className="text-[10px] text-slate-400 italic">
            💡 Tell us what happened. You don't need to pick categories or priorities — our AI will determine them.
          </p>
        </div>

        {/* SECTION 2 — LOCATION (CRITICAL NEAR TOP) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-black text-slate-900">
              Where is the emergency? <span className="text-red-500">*</span>
            </label>

            {/* Location Status Badge */}
            {locationStatus === 'detecting' && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Navigation className="w-3 h-3 animate-spin" /> Detecting...
              </span>
            )}
            {locationStatus === 'detected' && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Location detected
              </span>
            )}
            {locationStatus === 'failed' && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> GPS Failed (Enter manually)
              </span>
            )}
            {locationStatus === 'manual' && (
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Manual Address
              </span>
            )}
          </div>

          {/* Quick GPS button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            className="w-full py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Navigation className={`w-4 h-4 text-emerald-600 ${locationStatus === 'detecting' ? 'animate-spin' : ''}`} />
            <span>📍 Use My Current Location</span>
          </button>

          {/* Coordinates or Formatted Location pill if detected */}
          {locationStatus === 'detected' && (
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 flex items-center justify-between">
              <span className="font-mono font-semibold">
                ✓ GPS Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase">Locked</span>
            </div>
          )}

          {/* Manual Address Fallback */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              {locationStatus === 'detected' ? 'Specific Landmark / Street Name' : 'Enter Address Manually:'}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={locationName}
                onChange={(e) => {
                  setLocationName(e.target.value);
                  if (locationStatus !== 'detected') setLocationStatus('manual');
                }}
                placeholder="e.g. 101 Howard St, Apt 2B or near City Hospital"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 3 — PHOTO / EVIDENCE (OPTIONAL) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Add a photo (Optional)</h3>
            <span className="text-[10px] text-slate-400 font-medium">Optional</span>
          </div>
          <p className="text-[11px] text-slate-500">
            A photo may help responders understand the situation and deploy appropriate equipment.
          </p>

          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-48 bg-slate-100">
              <img src={photoPreview} alt="Incident preview" className="w-full h-44 object-cover" />
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-black"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors">
              <Camera className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-bold text-slate-700">Take Photo or Upload Image</span>
              <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG supported</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* SECTION 4 — CONTACT INFORMATION */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Your Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Alex Taylor"
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Callback Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1-555-0199"
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5 — ADDITIONAL INFORMATION (COLLAPSED BY DEFAULT) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdditional(!showAdditional)}
            className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div>
              <p className="text-xs font-bold text-slate-900">Additional details (Optional)</p>
              <p className="text-[10px] text-slate-500">People count, special assistance, hazards</p>
            </div>
            {showAdditional ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showAdditional && (
            <div className="p-4 pt-0 space-y-4 border-t border-slate-100 animate-fade-in text-xs">
              {/* People Count Stepper */}
              <div className="flex items-center justify-between pt-3">
                <span className="font-semibold text-slate-700">People needing help:</span>
                <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                    className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-sm w-5 text-center text-slate-900">{peopleCount}</span>
                  <button
                    type="button"
                    onClick={() => setPeopleCount(peopleCount + 1)}
                    className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Special Assistance Chips */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Special assistance required:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {specialAssistanceOptions.map((opt) => {
                    const isChecked = selectedAssistance.includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => toggleAssistance(opt)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-red-50 text-red-700 border border-red-300 shadow-2xs font-bold'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '} {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Hazards */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Additional hazards:
                </label>
                <input
                  type="text"
                  value={additionalHazards}
                  onChange={(e) => setAdditionalHazards(e.target.value)}
                  placeholder="e.g. Gas leak, Blocked road, Collapsed roof, Fallen live wire"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm shadow-xl shadow-red-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Bot className="w-5 h-5 text-white" />
            <span>ANALYZE EMERGENCY</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </button>

          <p className="text-[11px] text-slate-500 text-center leading-tight">
            CrisisConnect AI will analyze the emergency and identify the appropriate response.
          </p>
        </div>
      </form>

      {/* AI Processing Screen / Modal */}
      {isAnalyzing && (
        <AIAnalysisLoader onComplete={handleAIAnalysisComplete} />
      )}
    </div>
  );
}
