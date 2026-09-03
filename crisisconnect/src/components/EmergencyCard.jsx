import { useState } from 'react';
import { AlertTriangle, Info, Bell, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';

export default function EmergencyCard({ broadcast }) {
  const { dismissBroadcast } = useCrisis();
  const [expanded, setExpanded] = useState(false);

  if (!broadcast) return null;

  const isCritical = broadcast.severity === 'critical';
  const isWarning = broadcast.severity === 'warning';

  return (
    <div
      className={`rounded-2xl p-4 md:p-5 border transition-all shadow-xs ${
        isCritical
          ? 'bg-rose-50/90 border-rose-300 text-rose-950'
          : isWarning
          ? 'bg-amber-50/90 border-amber-300 text-amber-950'
          : 'bg-blue-50/90 border-blue-200 text-blue-950'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isCritical
                ? 'bg-rose-600 text-white animate-pulse'
                : isWarning
                ? 'bg-amber-500 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {isCritical ? (
              <AlertTriangle className="w-6 h-6" />
            ) : isWarning ? (
              <Bell className="w-6 h-6" />
            ) : (
              <Info className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                  isCritical
                    ? 'bg-rose-200 text-rose-800'
                    : isWarning
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-blue-200 text-blue-900'
                }`}
              >
                {broadcast.severity} ALERT
              </span>
              <span className="text-xs text-slate-500 font-medium">{broadcast.timestamp}</span>
            </div>

            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {broadcast.title}
            </h4>

            <p className="text-sm text-slate-700 mt-1 leading-relaxed">
              {broadcast.message}
            </p>

            {/* Quick Action links */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {broadcast.actionLink && (
                <Link
                  to={broadcast.actionLink}
                  className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-white shadow-xs transition-colors ${
                    isCritical
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {broadcast.actionLabel || 'View Action'} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}

              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
              >
                {expanded ? 'Hide Safety Steps' : 'View Safety Protocols'}
              </button>
            </div>

            {/* Expanded Safety Checklist */}
            {expanded && (
              <div className="mt-4 p-3 bg-white/80 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-800 animate-fade-in">
                <p className="font-bold text-slate-900">Recommended Action Steps:</p>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Prepare emergency go-bag (drinking water, medicines, battery torch, documents).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Avoid walking or driving through moving flood water. 6 inches can knock you down.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Switch off main electrical breakers if water enters living areas.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => dismissBroadcast(broadcast.id)}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          title="Dismiss advisory"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
