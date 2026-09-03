import { useState } from 'react';
import {
  Phone,
  Mail,
  ShieldCheck,
  Heart,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCrisis } from '../context/CrisisContext';
import { Link } from 'react-router-dom';
import RequestCard from '../components/RequestCard';

export default function Profile() {
  const { currentUser, logout, isVolunteer } = useAuth();
  const { requests } = useCrisis();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'missions'

  // Filter user's requests and assigned missions
  const myRequests = requests.filter(
    (r) =>
      r.contactName?.toLowerCase().includes(currentUser?.name?.toLowerCase()) ||
      r.contactName === 'Anonymous Citizen' ||
      r.isSOS
  );

  const myMissions = requests.filter(
    (r) => r.assignedVolunteer?.name?.toLowerCase() === currentUser?.name?.toLowerCase()
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12 animate-fade-in">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-red-500 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-black text-2xl shadow-md">
                {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentUser?.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">
                  {currentUser?.roleLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {currentUser?.email}
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Phone className="w-3.5 h-3.5" /> {currentUser?.phone}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to="/login"
              className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
            >
              Switch Role
            </Link>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Volunteer specific stats if volunteer */}
        {isVolunteer && (
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Status
              </span>
              <p className="text-sm font-black text-emerald-900 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Responder
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Missions Completed
              </span>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {currentUser?.completedMissions || 19} Citizen Evacuations
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Certified Skills
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentUser?.skills?.map((s, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-bold bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Emergency ICE Card (In Case of Emergency) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-100 text-red-600">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                In Case of Emergency (ICE) Profile
              </h2>
              <p className="text-xs text-slate-500">
                Critical medical data shared with paramedics during trauma situations
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold uppercase">
            Paramedic Sync Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Blood Group
            </span>
            <p className="text-xl font-black text-red-600 mt-1">
              {currentUser?.bloodGroup || 'O+ Positive'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Allergies & Medical Alerts
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {currentUser?.allergies || 'None Reported / No Penicillin'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Primary Emergency Contact
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {currentUser?.emergencyContact?.name || 'Claire Taylor (Sister)'}
            </p>
            <a
              href={`tel:${currentUser?.emergencyContact?.phone || '112'}`}
              className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1 mt-0.5"
            >
              <Phone className="w-3 h-3" /> {currentUser?.emergencyContact?.phone || '+1-555-0199'}
            </a>
          </div>
        </div>
      </div>

      {/* Tabs: My Requests vs My Missions */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-2 text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'requests'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            My Emergency Requests ({myRequests.length})
          </button>

          {isVolunteer && (
            <button
              onClick={() => setActiveTab('missions')}
              className={`pb-2 text-sm font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'missions'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              My Volunteer Missions ({myMissions.length})
            </button>
          )}
        </div>

        {activeTab === 'requests' ? (
          myRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRequests.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
              <p className="text-sm font-bold text-slate-900">No active help requests posted.</p>
              <p className="text-xs text-slate-500">Need emergency assistance? File a request now.</p>
              <Link
                to="/create"
                className="inline-block px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl mt-2"
              >
                Post Help Request
              </Link>
            </div>
          )
        ) : myMissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myMissions.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
            <p className="text-sm font-bold text-slate-900">No missions accepted yet.</p>
            <p className="text-xs text-slate-500">Check the open requests feed to assist neighbors.</p>
            <Link
              to="/requests"
              className="inline-block px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl mt-2"
            >
              Explore Open Requests
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
