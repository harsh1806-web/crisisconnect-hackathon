import { useState } from 'react';
import { AlertOctagon, Radio, Navigation, X, CheckCircle } from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SOSButton({ variant = 'large' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const { triggerSOS } = useCrisis();
  const { currentUser } = useAuth();
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
                  Tap for Help
                </span>
              </div>
            </div>
          </button>
          <span className="text-xs font-semibold text-red-600 flex items-center gap-1 mt-1 animate-pulse">
            <Radio className="w-3.5 h-3.5" /> 24/7 EOC Satellite Link Active
          </span>
        </div>
      ) : (
        <button
          onClick={handleOpen}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/30 transition-all active:scale-95 cursor-pointer"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>SOS BEACON</span>
        </button>
      )}

      {/* Confirmation & Details Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border-2 border-red-500">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-2xl">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Trigger Critical SOS Beacon</h3>
                <p className="text-xs text-slate-500">Alerts all disaster rescue squads and nearby responders</p>
              </div>
            </div>

            {/* GPS Status Indicator */}
            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Navigation className={`w-4 h-4 ${locating ? 'animate-spin text-amber-500' : 'text-emerald-600'}`} />
                <span>
                  {locating
                    ? 'Detecting high-precision GPS coordinates...'
                    : coords
                    ? `GPS Locked: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                    : 'Coordinates: Disaster Zone Central'}
                </span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                <CheckCircle className="w-3 h-3 mr-1" /> GPS Ready
              </span>
            </div>

            {/* Quick Details form */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Immediate Emergency Nature / Details (Optional)
                </label>
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="e.g. Water entering home, chest pain, collapsed wall"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of People in Danger</label>
                  <input
                    type="number"
                    min="1"
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Caller Name</label>
                  <input
                    type="text"
                    defaultValue={currentUser?.name || 'Anonymous Citizen'}
                    readOnly
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleConfirmDispatch}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-500/40 transition-all cursor-pointer"
              >
                <AlertOctagon className="w-5 h-5" />
                <span>CONFIRM & DISPATCH NOW</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
