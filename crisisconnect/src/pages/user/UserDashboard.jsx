import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  AlertOctagon,
  Clock,
  PhoneCall,
  Activity,
  Droplets,
  LifeBuoy,
  Home,
  ChevronRight,
  LogOut,
  MapPin,
  HeartHandshake,
  Users,
  CheckCircle,
  Wind,
  Truck,
  Pill,
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';
import { useAuth } from '../../context/AuthContext';
import SOSButton from '../../components/SOSButton';

export default function UserDashboard() {
  const { crisisInfo, broadcasts, requests, shelters, volunteerTasks, signUpForVolunteerTask } =
    useCrisis();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('emergency'); // 'emergency' | 'volunteering'

  // Find any active request submitted by user or recent open requests
  const myActiveRequest = requests.find(
    (r) =>
      (r.contactName?.toLowerCase() === currentUser?.name?.toLowerCase() ||
        r.contactPhone === currentUser?.phone ||
        r.isSOS) &&
      r.status !== 'resolved'
  );

  const categories = [
    { name: 'Rescue', icon: LifeBuoy, color: 'bg-red-50 text-red-600 border-red-200' },
    { name: 'Medical', icon: Activity, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { name: 'Blood', icon: Droplets, color: 'bg-red-50 text-red-700 border-red-200' },
    { name: 'Oxygen', icon: Wind, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    { name: 'Medicines', icon: Pill, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { name: 'Water & Food', icon: Droplets, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { name: 'Shelter', icon: Home, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { name: 'Transportation', icon: Truck, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24 animate-fade-in">
      {/* Mobile Top Status Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {currentUser?.name ? currentUser.name[0] : 'U'}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">Citizen Portal</p>
            <p className="text-sm font-bold text-slate-900 leading-tight">
              {currentUser?.name || 'Citizen User'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:112"
            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200"
            title="Call 112 Hotline"
          >
            <PhoneCall className="w-4 h-4" />
          </a>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Switch portal / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dual Hub Switcher: Emergency Services vs Volunteering Opportunities */}
      <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('emergency')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'emergency'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
          <span>Emergency & Aid</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('volunteering')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'volunteering'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
          <span>Volunteer to Help ({volunteerTasks.length})</span>
        </button>
      </div>

      {/* TAB 1: EMERGENCY & AID (NORMAL USER DASHBOARD) */}
      {activeTab === 'emergency' && (
        <div className="space-y-4">
          {/* Emergency Incident Ticker */}
          <div className="p-2.5 bg-red-50/80 rounded-2xl border border-red-200 flex items-center justify-between text-xs overflow-hidden">
            <div className="flex items-center gap-2 text-red-950 font-bold min-w-0 flex-1 pr-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
              <span className="truncate text-[11px]">{crisisInfo.status}: {crisisInfo.title}</span>
            </div>
            <Link to="/map" className="text-red-700 text-[11px] font-bold shrink-0 hover:underline">
              Map →
            </Link>
          </div>

          {/* SOS Panic Trigger Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 rounded-3xl p-6 text-center text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">
              Immediate Emergency Dispatch
            </p>
            <div className="py-2">
              <SOSButton variant="large" />
            </div>
            <p className="text-[11px] text-slate-300 max-w-xs mx-auto mt-2">
              Transmits your exact GPS beacon directly to civil defense & nearby rescue squads.
            </p>
          </div>

          {/* Create Emergency Request Card */}
          <Link
            to="/user/create"
            className="block p-5 bg-white rounded-3xl border-2 border-red-500 shadow-md hover:shadow-lg transition-all transform active:scale-98 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/30 group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-red-600 transition-colors">
                    Create Emergency Request
                  </h3>
                  <p className="text-xs text-slate-500">
                    Request boat rescue, medical aid, drinking water or shelter
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Active Request Tracking Card */}
          {myActiveRequest && (
            <div className="bg-white rounded-3xl border border-blue-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Active Incident in Progress
                  </span>
                </div>
                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                  {myActiveRequest.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{myActiveRequest.title}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {myActiveRequest.locationName}
                </p>
              </div>

              <Link
                to={`/user/track/${myActiveRequest.id}`}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Clock className="w-4 h-4" />
                <span>Track Incident Status & Updates</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Quick Category Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Request Assistance by Category
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.name}
                    to={`/user/create?category=${encodeURIComponent(cat.name)}`}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-transform active:scale-95 ${cat.color}`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                      <p className="text-[10px] text-slate-500">Report need →</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Evacuation Broadcasts */}
          {broadcasts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                Civil Defense Advisories
              </h3>
              {broadcasts.slice(0, 1).map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-amber-600" />
                    {b.title}
                  </p>
                  <p className="text-amber-900 text-[11px] leading-relaxed">{b.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Safe Shelters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Nearest Safe Evacuation Shelters
              </h3>
              <Link to="/map" className="text-xs text-emerald-600 font-bold hover:underline">
                View on Map
              </Link>
            </div>
            <div className="space-y-2">
              {shelters.slice(0, 2).map((sh) => (
                <div key={sh.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{sh.name}</p>
                    <p className="text-[10px] text-slate-500">{sh.address}</p>
                    <span className="inline-block text-[10px] font-bold text-emerald-700 mt-1">
                      Capacity: {sh.occupied} / {sh.capacity}
                    </span>
                  </div>
                  <a
                    href={`tel:${sh.contact}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition-colors"
                  >
                    Call
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VOLUNTEERING OPPORTUNITIES AVAILABLE FOR CITIZENS */}
      {activeTab === 'volunteering' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1 text-xs text-emerald-950">
            <h3 className="font-bold flex items-center gap-1.5 text-emerald-900">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              Help Stranded Neighbors in Your Community
            </h3>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              If you are in a safe zone with power and dry shelter, sign up for verified community aid tasks below.
            </p>
          </div>

          <div className="space-y-3">
            {volunteerTasks.map((task) => (
              <div key={task.id} className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">
                    {task.sector}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {task.timeRequired}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{task.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{task.description}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {task.location}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{task.volunteersSignedUp}</strong> of {task.volunteersNeeded} volunteers joined
                  </span>

                  {task.userRegistered ? (
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Registered
                    </span>
                  ) : (
                    <button
                      onClick={() => signUpForVolunteerTask(task.id, currentUser?.name)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-2xs"
                    >
                      Sign Up to Help
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
