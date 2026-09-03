import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Bot,
  Copy,
  CheckCircle,
  Clock,
  ArrowRight,
  Home,
  Check,
  Edit3,
} from 'lucide-react';
import { CATEGORY_OPTIONS } from '../services/mockEmergencyAnalysis';
import { useCrisis } from '../context/CrisisContext';
import toast from 'react-hot-toast';

export default function EmergencyResult() {
  const location = useLocation();
  const { addUpdateToRequest } = useCrisis();

  // Retrieve payload from router navigation state or fallback
  const state = location.state || {};
  const initialAI = state.aiResult || {
    category: 'Fire Emergency',
    categoryId: 'fire',
    severity: 'Critical',
    priority: 'P1',
    priorityLabel: 'P1 — Immediate Response Required',
    authority: 'Fire & Emergency Services',
    trackingToken: 'CC-84729X',
    confidenceScore: '94%',
  };

  const createdReq = state.createdReq || { id: 'req-demo' };

  const [aiData, setAiData] = useState(initialAI);
  const [copied, setCopied] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleCopyToken = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(aiData.trackingToken);
      setCopied(true);
      toast.success(`Token ${aiData.trackingToken} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleConfirmCorrect = () => {
    setIsConfirmed(true);
    toast.success('AI classification confirmed by user.');
    addUpdateToRequest(
      createdReq.id,
      `Citizen confirmed AI routing: ${aiData.category} (${aiData.priorityLabel})`,
      'Citizen'
    );
  };

  const handleOverrideCategory = (cat) => {
    setAiData((prev) => ({
      ...prev,
      category: cat.name,
      categoryId: cat.id,
      authority: cat.authority,
      priority: cat.priority,
      priorityLabel: `${cat.priority} — ${cat.priority === 'P1' ? 'Immediate Response Required' : cat.priority === 'P2' ? 'Urgent Police / Hazard Response' : 'General Support'}`,
    }));

    setIsEditingCategory(false);
    setIsConfirmed(true);
    toast.success(`Category manually corrected to: ${cat.name}`);

    addUpdateToRequest(
      createdReq.id,
      `Citizen corrected category to: ${cat.name} (Assigned authority: ${cat.authority})`,
      'Citizen'
    );
  };

  const getPriorityBadgeClass = (p) => {
    switch (p) {
      case 'P1':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'P2':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'P3':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5 pb-24 animate-fade-in">
      {/* Top Banner */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-1">
          <Bot className="w-3.5 h-3.5" />
          <span>Emergency Analysis Complete</span>
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">AI Incident Assessment</h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          CrisisConnect AI has processed your description, determined severity, and routed the incident.
        </p>
      </div>

      {/* Primary AI Assessment Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl space-y-5">
        {/* Detected Emergency Category */}
        <div className="space-y-1 text-center pb-3 border-b border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Detected Emergency
          </span>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {aiData.category}
            </h2>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {aiData.confidenceScore || '92%'} AI Match Confidence
          </span>
        </div>

        {/* Severity & Priority Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Severity</span>
            <div className="flex items-center justify-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${aiData.severity === 'Critical' ? 'bg-red-600 animate-ping' : 'bg-amber-500'}`} />
              <span className="text-sm font-black text-slate-900">{aiData.severity}</span>
            </div>
            <span className="text-[10px] text-slate-500 block">Assessed Hazard</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Priority</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black border ${getPriorityBadgeClass(aiData.priority)}`}>
              {aiData.priority}
            </span>
            <p className="text-[10px] font-semibold text-slate-600 line-clamp-1">
              {aiData.priority === 'P1' ? 'Immediate Response' : 'Urgent Dispatch'}
            </p>
          </div>
        </div>

        {/* Recommended Authority */}
        <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-1 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
            Responsible Response Authority
          </span>
          <p className="text-sm font-black text-slate-900">{aiData.authority}</p>
          <p className="text-[10px] text-blue-800">
            Emergency alert dispatched to duty dispatch unit
          </p>
        </div>

        {/* Tracking Token */}
        <div className="p-4 bg-slate-950 text-white rounded-2xl text-center space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Official Tracking Token
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-black text-red-400 tracking-wider">
              {aiData.trackingToken}
            </span>
            <button
              onClick={handleCopyToken}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copy token"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Keep this tracking token to view real-time updates and speak to responders.
          </p>
        </div>

        {/* Reassurance text */}
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs text-emerald-900 font-semibold flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Your emergency has been registered and routed for verification.</span>
        </div>
      </div>

      {/* IMPORTANT AI CORRECTION SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-900">Is this AI classification correct?</p>
            <p className="text-[10px] text-slate-500">You can override if the AI misinterpreted</p>
          </div>
          {isConfirmed && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" /> Confirmed
            </span>
          )}
        </div>

        {!isEditingCategory ? (
          <div className="flex gap-2">
            <button
              onClick={handleConfirmCorrect}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
            >
              ✓ Yes, Correct
            </button>
            <button
              onClick={() => setIsEditingCategory(true)}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Change Category</span>
            </button>
          </div>
        ) : (
          /* Category Override Selection Grid */
          <div className="space-y-2 pt-1 animate-fade-in">
            <p className="text-[11px] font-semibold text-slate-600">Select correct emergency type:</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleOverrideCategory(cat)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold cursor-pointer transition-all ${
                    aiData.categoryId === cat.id
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="truncate">{cat.name}</p>
                  <span className="text-[9px] text-slate-400 block font-normal">{cat.priority}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsEditingCategory(false)}
              className="text-[11px] text-slate-500 underline font-semibold mt-1"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Primary Navigation Actions */}
      <div className="space-y-2 pt-1">
        <Link
          to={`/user/track/${createdReq.id || aiData.trackingToken}`}
          className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Clock className="w-4 h-4" />
          <span>TRACK EMERGENCY STATUS</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <Link
          to="/user/dashboard"
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Home className="w-3.5 h-3.5" /> Return Home
        </Link>
      </div>
    </div>
  );
}
