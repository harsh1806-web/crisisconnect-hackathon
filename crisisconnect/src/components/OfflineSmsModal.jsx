import React, { useState } from 'react';
import { X, WifiOff, Send, Copy, Phone, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { generateSmsSosPayload, openNativeSms } from '../services/smsSosService';
import toast from 'react-hot-toast';

export default function OfflineSmsModal({ user, onClose }) {
  const [category, setCategory] = useState('RESCUE');
  const [urgency, setUrgency] = useState('CRITICAL');
  const [peopleCount, setPeopleCount] = useState(2);
  const [title, setTitle] = useState('Immediate Evacuation Assistance');

  const lat = user?.location?.lat || window.__NATIVE_GPS__?.lat || 19.0760;
  const lng = user?.location?.lng || window.__NATIVE_GPS__?.lng || 72.8777;
  const name = user?.name || 'Citizen';
  const phone = user?.phone || '';

  const smsBody = generateSmsSosPayload({
    lat,
    lng,
    category,
    urgency,
    peopleCount,
    title,
    name,
    phone,
  });

  const handleSendSms = () => {
    openNativeSms({
      recipient: '112',
      body: smsBody,
    });
    toast.success('Opening native SMS messaging app to 112 hotline!');
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(smsBody);
      toast.success('Compact emergency SOS payload copied!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 text-white w-full max-w-sm rounded-3xl border-2 border-amber-500 shadow-2xl overflow-hidden relative flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 p-4 border-b border-amber-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
              <WifiOff className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 block">
                BLACKOUT / CELL TOWER DOWN PROTOCOL
              </span>
              <h2 className="text-xs font-black text-white">
                Offline SMS Emergency SOS
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 leading-relaxed text-[11px]">
            <strong>Zero-Data Fallback:</strong> If 4G/5G mobile towers fail during severe weather, this broadcasts your precise GPS coordinates via standard SMS text to emergency rescue dispatchers at <strong>112</strong>.
          </div>

          {/* Incident Quick Details */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Emergency Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white outline-none"
                >
                  <option value="RESCUE">RESCUE / FLOOD</option>
                  <option value="MEDICAL">CRITICAL MEDICAL</option>
                  <option value="FIRE">FIRE / HAZMAT</option>
                  <option value="COLLAPSE">COLLAPSE / USAR</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">People Trapped</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Distress Summary</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rising water on rooftop, need boat"
                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-white outline-none"
              />
            </div>
          </div>

          {/* Generated Encoded Payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span>Encoded SMS String (To: 112)</span>
              <button onClick={handleCopy} className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <div className="p-3 bg-black/60 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300 break-all leading-relaxed select-all">
              {smsBody}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleSendSms}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/30 active:scale-98 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Launch SMS App to 112 Control Room</span>
            </button>

            <a
              href="tel:112"
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Emergency Voice Call (112)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
