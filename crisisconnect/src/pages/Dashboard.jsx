import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  LifeBuoy,
  Users,
  Home,
  CheckCircle,
  PhoneCall,
  ArrowRight,
  Activity,
  Droplets,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import SOSButton from '../components/SOSButton';
import EmergencyCard from '../components/EmergencyCard';
import RequestCard from '../components/RequestCard';

export default function Dashboard() {
  const { crisisInfo, broadcasts, requests, shelters, resetDemoData } = useCrisis();

  // Urgent and open requests for front page priority stream
  const urgentRequests = requests
    .filter((r) => r.status !== 'resolved')
    .sort((a) => (a.urgency === 'critical' ? -1 : 1))
    .slice(0, 4);

  const categories = [
    { name: 'Rescue & Boat', icon: LifeBuoy, color: 'text-red-600 bg-red-50 border-red-200' },
    { name: 'Medical Aid', icon: Activity, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { name: 'Food & Water', icon: Droplets, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { name: 'Safe Shelter', icon: Home, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { name: 'Power & Comms', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-24 md:pb-12 animate-fade-in">
      {/* Active Broadcast Announcements */}
      {broadcasts.length > 0 && (
        <section className="space-y-3">
          {broadcasts.map((alert) => (
            <EmergencyCard key={alert.id} broadcast={alert} />
          ))}
        </section>
      )}

      {/* Hero Disaster Status & SOS Trigger Panel */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white p-6 sm:p-10 shadow-2xl border border-slate-700/50">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Disaster Briefing */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Active Incident: {crisisInfo.status}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {crisisInfo.title}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              {crisisInfo.summary}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/create"
                className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Submit Help Request
              </Link>
              <Link
                to="/map"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-sm border border-white/15 transition-all"
              >
                Open Disaster Map
              </Link>
            </div>
          </div>

          {/* Right Column: Central SOS Panic Trigger */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center py-4 bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">
              Direct Emergency Dispatch
            </p>
            <SOSButton variant="large" />
            <p className="text-[11px] text-slate-400 text-center mt-3 max-w-xs">
              One-tap broadcast sends your GPS coordinates directly to first responder units and civil defense.
            </p>
          </div>
        </div>
      </section>

      {/* Real-time Statistics KPI Counter */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Requests</span>
            <AlertOctagon className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{crisisInfo.stats.activeRequests}</div>
          <p className="text-xs text-amber-600 font-semibold mt-1">Pending assistance</p>
        </div>

        <div className="rounded-2xl bg-white border border-red-200 bg-red-50/30 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">Critical SOS</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="text-3xl font-black text-red-600">{crisisInfo.stats.criticalSOS}</div>
          <p className="text-xs text-red-600 font-semibold mt-1">High urgency dispatched</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Volunteers Ready</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{crisisInfo.stats.activeVolunteers}</div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">First responders on call</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rescues Completed</span>
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{crisisInfo.stats.rescuesCompleted}</div>
          <p className="text-xs text-blue-600 font-semibold mt-1">Citizens safely evacuated</p>
        </div>
      </section>

      {/* Quick Category Directory */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Immediate Needs by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                to={`/requests?category=${encodeURIComponent(cat.name)}`}
                className={`p-4 rounded-2xl border transition-all hover:scale-105 shadow-xs flex flex-col items-center text-center ${cat.color}`}
              >
                <Icon className="w-7 h-7 mb-2" />
                <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Explore requests →</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Priority Urgent Requests Stream */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              High Priority & Urgent Relief Stream
            </h2>
            <p className="text-xs text-slate-500">Live requests needing immediate community & responder action</p>
          </div>
          <Link
            to="/requests"
            className="text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            View All ({requests.length}) <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {urgentRequests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      </section>

      {/* Shelters & Relief Camps Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Safe Shelters & Evacuation Bases</h2>
            <p className="text-xs text-slate-500">Official centers stocked with food, blankets, and medical care</p>
          </div>
          <Link to="/map" className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700">
            View on Map →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shelters.map((sh) => {
            const percent = Math.round((sh.occupied / sh.capacity) * 100);
            return (
              <div key={sh.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{sh.name}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      percent > 80 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {sh.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500">{sh.address}</p>

                {/* Capacity Bar */}
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Capacity Occupied</span>
                    <span>
                      {sh.occupied} / {sh.capacity} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Available Supplies */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {sh.supplies.map((sup, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      {sup}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <a
                    href={`tel:${sh.contact}`}
                    className="font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> {sh.contact}
                  </a>
                  <Link
                    to="/map"
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    Get Directions
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Emergency Hotline Directory */}
      <section className="rounded-2xl bg-slate-900 text-white p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-red-500" /> Official 24/7 Emergency Numbers
            </h2>
            <p className="text-xs text-slate-400">Toll-free state emergency response hotlines</p>
          </div>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
            Lines Free & Operational
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {crisisInfo.emergencyContacts.map((contact, idx) => (
            <a
              key={idx}
              href={`tel:${contact.number}`}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex flex-col items-center text-center transition-colors group"
            >
              <span className="text-xs text-slate-400 font-medium mb-1 truncate max-w-full">
                {contact.name}
              </span>
              <span className="text-base font-black text-red-400 group-hover:text-red-300">
                {contact.number}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Cache reset helper */}
      <div className="text-center pt-4">
        <button
          onClick={resetDemoData}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear Emergency Cache & Refresh
        </button>
      </div>
    </div>
  );
}
