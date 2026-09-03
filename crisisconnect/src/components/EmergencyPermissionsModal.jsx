import React, { useState, useEffect } from 'react';
import { MapPin, Bell, ShieldCheck, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmergencyPermissionsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [locStatus, setLocStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [notifStatus, setNotifStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
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
        result.onchange = () => setLocStatus(result.state);
      }).catch(() => {});
    }

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('crisisconnect_perms_dismissed');

    // Automatically prompt if either permission is still pending
    const timer = setTimeout(() => {
      const needsNotif = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default';
      if (!dismissed && (needsNotif || locStatus === 'prompt')) {
        setIsOpen(true);
        // Automatically request notification if supported
        if (needsNotif) {
          try {
            Notification.requestPermission().then((p) => {
              if (p === 'granted') setNotifStatus('granted');
            }).catch(() => {});
          } catch (e) {}
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [locStatus]);

  const handleGrantPermissions = async () => {
    setIsRequesting(true);

    // 1. Request Notification Permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const nPerm = await Notification.requestPermission();
        if (nPerm === 'granted') {
          setNotifStatus('granted');
        } else if (nPerm === 'denied') {
          setNotifStatus('denied');
        }
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
          setIsOpen(false);
          toast.success('✅ Location & Notifications activated for emergency response!');
        },
        (err) => {
          setLocStatus('denied');
          setIsRequesting(false);
          toast.error('Location request was dismissed or blocked in browser settings.');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setIsRequesting(false);
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('crisisconnect_perms_dismissed', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-slate-900 rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 relative space-y-4">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
              SAFETY PERMISSIONS
            </span>
            <h2 className="text-base font-black text-slate-900 leading-tight">
              Emergency Access Required
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          CrisisConnect requires live <strong>Location</strong> and <strong>Notification</strong> access to deliver life-saving disaster services.
        </p>

        {/* Permission items */}
        <div className="space-y-2">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">GPS Live Location</p>
                {locStatus === 'granted' ? (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Granted
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600">Required</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pinpoints your exact coordinates on the disaster map for rapid rescue deployment.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">Emergency Audio & Pop-ups</p>
                {notifStatus === 'granted' ? (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Granted
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600">Required</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sends sirens & pop-up alerts for urgent sector threats even when the app is minimized.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleGrantPermissions}
            disabled={isRequesting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 active:scale-98 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isRequesting ? 'Requesting Access...' : 'Allow Location & Notifications'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="w-full py-2 text-center text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Continue with standard access
          </button>
        </div>
      </div>
    </div>
  );
}
