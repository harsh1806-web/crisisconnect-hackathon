import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Bell, ShieldCheck, CheckCircle2, AlertTriangle, X, Compass } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmergencyPermissionsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [locStatus, setLocStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [notifStatus, setNotifStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [isRequesting, setIsRequesting] = useState(false);

  const hasDismissedRef = useRef(false);
  const timerRef = useRef(null);

  const isAlreadyDismissed = () => {
    if (hasDismissedRef.current) return true;
    try {
      return (
        localStorage.getItem('crisisconnect_perms_dismissed') === 'true' ||
        sessionStorage.getItem('crisisconnect_perms_dismissed') === 'true'
      );
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (isAlreadyDismissed()) return;

    // Check Notification status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotifStatus('granted');
      } else if (Notification.permission === 'denied') {
        setNotifStatus('denied');
      } else {
        setNotifStatus('prompt');
      }
    }

    // Check Geolocation status
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocStatus(result.state);
      }).catch(() => {});
    }

    // Single one-time timer to prompt only if permissions are missing and not dismissed
    timerRef.current = setTimeout(() => {
      if (isAlreadyDismissed()) return;

      const needsNotif = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default';
      const needsLoc = locStatus !== 'granted';

      if (needsNotif || needsLoc) {
        setIsOpen(true);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleGrantPermissions = async () => {
    setIsRequesting(true);

    // 1. Request Notification Permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const nPerm = await Notification.requestPermission();
        setNotifStatus(nPerm);
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }

    // 2. Request Geolocation Permission
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocStatus('granted');
          setIsRequesting(false);
          handleDismiss();
          toast.success('✅ Location & Notifications activated for emergency response!');
        },
        (err) => {
          setLocStatus('denied');
          setIsRequesting(false);
          handleDismiss();
          toast('📍 Location access paused. You can still type your address or browse the map manually.', {
            icon: 'ℹ️',
            duration: 4000,
          });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setIsRequesting(false);
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    hasDismissedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
    try {
      localStorage.setItem('crisisconnect_perms_dismissed', 'true');
      sessionStorage.setItem('crisisconnect_perms_dismissed', 'true');
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up relative">
        {/* Close Cross button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Dismiss permissions prompt"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="text-lg font-black text-slate-900 leading-tight">
            Enable Emergency Services
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            CrisisConnect uses your device sensors to pinpoint disaster relief and send life-saving audio broadcast sirens.
          </p>
        </div>

        {/* Permissions Checklist */}
        <div className="space-y-2.5 pt-2">
          {/* Location item */}
          <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Live GPS Coordinates</p>
                <p className="text-[10px] text-slate-500">Auto-routes nearest police & medical teams</p>
              </div>
            </div>
            {locStatus === 'granted' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : locStatus === 'denied' ? (
              <span className="text-[10px] font-bold text-slate-400">Manual</span>
            ) : (
              <span className="text-[10px] font-bold text-amber-600">Needed</span>
            )}
          </div>

          {/* Notifications item */}
          <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Audio Siren & Pop-ups</p>
                <p className="text-[10px] text-slate-500">Critical evacuation & flood warnings</p>
              </div>
            </div>
            {notifStatus === 'granted' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <span className="text-[10px] font-bold text-amber-600">Needed</span>
            )}
          </div>
        </div>

        {/* Fallback explanation if user prefers manual */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-snug text-center">
          💡 If location is not allowed, you can still type your address manually and browse all relief centers on the map.
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleGrantPermissions}
            disabled={isRequesting}
            className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isRequesting ? (
              <span>Activating Sensors...</span>
            ) : (
              <span>Allow Location & Alerts</span>
            )}
          </button>

          <button
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 rounded-2xl text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer text-center"
          >
            Continue with Manual Location
          </button>
        </div>
      </div>
    </div>
  );
}
