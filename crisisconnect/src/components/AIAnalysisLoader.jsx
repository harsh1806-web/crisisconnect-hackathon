import { useState, useEffect } from 'react';
import { Bot, CheckCircle, Sparkles } from 'lucide-react';

const ANALYSIS_STEPS = [
  'Understanding the situation',
  'Detecting emergency type',
  'Evaluating severity',
  'Calculating priority',
  'Identifying the responsible authority',
  'Generating tracking token',
];

export default function AIAnalysisLoader({ onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Step progression every ~450ms
    if (currentStepIndex < ANALYSIS_STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 420);
      return () => clearTimeout(timer);
    } else {
      // Completed all steps, wait brief moment then trigger onComplete
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 350);
      return () => clearTimeout(finishTimer);
    }
  }, [currentStepIndex, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white space-y-6 text-center">
        {/* Animated AI Brain Icon */}
        <div className="relative mx-auto w-16 h-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
            <Bot className="w-9 h-9 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-900">
            <Sparkles className="w-3 h-3 text-white animate-spin" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <h2 className="text-lg font-black tracking-tight text-white flex items-center justify-center gap-2">
            CrisisConnect AI is analyzing your emergency
          </h2>
          <p className="text-xs text-slate-400">
            Applying real-time situational intelligence and routing algorithms...
          </p>
        </div>

        {/* Progressive Steps Checklist */}
        <div className="bg-slate-950/70 rounded-2xl border border-slate-800/80 p-4 space-y-3 text-left">
          {ANALYSIS_STEPS.map((step, idx) => {
            const isDone = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div
                key={step}
                className={`flex items-center gap-3 text-xs transition-all duration-300 ${
                  isDone
                    ? 'text-emerald-400 font-semibold'
                    : isCurrent
                    ? 'text-white font-bold translate-x-1'
                    : 'text-slate-600'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {isDone ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 animate-scale-in" />
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  )}
                </div>

                <span>{step}</span>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 font-mono tracking-wider">
          AI MODEL INFERENCE: {Math.min(100, Math.round((currentStepIndex / ANALYSIS_STEPS.length) * 100))}% COMPLETE
        </div>
      </div>
    </div>
  );
}
