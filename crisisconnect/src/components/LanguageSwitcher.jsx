import React, { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher({ variant = 'compact' }) {
  const { currentLang, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const activeLanguage = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <div className="relative inline-block text-left z-40">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
          variant === 'dark'
            ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-xs'
            : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-xs'
        }`}
        title="Change Language / भाषा बदलें"
      >
        <span className="text-sm">{activeLanguage.flag}</span>
        <span className="font-bold">{activeLanguage.native}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-2xl border border-slate-200 py-1.5 z-50 animate-fade-in divide-y divide-slate-100">
            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Select Language / भाषा
            </div>

            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer ${
                    currentLang === lang.code
                      ? 'bg-red-50/70 text-red-700 font-black'
                      : 'text-slate-700 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <div>
                      <div className="font-bold">{lang.native}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{lang.label}</div>
                    </div>
                  </div>
                  {currentLang === lang.code && (
                    <Check className="w-4 h-4 text-red-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
