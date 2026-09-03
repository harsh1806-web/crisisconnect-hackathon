import { Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ListFilter,
  LogOut,
  MapPin,
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';
import { useAuth } from '../../context/AuthContext';

export default function AuthorityDashboard() {
  const { crisisInfo, requests, ngos, verifyRequest } = useCrisis();
  const { currentUser, logout } = useAuth();

  const pendingRequests = requests.filter((r) => r.verificationStatus === 'pending');
  const activeSOS = requests.filter((r) => r.urgency === 'critical' && r.status !== 'resolved');

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6 pb-24 animate-fade-in">
      {/* Top Official Command Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                  {currentUser?.department || 'Disaster Operations EOC'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Online
                </span>
              </div>
              <h1 className="text-lg font-black text-white">
                {currentUser?.name || 'Commander Vikram Rathore'}
              </h1>
              <p className="text-xs text-slate-400">
                Badge: <span className="font-mono text-slate-200">{currentUser?.badgeId || 'NDMA-8821'}</span> • {currentUser?.rank || 'Senior Incident Commander'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Link
              to="/authority/requests"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Request Feed
            </Link>
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action notification strip */}
        {pendingRequests.length > 0 ? (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>
                <strong>{pendingRequests.length} Emergency Requests</strong> awaiting Authority Verification.
              </span>
            </div>
            <Link
              to="/authority/requests?status=pending_verification"
              className="font-bold underline text-amber-300 hover:text-white"
            >
              Review Now →
            </Link>
          </div>
        ) : (
          <div className="p-2.5 bg-slate-800/60 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All incoming citizen requests have been reviewed and verified.</span>
          </div>
        )}
      </div>

      {/* Real-time KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Logged
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{requests.length}</p>
          <span className="text-[10px] text-slate-500">Citizen incidents</span>
        </div>

        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            Pending Verify
          </span>
          <p className="text-2xl font-black text-amber-900 mt-1">{pendingRequests.length}</p>
          <span className="text-[10px] text-amber-700 font-semibold">Requires clearance</span>
        </div>

        <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 shadow-xs">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
            Active / Assigned
          </span>
          <p className="text-2xl font-black text-blue-900 mt-1">
            {crisisInfo.stats.assignedMissions}
          </p>
          <span className="text-[10px] text-blue-700 font-semibold">NGOs deployed</span>
        </div>

        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Rescues Safe
          </span>
          <p className="text-2xl font-black text-emerald-900 mt-1">
            {crisisInfo.stats.rescuesCompleted}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold">Missions resolved</span>
        </div>
      </div>

      {/* Flow Action Callout: View Emergency Requests */}
      <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
            Operational Step 2 & 3
          </span>
          <h2 className="text-lg font-black">View & Manage Emergency Requests</h2>
          <p className="text-xs text-slate-300 max-w-md">
            Verify legitimate incidents, reject false alarms, assign registered NGOs, and update rescue statuses.
          </p>
        </div>

        <Link
          to="/authority/requests"
          className="px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
        >
          <ListFilter className="w-4 h-4 text-blue-600" />
          <span>OPEN REQUESTS QUEUE</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Urgent Critical SOS Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            Immediate Critical SOS Stream ({activeSOS.length})
          </h3>
          <Link
            to="/authority/requests"
            className="text-xs font-bold text-red-600 hover:underline"
          >
            All Requests →
          </Link>
        </div>

        <div className="space-y-2.5">
          {activeSOS.slice(0, 3).map((req) => (
            <div
              key={req.id}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    {req.trackingCode || req.id}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{req.title}</span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{req.locationName}</span>
                  <span>•</span>
                  <span>{req.contactName} ({req.contactPhone})</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {req.verificationStatus === 'pending' && (
                  <button
                    onClick={() => verifyRequest(req.id, currentUser?.name)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Verify
                  </button>
                )}
                <Link
                  to="/authority/requests"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registered Disaster NGOs Ready for Deployment */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Registered NGO Response Units ({ngos.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ngos.map((ngo) => (
            <div key={ngo.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900">{ngo.name}</p>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {ngo.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{ngo.specialty}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                <span>Leader: {ngo.leader}</span>
                <span className="font-bold text-blue-700">{ngo.phone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
