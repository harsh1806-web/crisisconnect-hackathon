import React, { useState } from 'react';
import { X, Users, MapPin, Clock, Phone, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthorityMobilizeVolunteersModal({ authority, onPublish, onClose }) {
  const [title, setTitle] = useState('');
  const [sector, setSector] = useState('RELIEF AID');
  const [location, setLocation] = useState('');
  const [volunteersNeeded, setVolunteersNeeded] = useState(10);
  const [timeRequired, setTimeRequired] = useState('2 - 3 Hours');
  const [requirements, setRequirements] = useState('');
  const [coordinator, setCoordinator] = useState(authority?.name || 'Disaster Operations Lead');
  const [coordinatorPhone, setCoordinatorPhone] = useState(authority?.hotline || '112');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter mission title.');
      return;
    }
    if (!location.trim()) {
      toast.error('Please specify assembly location.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTask = {
        id: `task-auth-${Date.now()}`,
        title: title.trim(),
        sector,
        description: `${title.trim()}. Official task mobilized by ${authority?.shortName || 'Disaster Command'}.`,
        location: location.trim(),
        timeRequired,
        volunteersNeeded: Number(volunteersNeeded) || 10,
        volunteersSignedUp: 0,
        coordinator,
        coordinatorPhone,
        requirements: requirements.trim() || 'Civic duty in safe zone',
        isAuthorityMobilized: true,
        userRegistered: false,
      };

      await onPublish(newTask);
      toast.success(`📢 Volunteer task published! Broadcasted live to all citizen phones.`);
      onClose();
    } catch (err) {
      toast.error('Failed to publish task: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 block">
                CIVIC MOBILIZATION
              </span>
              <h2 className="text-base font-black text-white">
                Mobilize Citizen Volunteers
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-950 leading-relaxed">
            <strong className="block text-blue-900 mb-0.5">Real-Time Broadcast:</strong>
            Publishing this mission alerts connected citizens in safe perimeters and populates on their Volunteering Hub instantly.
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Mission Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unload 500 Water Crates & Ration Kits at Sector 4"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Sector Category</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="RELIEF AID">RELIEF AID</option>
                <option value="HEALTHCARE">HEALTHCARE</option>
                <option value="RESCUE">RESCUE ESCORT</option>
                <option value="COMMUNICATIONS">COMMUNICATIONS</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Volunteers Needed</label>
              <input
                type="number"
                min="1"
                max="100"
                value={volunteersNeeded}
                onChange={(e) => setVolunteersNeeded(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Assembly Point / Location *</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Community Center Relief Hub, Gate 2"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Shift Duration</label>
              <input
                type="text"
                value={timeRequired}
                onChange={(e) => setTimeRequired(e.target.value)}
                placeholder="e.g. 3 Hours"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Coordinator Hotline</label>
              <input
                type="text"
                value={coordinatorPhone}
                onChange={(e) => setCoordinatorPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Volunteer Requirements (Optional)</label>
            <input
              type="text"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="e.g. Able to lift boxes, rain boots recommended"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-blue-500/30"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Broadcasting Mission...' : 'Publish Volunteer Call to Citizens'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
