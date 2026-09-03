import React, { useState } from 'react';
import { Globe, Check, ChevronDown, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher({ variant = 'compact' }) {
  const { currentLang, setLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const activeLanguage = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
          variant === 'dark'
            ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
        }`}
        title="Change Language / भाषा बदलें"
      >
        <span className="text-sm leading-none">{activeLanguage.flag}</span>
        <span className="font-bold tracking-tight">{activeLanguage.native}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {/* Unclipped Modal for Language Selection */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-900 w-full max-w-xs rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative animate-scale-up">
            {/* Header */}
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-sm font-black text-white">
                    {t('select_language')}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language List */}
            <div className="p-3 space-y-1 max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
              {languages.map((lang) => {
                const isSelected = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-2xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-50 text-red-700 font-black border border-red-200 shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{lang.native}</div>
                        <div className="text-[11px] text-slate-500">{lang.label}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
