import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  MapPin,
  Clock,
  Users,
  Phone,
  ShieldCheck,
  ChevronRight,
  Droplets,
  Activity,
  Home,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCrisis } from '../context/CrisisContext';

export default function RequestCard({ request }) {
  const { currentUser, isVolunteer } = useAuth();
  const { claimRequest } = useCrisis();

  if (!request) return null;

  const isCritical = request.urgency === 'critical';
  const isHigh = request.urgency === 'high';
  const isOpen = request.status === 'open';
  const isInProgress = request.status === 'in_progress';

  // Category Icon Resolver
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'medical':
        return <Activity className="w-4 h-4 text-red-500" />;
      case 'food & water':
      case 'food':
      case 'water':
        return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'shelter':
        return <Home className="w-4 h-4 text-emerald-500" />;
      case 'power & comms':
      case 'power':
        return <Zap className="w-4 h-4 text-amber-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-purple-500" />;
    }
  };

  // Humanized time string (pure)
  const formatTime = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div
      className={`group rounded-2xl bg-white border p-4 sm:p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between ${
        isCritical
          ? 'border-red-300 ring-1 ring-red-200'
          : isHigh
          ? 'border-amber-200'
          : 'border-slate-200'
      }`}
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            {/* Category tag */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800">
              {getCategoryIcon(request.category)}
              {request.category}
            </span>

            {/* Urgency Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${
                isCritical
                  ? 'bg-red-100 text-red-700'
                  : isHigh
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping mr-0.5" />}
              {request.urgency}
            </span>
          </div>

          {/* Status badge */}
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
              isOpen
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isInProgress
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-500 line-through'
            }`}
          >
            {request.status.replace('_', ' ')}
          </span>
        </div>

        {/* Title */}
        <Link to={`/requests/${request.id}`} className="block">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2">
            {request.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
          {request.description}
        </p>

        {/* Vulnerability tags */}
        {request.vulnerabilities && request.vulnerabilities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {request.vulnerabilities.map((v, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded"
              >
                ⚠️ {v}
              </span>
            ))}
          </div>
        )}

        {/* Location & Metadata */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium">{request.locationName}</span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <strong>{request.peopleCount}</strong> affected
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(request.createdAt)}
              </span>
            </div>

            {request.assignedVolunteer && (
              <span className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold truncate max-w-[120px]">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                {request.assignedVolunteer.name.split(' ')[0]} en route
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {request.contactPhone && (
            <a
              href={`tel:${request.contactPhone}`}
              className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors"
              title={`Call requester: ${request.contactPhone}`}
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          <span className="text-xs text-slate-500 truncate max-w-[120px]">
            {request.contactName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isVolunteer && isOpen && (
            <button
              onClick={() => claimRequest(request.id, currentUser)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>I Can Help</span>
            </button>
          )}

          <Link
            to={`/requests/${request.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-red-600 text-white text-xs font-bold transition-colors"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
