import React, { useState } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Search,
  Filter,
  AlertTriangle,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import { useAuth } from '../context/AuthContext';

export default function VolunteerAttendanceModal({ onClose }) {
  const { volunteerTasks, updateVolunteerAttendance } = useCrisis();
  const { currentUser } = useAuth();
  const officerName = currentUser?.name || currentUser?.officer || 'Authority Command';

  const [selectedTaskId, setSelectedTaskId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Collect all roster entries across tasks
  const allVolunteers = (volunteerTasks || []).flatMap((task) =>
    (task.roster || []).map((vol) => ({
      ...vol,
      taskId: task.id,
      taskTitle: task.title,
      sector: task.sector,
      location: task.location,
    }))
  );

  const filteredVolunteers = allVolunteers.filter((vol) => {
    const matchesTask = selectedTaskId === 'ALL' || vol.taskId === selectedTaskId;
    const matchesStatus = statusFilter === 'ALL' || vol.attendanceStatus === statusFilter;
    const matchesSearch =
      vol.citizenName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vol.citizenPhone?.includes(searchQuery) ||
      vol.taskTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTask && matchesStatus && matchesSearch;
  });

  const totalCount = allVolunteers.length;
  const pendingCount = allVolunteers.filter((v) => v.attendanceStatus === 'PENDING').length;
  const attendedCount = allVolunteers.filter((v) => v.attendanceStatus === 'ATTENDED').length;
  const noShowCount = allVolunteers.filter((v) => v.attendanceStatus === 'NO_SHOW').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  DISASTER RELIEF ROSTER
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h2 className="text-sm sm:text-base font-black text-white">
                Volunteer Attendance & Verification
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 border-b border-slate-200 text-center">
          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Total Signups</p>
            <p className="text-base font-black text-slate-900">{totalCount}</p>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 shadow-2xs">
            <p className="text-[10px] font-bold text-amber-700 uppercase">Pending Check-in</p>
            <p className="text-base font-black text-amber-900">{pendingCount}</p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Attended (+100)</p>
            <p className="text-base font-black text-emerald-900">{attendedCount}</p>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 shadow-2xs">
            <p className="text-[10px] font-bold text-rose-700 uppercase">Did Not Come (0)</p>
            <p className="text-base font-black text-rose-900">{noShowCount}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-slate-200 flex flex-wrap gap-2 items-center justify-between bg-white text-xs">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search volunteer name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 text-xs focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">⏳ Pending Only</option>
              <option value="ATTENDED">✅ Attended</option>
              <option value="NO_SHOW">❌ Did Not Come</option>
            </select>

            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="px-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 text-xs max-w-[140px] truncate focus:outline-none"
            >
              <option value="ALL">All Missions</option>
              {(volunteerTasks || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Volunteer List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/50">
          {filteredVolunteers.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Volunteer Signups Found</p>
              <p className="text-xs text-slate-400">
                Volunteers who register through the Citizen Portal will appear here for on-site verification.
              </p>
            </div>
          ) : (
            filteredVolunteers.map((vol) => (
              <div
                key={vol.id}
                className={`p-4 bg-white rounded-2xl border transition-all shadow-2xs space-y-3 ${
                  vol.attendanceStatus === 'ATTENDED'
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : vol.attendanceStatus === 'NO_SHOW'
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(vol.citizenName)}`}
                      alt={vol.citizenName}
                      className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-900">{vol.citizenName}</h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          {vol.signedUpAt}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <a
                          href={`tel:${vol.citizenPhone}`}
                          className="font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {vol.citizenPhone}
                        </a>
                        <span>•</span>
                        <span className="font-semibold text-slate-600 truncate max-w-[180px]">
                          {vol.taskTitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Current Status Badge */}
                  <div>
                    {vol.attendanceStatus === 'ATTENDED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-black">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Attended (+100 Pts)
                      </span>
                    ) : vol.attendanceStatus === 'NO_SHOW' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-black">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Did Not Come (0 Pts)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>

                {/* Audit & Action Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2 text-xs">
                  <div className="text-[11px] text-slate-500">
                    {vol.verifiedBy ? (
                      <span>
                        Verified by: <strong>{vol.verifiedBy}</strong>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">
                        ⚠️ Points withheld until on-site attendance is confirmed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Mark Did Not Come / No-Show */}
                    <button
                      onClick={() =>
                        updateVolunteerAttendance(vol.taskId, vol.id, 'NO_SHOW', officerName)
                      }
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                        vol.attendanceStatus === 'NO_SHOW'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                      title="Citizen did not come — points will NOT be added to wallet"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Did Not Come</span>
                    </button>

                    {/* Mark Attended / Present */}
                    <button
                      onClick={() =>
                        updateVolunteerAttendance(vol.taskId, vol.id, 'ATTENDED', officerName)
                      }
                      className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 transition-all cursor-pointer ${
                        vol.attendanceStatus === 'ATTENDED'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                      }`}
                      title="Citizen came and completed shift — credit +100 points to wallet"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Attended</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500">
          <span>
            Anti-Fraud Protocol: Marking a volunteer as <strong>Did Not Come</strong> withholds or revokes their Karma Points.
          </span>
        </div>
      </div>
    </div>
  );
}
