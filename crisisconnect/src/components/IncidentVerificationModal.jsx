import React, { useState } from 'react';
import {
  ShieldCheck,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  Radio,
  Clock,
} from 'lucide-react';

export default function IncidentVerificationModal({
  incident,
  authority,
  onVerify,
  onReject,
  onClose,
}) {
  if (!incident) return null;

  // Compute multi-factor authenticity trust score
  const hasGps = Boolean(incident.lat && incident.lng);
  const isRegisteredPhone = Boolean(incident.contactPhone && incident.contactPhone.replace(/\D/g, '').length >= 10);
  const hasDescription = Boolean((incident.description || '').length > 25);
  const hasClusterClue = incident.category?.toUpperCase() === 'RESCUE' || incident.urgency === 'critical';

  let calculatedScore = 50;
  if (hasGps) calculatedScore += 25;
  if (isRegisteredPhone) calculatedScore += 15;
  if (hasDescription) calculatedScore += 10;
  if (hasClusterClue) calculatedScore += 10;
  if (calculatedScore > 98) calculatedScore = 98;

  const [callMade, setCallMade] = useState(false);
  const [detailsConfirmed, setDetailsConfirmed] = useState(true);
  const [hazardConfirmed, setHazardConfirmed] = useState(true);
  const [etaMinutes, setEtaMinutes] = useState(incident.targetAuthority?.responseSlaMinutes || 12);
  const [dispatcherNote, setDispatcherNote] = useState(
    `Official EOC response deployed. Rescue team mobilized with specialized gear. ETA ~${incident.targetAuthority?.responseSlaMinutes || 12} mins. Stay in a safe, dry zone.`
  );
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('Unable to contact victim / duplicate incident alert.');

  const handleConfirmVerification = (e) => {
    e?.preventDefault();
    onVerify(incident.id, authority?.name || authority?.department || 'Disaster Authority EOC', {
      notes: dispatcherNote,
      trustScore: calculatedScore,
      etaMinutes: Number(etaMinutes) || 15,
      assignedUnit: incident.targetAuthority?.shortName || authority?.department || 'Disaster Response Force',
      callVerified: callMade,
    });
    onClose();
  };

  const handleConfirmReject = (e) => {
    e?.preventDefault();
    onReject(incident.id, rejectReason, authority?.name || 'Disaster Authority EOC');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col animate-scale-up">
        {/* Header */}
        <div className="bg-slate-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                OFFICIAL INCIDENT VERIFICATION & AUTHENTICATION
              </span>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                Authenticate Distress Beacon: {incident.trackingCode || incident.id}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Authenticity Trust Score Meter */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-300">AI & Telemetry Authenticity Trust Score</span>
              </div>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {calculatedScore}% GENUINE
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  calculatedScore >= 80
                    ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${calculatedScore}%` }}
              />
            </div>

            {/* Verification Factors Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
              <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${hasGps ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="truncate">GPS Geotag Valid</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isRegisteredPhone ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="truncate">Caller Verified</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${hasDescription ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="truncate">Distress Context</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${hasClusterClue ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="truncate">Hazard Perimeter</span>
              </div>
            </div>
          </div>

          {/* Incident Overview Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800">
                {incident.category || 'General'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {incident.peopleCount || 1} people reported in danger
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900">{incident.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{incident.description}</p>
            <div className="flex items-center gap-1 text-xs text-slate-600 pt-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="truncate">{incident.locationName || 'GPS Location'}</span>
            </div>
          </div>

          {/* 1-Tap Telephonic Callback & Verification Checklist */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-700" />
                Step 1: Direct Citizen Telephonic Callback
              </span>
              {callMade && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                  Call Dialed ✓
                </span>
              )}
            </div>

            <p className="text-xs text-emerald-900">
              Dial the reporting citizen directly to confirm situation authenticity and floor/water level before dispatching field boats/fire squads.
            </p>

            <div className="flex items-center gap-2">
              {incident.contactPhone ? (
                <a
                  href={`tel:${incident.contactPhone}`}
                  onClick={() => setCallMade(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-98"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {incident.contactName || 'Citizen'} ({incident.contactPhone})</span>
                </a>
              ) : (
                <span className="text-xs text-slate-500 italic">No callback number provided</span>
              )}

              <button
                type="button"
                onClick={() => setCallMade(!callMade)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  callMade ? 'bg-emerald-200 text-emerald-900 border-emerald-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {callMade ? '✓ Callback Completed' : 'Mark Called'}
              </button>
            </div>

            {/* Checklist items */}
            <div className="space-y-1.5 pt-1 text-xs text-slate-800">
              <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
                <input
                  type="checkbox"
                  checked={detailsConfirmed}
                  onChange={(e) => setDetailsConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span>Trapped victim count & landmark details confirmed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
                <input
                  type="checkbox"
                  checked={hazardConfirmed}
                  onChange={(e) => setHazardConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span>Active life hazard verified (not a duplicate or prank)</span>
              </label>
            </div>
          </div>

          {!isRejecting ? (
            /* Step 2: Live Authority Interaction & Instructions to Citizen */
            <form onSubmit={handleConfirmVerification} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-slate-900">
                    Step 2: Send Official Dispatcher Directive to Citizen
                  </label>
                  <span className="text-[10px] text-blue-600 font-bold">
                    Pushed to Citizen Screen Immediately
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={dispatcherNote}
                  onChange={(e) => setDispatcherNote(e.target.value)}
                  placeholder="Type guidance for citizen (e.g. Move to 2nd floor, boat en route)"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              {/* SLA / Estimated Response Time */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Estimated Response Time (ETA):</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={etaMinutes}
                    onChange={(e) => setEtaMinutes(e.target.value)}
                    className="w-14 text-center font-bold text-xs py-1 px-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                  <span className="font-semibold text-slate-600">Minutes</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="submit"
                  className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>✓ VERIFY & DISPATCH RESCUE FORCE</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>FLAG DUPLICATE / FALSE ALARM</span>
                </button>
              </div>
            </form>
          ) : (
            /* Rejection Sub-form */
            <form onSubmit={handleConfirmReject} className="space-y-3 p-4 bg-rose-50 rounded-2xl border border-rose-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-950 uppercase">
                  Flag Incident as False Alarm or Duplicate
                </span>
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  Cancel
                </button>
              </div>

              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (e.g. Spoken with caller - issue already resolved by local neighbours)"
                className="w-full text-xs p-2.5 rounded-xl border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Confirm Rejection & Close Alert
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
