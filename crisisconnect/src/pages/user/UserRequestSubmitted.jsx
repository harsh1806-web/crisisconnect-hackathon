import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  PhoneCall,
  Home,
  Copy,
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';
import toast from 'react-hot-toast';

export default function UserRequestSubmitted() {
  const { id } = useParams();
  const { requests } = useCrisis();

  const request = requests.find((r) => r.id === id) || requests[0];

  const handleCopyCode = () => {
    if (request?.trackingCode && navigator.clipboard) {
      navigator.clipboard.writeText(request.trackingCode);
      toast.success(`Reference ${request.trackingCode} copied!`);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6 animate-fade-in pb-24">
      {/* Success Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
            Dispatched to Authorities
          </span>
          <h1 className="text-xl font-black text-slate-900">Request Submitted!</h1>
          <p className="text-xs text-slate-500 mt-1">
            Your emergency report has entered the Disaster Operations Command queue for verification and squad assignment.
          </p>
        </div>

        {/* Tracking Reference Pill */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Incident Tracking Reference
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-mono font-black text-slate-900 tracking-wider">
              {request?.trackingCode || 'CRISIS-PENDING'}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              title="Copy Reference"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            Quote this tracking code when calling emergency hotlines
          </p>
        </div>

        {/* Primary CTA: Track Status (Step 5 in flow) */}
        <div className="pt-2 space-y-2">
          <Link
            to={`/user/track/${request?.id || id}`}
            className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>TRACK STATUS & RECEIVE UPDATES</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/user/dashboard"
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5" /> Return to Citizen Home
          </Link>
        </div>
      </div>

      {/* Immediate Survival Checklist */}
      <div className="bg-amber-50 rounded-3xl border border-amber-200 p-5 text-xs text-amber-950 space-y-2">
        <h3 className="font-bold flex items-center gap-1.5 text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          Immediate Safety Advice:
        </h3>
        <ul className="space-y-1.5 text-[11px] list-disc list-inside text-amber-900/90 leading-relaxed">
          <li>Keep your mobile phone on battery saver mode and line open.</li>
          <li>If water is rising indoors, do not touch electrical outlets or switches.</li>
          <li>Move vulnerable individuals (infants, elderly) to the highest reachable dry surface.</li>
        </ul>
      </div>

      {/* Emergency Hotline direct call */}
      <div className="text-center">
        <a
          href="tel:112"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline"
        >
          <PhoneCall className="w-4 h-4" /> Need immediate phone help? Dial 112
        </a>
      </div>
    </div>
  );
}
