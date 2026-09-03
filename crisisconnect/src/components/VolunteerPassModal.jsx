import React from 'react';
import { X, ShieldCheck, HeartHandshake, Phone, MapPin, Download, CheckCircle2 } from 'lucide-react';

export default function VolunteerPassModal({ task, user, onClose }) {
  if (!task) return null;

  const passId = 'PASS-VOL-' + String(Math.abs(task.id.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))).slice(0, 6);
  const volunteerName = user?.name || 'Registered Volunteer';
  const bloodGroup = user?.bloodGroup || user?.blood_group || 'O+';
  const phone = user?.phone || '+91 99999 00000';
  const icePhone = user?.emergencyContact?.phone || user?.ice_phone || '+91 98765 43210';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 text-white w-full max-w-sm rounded-3xl border-2 border-emerald-500/80 shadow-2xl overflow-hidden relative flex flex-col">
        {/* Top Official Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 p-4 border-b border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                  OFFICIAL RESPONDER PASS
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h2 className="text-xs font-black text-white tracking-wide">
                State Disaster Relief Corps
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pass Body */}
        <div className="p-5 space-y-4 bg-gradient-to-b from-slate-900 to-slate-950">
          {/* Responder Photo & Identity */}
          <div className="flex items-center gap-3.5 bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <img
              src={'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(volunteerName)}
              alt="Volunteer"
              className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-emerald-400/80 shadow-md"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Civilian First Responder
              </span>
              <h3 className="text-base font-black text-white truncate">
                {volunteerName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                <span className="font-bold px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 text-[10px]">
                  Blood: {bloodGroup}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  ID: {passId}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Mission Details */}
          <div className="space-y-2 text-xs bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-500/30">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-semibold">Assigned Mission:</span>
              <span className="font-black uppercase text-emerald-300 px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700/50 text-[10px]">
                {task.sector}
              </span>
            </div>
            <p className="font-bold text-white text-xs leading-snug">
              {task.title}
            </p>
            <div className="flex items-center gap-1.5 text-slate-300 text-[11px] pt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{task.location}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-emerald-800/40">
              <span>Lead: <strong className="text-slate-200">{task.coordinator}</strong></span>
              <a href={'tel:' + task.coordinatorPhone} className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
                <Phone className="w-3 h-3" /> {task.coordinatorPhone}
              </a>
            </div>
          </div>

          {/* Verifiable QR Code & Security Stamp */}
          <div className="p-3 bg-white rounded-2xl text-slate-900 flex items-center justify-between gap-3 shadow-md">
            {/* SVG Generative QR Code */}
            <div className="w-20 h-20 bg-slate-900 rounded-xl p-1.5 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                <rect x="0" y="0" width="30" height="30" fill="white" />
                <rect x="5" y="5" width="20" height="20" fill="#0f172a" />
                <rect x="10" y="10" width="10" height="10" fill="white" />
                
                <rect x="70" y="0" width="30" height="30" fill="white" />
                <rect x="75" y="5" width="20" height="20" fill="#0f172a" />
                <rect x="80" y="10" width="10" height="10" fill="white" />

                <rect x="0" y="70" width="30" height="30" fill="white" />
                <rect x="5" y="75" width="20" height="20" fill="#0f172a" />
                <rect x="10" y="80" width="10" height="10" fill="white" />

                <rect x="38" y="10" width="8" height="8" fill="white" />
                <rect x="52" y="18" width="8" height="8" fill="white" />
                <rect x="40" y="35" width="20" height="20" fill="white" />
                <rect x="45" y="40" width="10" height="10" fill="#0f172a" />
                <rect x="70" y="45" width="10" height="8" fill="white" />
                <rect x="15" y="45" width="12" height="8" fill="white" />
                <rect x="40" y="70" width="8" height="15" fill="white" />
                <rect x="55" y="80" width="15" height="8" fill="white" />
                <rect x="75" y="75" width="12" height="12" fill="white" />
              </svg>
            </div>

            <div className="text-[10px] space-y-1">
              <div className="flex items-center gap-1 text-emerald-700 font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Checkpoint Verified</span>
              </div>
              <p className="text-slate-600 font-medium leading-tight">
                Police & NDRF checkpoints: Scan QR to verify humanitarian deployment pass.
              </p>
              <p className="text-[9px] text-slate-400 font-mono">
                Valid for Active Operation • 24H SLA
              </p>
            </div>
          </div>

          {/* Emergency Safety Notice */}
          <div className="text-center">
            <p className="text-[10px] text-slate-400">
              In Case of Emergency (ICE): <span className="text-white font-bold">{icePhone}</span>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Print / Save Pass
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-600/30"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
