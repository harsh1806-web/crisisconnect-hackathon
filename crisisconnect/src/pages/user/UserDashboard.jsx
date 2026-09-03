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
  Award,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Star,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';
import { useAuth } from '../../context/AuthContext';
import SOSButton from '../../components/SOSButton';

export default function UserDashboard() {
  const {
    crisisInfo,
    broadcasts,
    requests,
    shelters,
    volunteerTasks,
    signUpForVolunteerTask,
    volunteerPoints,
    volunteerRewards,
    claimedRewardIds,
    claimReward,
  } = useCrisis();
  const { currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('emergency'); // 'emergency' | 'volunteering'
  const [locationFilter, setLocationFilter] = useState('all'); // 'all' | 'nearby' | 'sector4' | 'remote'
  const [expandedTaskId, setExpandedTaskId] = useState(null);

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
    { name: 'Water & Food', icon: Droplets, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { name: 'Shelter', icon: Home, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  ];

  // Location based filtering
  const filteredTasks = volunteerTasks.filter((task) => {
    if (locationFilter === 'all') return true;
    if (locationFilter === 'nearby') return task.distanceKm <= 1.5 && task.distanceKm > 0;
    if (locationFilter === 'sector4') return task.sector?.includes('Sector 4');
    if (locationFilter === 'remote') return task.distanceKm === 0.0 || task.sector?.includes('Remote');
    return true;
  });

  // Calculate Rank Tier
  const getRankTier = (pts) => {
    if (pts >= 200) return { title: 'Gold Life Saver Hero', color: 'text-amber-500 bg-amber-50 border-amber-200' };
    if (pts >= 100) return { title: 'Silver Disaster Guardian', color: 'text-slate-700 bg-slate-100 border-slate-300' };
    return { title: 'Bronze Community Responder', color: 'text-amber-800 bg-amber-50 border-amber-300' };
  };

  const rankTier = getRankTier(volunteerPoints);

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
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
          <span>Volunteer & Points</span>
        </button>
      </div>

      {/* TAB 1: EMERGENCY & AID (NORMAL USER DASHBOARD) */}
      {activeTab === 'emergency' && (
        <div className="space-y-4">
          {/* Emergency Incident Ticker - FIXED: min-w-0, overflow-hidden, shrink-0 prevent text going out of box */}
          <div className="p-3 bg-red-50/80 rounded-2xl border border-red-200 flex items-center justify-between text-xs gap-2 overflow-hidden">
            <div className="flex items-center gap-2 text-red-950 font-bold min-w-0 flex-1">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
              <span className="truncate">{crisisInfo.status}: {crisisInfo.title}</span>
            </div>
            <Link
              to="/map"
              className="text-red-700 text-[11px] font-bold shrink-0 ml-1 hover:underline whitespace-nowrap"
            >
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

          {/* Create Emergency Request Card (AI-Powered) */}
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
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-slate-900 group-hover:text-red-600 transition-colors">
                      Report Emergency
                    </h3>
                    <span className="text-[9px] font-bold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                      AI Powered
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Describe what happened — AI classifies, prioritizes & dispatches
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-transform shrink-0" />
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

      {/* TAB 2: VOLUNTEER SERVICE, LOCATION OPTIONS, POINTS & REWARDS */}
      {activeTab === 'volunteering' && (
        <div className="space-y-4">
          {/* VOLUNTEER POINTS & REWARDS SHOWCASE */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-5 border border-emerald-800/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Citizen Volunteer Profile
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="text-2xl font-black text-white">{volunteerPoints}</span>
                  <span className="text-xs text-slate-300 font-semibold">Points Earned</span>
                </div>
              </div>

              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${rankTier.color}`}>
                {rankTier.title}
              </span>
            </div>

            {/* Progress to Next Milestone */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>Next Milestone: 100 Points (Silver Guardian)</span>
                <span className="font-bold text-emerald-400">{Math.min(100, Math.round((volunteerPoints / 100) * 100))}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (volunteerPoints / 100) * 100)}%` }}
                />
              </div>
            </div>

            {/* Redeemable Rewards Grid */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Rewards Based on Points:
              </span>
              <div className="space-y-2">
                {volunteerRewards.map((rew) => {
                  const isUnlocked = volunteerPoints >= rew.pointsRequired;
                  const isClaimed = claimedRewardIds.includes(rew.id);

                  return (
                    <div
                      key={rew.id}
                      className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <p className="font-bold text-white text-xs">{rew.title}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{rew.description}</p>
                        <span className="text-[9px] text-emerald-400 font-semibold block">
                          Criteria: {rew.pointsRequired} pts
                        </span>
                      </div>

                      {isClaimed ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 shrink-0">
                          ✓ Unlocked
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => claimReward(rew.id)}
                          className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] shrink-0 cursor-pointer shadow-xs transition-colors"
                        >
                          Claim Reward
                        </button>
                      ) : (
                        <span className="px-2 py-1 rounded-xl bg-slate-800 text-slate-500 font-semibold text-[10px] shrink-0">
                          {rew.pointsRequired - volunteerPoints} pts needed
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* LOCATION OPTIONS FILTER */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                Opportunities Based on Your Location:
              </span>
              <span className="text-[10px] text-slate-500">Sector 4 Base</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { label: 'All Opportunities', value: 'all' },
                { label: 'Nearby (< 2 km)', value: 'nearby' },
                { label: 'My Sector (Sector 4)', value: 'sector4' },
                { label: 'Remote / Phone', value: 'remote' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLocationFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    locationFilter === opt.value
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* VOLUNTEER TASK CARDS WITH SERVICE DETAILS & POINTS CRITERIA */}
          <div className="space-y-3">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const isExpanded = expandedTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3"
                  >
                    {/* Top Row: Location Distance & Activity Points */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded uppercase">
                          {task.sector}
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          {task.distanceKm === 0 ? 'Remote / Online' : `${task.distanceKm} km away`}
                        </span>
                      </div>

                      {/* Criteria for Volunteer Points Badge */}
                      <span className="text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                        <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                        <span>+{task.pointsReward} Points</span>
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{task.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{task.description}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {task.location}
                      </p>
                    </div>

                    {/* Expandable Necessary Details for the Service */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3 space-y-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="w-full flex items-center justify-between font-bold text-slate-800 cursor-pointer text-[11px]"
                      >
                        <span className="flex items-center gap-1.5 text-emerald-800">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Necessary Details & Safety Briefing
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="space-y-2 pt-1 border-t border-slate-200/70 text-[11px] text-slate-700 animate-fade-in">
                          <div>
                            <span className="font-bold text-slate-900 block">⏱️ Shifts & Time Commitment:</span>
                            <span>{task.shifts || task.timeRequired}</span>
                          </div>

                          {task.equipmentProvided && (
                            <div>
                              <span className="font-bold text-slate-900 block">🦺 Equipment Provided On-Site:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {task.equipmentProvided.map((eq) => (
                                  <span key={eq} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-600">
                                    ✓ {eq}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {task.safetyInstructions && (
                            <div>
                              <span className="font-bold text-slate-900 block">⚠️ Safety Instructions:</span>
                              <p className="text-slate-600 italic leading-relaxed">{task.safetyInstructions}</p>
                            </div>
                          )}

                          <div className="pt-1 flex items-center justify-between border-t border-slate-200 text-[10px]">
                            <span>Lead: <strong>{task.coordinator}</strong></span>
                            {task.phone && (
                              <a href={`tel:${task.phone}`} className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5">
                                <PhoneCall className="w-3 h-3" /> {task.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action row */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1 text-[11px]">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <strong>{task.volunteersSignedUp}</strong> of {task.volunteersNeeded} joined
                      </span>

                      {task.userRegistered ? (
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Registered
                        </span>
                      ) : (
                        <button
                          onClick={() => signUpForVolunteerTask(task.id, currentUser?.name)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Sign Up (+{task.pointsReward} pts)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
                <p className="text-xs font-bold text-slate-700">No opportunities match this location filter.</p>
                <button
                  onClick={() => setLocationFilter('all')}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Show All Opportunities
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
