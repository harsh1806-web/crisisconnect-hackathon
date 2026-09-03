import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  AlertOctagon,
  ShieldCheck,
  Send,
  Phone,
  MapPin,
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';
import { useAuth } from '../../context/AuthContext';

export default function UserTrackStatus() {
  const { id } = useParams();
  const { requests, addUpdateToRequest } = useCrisis();
  const { currentUser } = useAuth();
  const [msgText, setMsgText] = useState('');

  // Find request by id or trackingCode
  const request =
    requests.find((r) => r.id === id || r.trackingCode === id) || requests[0];

  if (!request) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertOctagon className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Incident Not Found</h2>
        <Link
          to="/user/dashboard"
          className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isVerified =
    (request.verificationStatus || '').toLowerCase() === 'verified' ||
    (request.status || '').toLowerCase() === 'verified';
  const isRejected =
    (request.verificationStatus || '').toLowerCase() === 'rejected' ||
    (request.status || '').toLowerCase() === 'rejected';
  const isAssigned =
    (request.status || '').toLowerCase() === 'assigned' || !!request.assignedNGO;
  const isInProgress =
    (request.status || '').toLowerCase() === 'in_progress';
  const isResolved =
    (request.status || '').toLowerCase() === 'resolved';

  const pipelineSteps = [
    {
      title: '1. Request Submitted',
      status: 'completed',
      time: 'Logged',
      desc: 'Dispatched to Emergency Operations Command.',
    },
    {
      title: '2. Authority Review',
      status: isRejected
        ? 'rejected'
        : isVerified || isAssigned || isInProgress || isResolved
        ? 'completed'
        : 'current',
      time: isRejected ? 'Rejected' : isVerified ? 'Verified' : 'Under Review',
      desc: isRejected
        ? `Reason: ${request.rejectionReason || 'Duplicate / Invalid information'}`
        : isVerified
        ? 'Approved by Disaster Management Authority.'
        : 'Civil defense verifying incident urgency.',
    },
    {
      title: '3. Volunteer / NGO Assigned',
      status: isAssigned || isInProgress || isResolved
        ? 'completed'
        : isRejected
        ? 'skipped'
        : 'pending',
      time: request.assignedNGO ? request.assignedNGO.name : 'Pending Assignment',
      desc: request.assignedNGO
        ? `Squad assigned: ${request.assignedNGO.leader || 'Field Team'} (${request.assignedNGO.phone || ''})`
        : 'Assigning nearest verified rescue unit.',
    },
    {
      title: '4. Rescue Team En Route',
      status: isInProgress || isResolved ? 'completed' : 'pending',
      time: isInProgress ? 'En Route' : 'Awaiting Departure',
      desc: isInProgress
        ? 'Responders are navigating to your GPS location.'
        : 'Team prepping equipment and route.',
    },
    {
      title: '5. Resolved & Safe',
      status: isResolved ? 'completed' : 'pending',
      time: isResolved ? 'Completed' : 'Pending Resolution',
      desc: isResolved
        ? 'Citizens evacuated / emergency supplies delivered.'
        : 'Final safety clearance.',
    },
  ];

  const handleSendUpdate = (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    addUpdateToRequest(request.id, msgText, currentUser?.name || 'Citizen');
    setMsgText('');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/user/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">
              Live Status Tracking
            </h1>
            <p className="text-[11px] font-mono font-bold text-red-600">
              Ref: {request.trackingCode || request.id}
            </p>
          </div>
        </div>

        <Link
          to={`https://www.google.com/maps/search/?api=1&query=${request.lat},${request.lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
          title="Open Map"
        >
          <MapPin className="w-4 h-4 text-red-500" />
        </Link>
      </div>

      {/* Incident Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase bg-slate-100 text-slate-800">
            {request.category}
          </span>
          <span
            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
              isResolved
                ? 'bg-emerald-100 text-emerald-800'
                : isRejected
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {request.status.replace('_', ' ')}
          </span>
        </div>

        <h2 className="text-base font-bold text-slate-900 leading-snug">{request.title}</h2>
        <p className="text-xs text-slate-500 line-clamp-2">{request.description}</p>
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400" /> {request.locationName}
        </p>
      </div>

      {/* Assigned Volunteer / NGO Details Card (If assigned) */}
      {request.assignedNGO && (
        <div className="bg-emerald-50/80 rounded-3xl border border-emerald-200 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Assigned Response Unit
            </span>
            <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
              Official NGO
            </span>
          </div>

          <h3 className="font-bold text-sm text-slate-900">{request.assignedNGO.name}</h3>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 pt-1">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Squad Lead:</span>
              <span className="font-semibold">{request.assignedNGO.leader || 'Rescue Team'}</span>
            </div>
            {request.assignedNGO.vehicle && (
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Vehicle / Boat:</span>
                <span className="font-semibold">{request.assignedNGO.vehicle}</span>
              </div>
            )}
          </div>

          {request.assignedNGO.phone && (
            <div className="pt-2">
              <a
                href={`tel:${request.assignedNGO.phone}`}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call Squad ({request.assignedNGO.phone})
              </a>
            </div>
          )}
        </div>
      )}

      {/* Progress Pipeline Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Authority & Rescue Pipeline
        </h3>

        <div className="space-y-4 relative pl-3 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {pipelineSteps.map((step, idx) => {
            const isDone = step.status === 'completed';
            const isRej = step.status === 'rejected';
            const isCurr = step.status === 'current';

            return (
              <div key={idx} className="relative flex items-start gap-3 text-xs">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-[10px] font-bold ${
                    isDone
                      ? 'bg-emerald-600'
                      : isRej
                      ? 'bg-red-600'
                      : isCurr
                      ? 'bg-blue-600 animate-pulse'
                      : 'bg-slate-300 text-slate-500'
                  }`}
                >
                  {isDone ? '✓' : isRej ? '✕' : idx + 1}
                </div>

                <div className="flex-1 -mt-0.5">
                  <div className="flex items-center justify-between">
                    <p className={`font-bold ${isDone ? 'text-slate-900' : isRej ? 'text-red-600' : isCurr ? 'text-blue-700' : 'text-slate-400'}`}>
                      {step.title}
                    </p>
                    <span className="text-[10px] text-slate-400">{step.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 6 in flow: Receive Updates & Send Information */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Live Communications & Updates Log
        </h3>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {request.updates && request.updates.length > 0 ? (
            request.updates.map((up) => (
              <div key={up.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-900 text-[11px]">{up.author}</span>
                  <span className="text-[9px] text-slate-400">{up.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">{up.text}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No updates logged yet.</p>
          )}
        </div>

        {/* Send message update form */}
        <form onSubmit={handleSendUpdate} className="flex gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="Send update to responders..."
            className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer"
            title="Post update"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
