import { useState } from 'react';
import { AlertOctagon, Radio, Navigation, X, CheckCircle } from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function SOSButton({ variant = 'large' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const { triggerSOS } = useCrisis();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleOpen = () => {
    setIsOpen(true);
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setLocating(false);
        },
        () => {
          setCoords({ lat: 13.0827, lng: 80.2707 });
          setLocating(false);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      setLocating(false);
    }
  };

  const handleConfirmDispatch = () => {
    const sos = triggerSOS(coords, {
      description: customMsg || 'Immediate SOS emergency broadcast. Victim requires immediate assistance.',
      peopleCount: Number(peopleCount) || 1,
      contactName: currentUser?.name || 'Emergency Caller',
      contactPhone: currentUser?.phone || '+1-555-EMERGENCY',
      locationName: coords ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Current Emergency Location',
    });
    setIsOpen(false);
    navigate(`/requests/${sos.id}`);
  };

  return (
    <>
      {variant === 'large' ? (
        <div className="flex flex-col items-center">
          <button
            onClick={handleOpen}
            type="button"
            className="group relative inline-flex items-center justify-center p-0.5 mb-2 overflow-hidden rounded-full focus:outline-none focus:ring-4 focus:ring-red-400 cursor-pointer transition-transform active:scale-95"
          >
            <div className="relative flex items-center justify-center w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 shadow-2xl animate-sos-pulse hover:shadow-red-500/50">
              <div className="flex flex-col items-center justify-center text-white text-center select-none">
                <AlertOctagon className="w-10 h-10 md:w-12 md:h-12 text-white animate-bounce mb-1" />
                <span className="text-xl md:text-2xl font-black tracking-wider uppercase">SOS</span>
                <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-red-100">
                  {t('tap_for_help')}
                </span>
              </div>
            </div>
          </button>
          <span className="text-xs font-semibold text-red-600 flex items-center gap-1 mt-1 animate-pulse">
            <Radio className="w-3.5 h-3.5" /> {t('satellite_link')}
          </span>
        </div>
      ) : (
        <button
          onClick={handleOpen}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/30 transition-all active:scale-95 cursor-pointer"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>{t('sos_beacon')}</span>
        </button>
      )}

      {/* Confirmation & Details Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in pt-6 sm:pt-12 pb-28">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border-2 border-red-600 text-slate-950">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-600 mb-4 pr-8">
              <div className="p-3 bg-red-100 rounded-2xl shrink-0">
                <AlertOctagon className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 leading-tight">
                  {t('trigger_sos')}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Alerts disaster rescue squads & nearby emergency teams
                </p>
              </div>
            </div>

            {/* GPS Status Indicator */}
            <div className="mb-4 p-3 bg-slate-100 rounded-2xl border border-slate-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold truncate">
                <Navigation className={`w-4 h-4 shrink-0 ${locating ? 'animate-spin text-amber-500' : 'text-emerald-600'}`} />
                <span className="truncate">
                  {locating
                    ? 'Detecting GPS coordinates...'
                    : coords
                    ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                    : 'Disaster Zone GPS Active'}
                </span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 shrink-0">
                <CheckCircle className="w-3 h-3 mr-1" /> {t('gps_ready')}
              </span>
            </div>

            {/* Quick Details form with guaranteed high contrast and 16px text to prevent iOS zoom */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">
                  {t('emergency_nature')}
                </label>
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="e.g. Water entering home, chest pain, collapsed wall"
                  className="w-full text-base px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-950 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    {t('people_in_danger')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    className="w-full text-base px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-950 font-bold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 font-mono shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    {t('caller_name')}
                  </label>
                  <input
                    type="text"
                    value={currentUser?.name || 'Anonymous Citizen'}
                    readOnly
                    className="w-full text-base px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-800 font-semibold truncate"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleConfirmDispatch}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-red-600/40 transition-all cursor-pointer active:scale-98"
              >
                <AlertOctagon className="w-5 h-5 animate-pulse" />
                <span>{t('confirm_dispatch')}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
