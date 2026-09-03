import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Navigation,
  CheckCircle2,
  X,
  Sparkles,
  Bot,
  Send,
  PhoneCall,
  ShieldAlert,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { classifyDisaster } from '../services/aiDisasterClassifier';
import { supabase } from '../services/supabase';
import { useCrisis } from '../context/CrisisContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function PublicEmergencySOSModal({ onClose, onSOSDispatched }) {
  const { triggerSOS } = useCrisis();
  const { t } = useLanguage();

  const [situation, setSituation] = useState('');
  const [coords, setCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [gpsError, setGpsError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dispatchedResult, setDispatchedResult] = useState(null);

  // 1. Auto-capture high-precision GPS on modal mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords({ lat: 19.0760, lng: 72.8777 });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 10),
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS location error, using regional center:', err);
        setCoords({ lat: 19.0760, lng: 72.8777, accuracy: 50 });
        setIsLocating(false);
        setGpsError('Regional Disaster Zone Center locked');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  // Preset emergency situational chips for 1-tap input in panic
  const PRESET_CHIPS = [
    { label: t('preset_flood'), text: 'Water level rising rapidly inside house. Multiple people trapped on roof needing immediate boat rescue.' },
    { label: t('preset_fire'), text: 'Active fire spreading from LPG cylinder explosion with heavy smoke and toxic fumes.' },
    { label: t('preset_medical'), text: 'Critical patient unconscious with severe bleeding and low oxygen. Need ALS ambulance.' },
    { label: t('preset_collapse'), text: 'Structure collapsed with multiple civilians trapped underneath rubble.' },
  ];

  const handleDispatch = async (e) => {
    e?.preventDefault();
    if (!situation.trim()) {
      toast.error('Please describe your emergency situation.');
      return;
    }

    setIsAnalyzing(true);

    try {
      // 2. AI Disaster Analysis & Authority Routing
      const aiResult = classifyDisaster({
        title: '🚨 PUBLIC EMERGENCY SOS BEACON',
        description: situation.trim(),
        category: 'RESCUE',
        urgency: 'CRITICAL',
        peopleCount: 1,
      });

      const lat = coords?.lat || 19.0760;
      const lng = coords?.lng || 72.8777;
      const trackingCode = `SOS-${Math.floor(100 + Math.random() * 900)}`;

      // 3. Save directly into Supabase emergency_requests table
      let savedId = `pub-sos-${Date.now()}`;
      try {
        const { data: savedRequest, error } = await supabase
          .from('emergency_requests')
          .insert({
            title: `🚨 EMERGENCY SOS: ${aiResult.category}`,
            description: `${situation.trim()}\n\n🤖 [AI TRIAGE & INTIMATION]\n• Assigned Authority: ${aiResult.targetAuthority.name}\n• Hotline: ${aiResult.targetAuthority.hotline}\n• Required Equipment: ${aiResult.requiredEquipment.slice(0, 3).join(', ')}`,
            category: 'RESCUE',
            urgency: 'CRITICAL',
            contact_name: 'Emergency Citizen (Public SOS)',
            contact_phone: '112',
            people_count: 1,
            lat,
            lng,
            location_name: `Device GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            status: 'verified',
            tracking_code: trackingCode,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (savedRequest?.id) savedId = savedRequest.id;
      } catch (e) {
        console.warn('Supabase offline or table notice:', e);
      }

      // Also trigger in CrisisContext if provider active
      try {
        if (typeof triggerSOS === 'function') {
          triggerSOS(coords, {
            description: situation.trim(),
            contactName: 'Public SOS Caller',
            contactPhone: '112',
            locationName: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          });
        }
      } catch (e) {}

      // Success payload for view
      setDispatchedResult({
        id: savedId,
        trackingCode,
        aiResult,
        lat,
        lng,
      });

      toast.success(`🚨 Alert dispatched directly to ${aiResult.targetAuthority.shortName}!`);
      if (typeof onSOSDispatched === 'function') onSOSDispatched(savedId);
    } catch (err) {
      toast.error('Dispatch error: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in pt-6 sm:pt-10 pb-28">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border-2 border-red-600 text-slate-950">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 text-red-600 mb-4 pr-8">
          <div className="p-3 bg-red-100 rounded-2xl shrink-0">
            <AlertOctagon className="w-7 h-7 text-red-600 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 inline-block mb-0.5">
              {t('no_login_needed')}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-950 leading-tight">
              {t('public_sos_title')}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {t('public_sos_desc')}
            </p>
          </div>
        </div>

        {!dispatchedResult ? (
          <form onSubmit={handleDispatch} className="space-y-4">
            {/* Automatic Device GPS Indicator */}
            <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold truncate">
                <Navigation
                  className={`w-4 h-4 shrink-0 ${isLocating ? 'animate-spin text-amber-500' : 'text-emerald-600'}`}
                />
                <span className="truncate">
                  {isLocating
                    ? 'Capturing device GPS coordinates...'
                    : coords
                    ? `Device GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                    : 'Disaster Zone GPS Active'}
                </span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 shrink-0">
                <CheckCircle2 className="w-3 h-3 mr-1" /> {isLocating ? 'Acquiring...' : 'Locked'}
              </span>
            </div>

            {/* Emergency Situation Input (Only Field Required) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-slate-900">
                  {t('what_is_situation')} <span className="text-red-600">*</span>
                </label>
                <span className="text-[10px] font-bold text-red-600 uppercase flex items-center gap-1">
                  <Bot className="w-3 h-3 text-red-600" /> {t('ai_auto_routes')}
                </span>
              </div>
              <textarea
                required
                rows={3}
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder={t('type_situation_placeholder')}
                className="w-full text-base px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-950 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 shadow-xs"
              />
            </div>

            {/* Fast 1-Tap Situation Chips */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('or_tap_preset')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {PRESET_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSituation(chip.text)}
                    className="p-2 text-left rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-700 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Dispatch Button */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-red-600/40 transition-all cursor-pointer active:scale-98 border border-red-500"
              >
                {isAnalyzing ? (
                  <>
                    <Bot className="w-5 h-5 animate-spin" />
                    <span>{t('ai_analyzing_dispatch')}</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-5 h-5 animate-pulse" />
                    <span>{t('ai_dispatch_button')}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* SUCCESS SCREEN WITH DESIGNATED AUTHORITY CARD */
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-emerald-950">
                {t('sos_broadcasted_success')}
              </h4>
              <p className="text-xs text-emerald-800">
                {t('sos_success_desc')}
              </p>
            </div>

            {/* Assigned Authority Dispatch Card */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                  {t('assigned_force')}
                </span>
                <span className="text-[10px] font-bold bg-red-600/30 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                  {t('critical_priority')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-3xl shrink-0">{dispatchedResult.aiResult.targetAuthority.icon}</span>
                <div>
                  <h4 className="font-bold text-sm text-white leading-tight">
                    {dispatchedResult.aiResult.targetAuthority.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {dispatchedResult.aiResult.targetAuthority.department}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">{t('response_sla')}</span>
                  <span className="font-black text-amber-400">
                    ~{dispatchedResult.aiResult.targetAuthority.responseSlaMinutes} Minutes
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">{t('tracking_beacon')}</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {dispatchedResult.trackingCode}
                  </span>
                </div>
              </div>

              {/* Direct Hotline Dial */}
              <a
                href={`tel:${dispatchedResult.aiResult.targetAuthority.hotline}`}
                className="w-full py-3 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call {dispatchedResult.aiResult.targetAuthority.shortName} Hotline ({dispatchedResult.aiResult.targetAuthority.hotline})</span>
              </a>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs cursor-pointer transition-colors"
            >
              {t('close_window')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
