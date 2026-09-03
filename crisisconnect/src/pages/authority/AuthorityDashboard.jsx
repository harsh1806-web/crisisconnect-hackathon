import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  LogOut,
  MapPin,
  Sparkles,
  Phone,
  Navigation,
  Crosshair,
  AlertTriangle,
  Radio,
  Volume2,
  VolumeX,
  Clock,
  Users,
  Search,
  Send,
  ListFilter,
  X,
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';
import { useAuth } from '../../context/AuthContext';
import { playEmergencyAlertSound } from '../../services/notificationService';
import AuthorityMobilizeVolunteersModal from '../../components/AuthorityMobilizeVolunteersModal';
import IncidentVerificationModal from '../../components/IncidentVerificationModal';
import VolunteerAttendanceModal from '../../components/VolunteerAttendanceModal';
import { REAL_POLICE_STATIONS, REAL_HOSPITALS } from '../../data/emergencyFacilities';
import toast from 'react-hot-toast';

// Custom Map Pins for Leaflet
const createPin = (color, symbol) => {
  return L.divIcon({
    className: 'custom-eoc-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 4px 14px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: white;
        cursor: pointer;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
};

const shelterIcon = L.divIcon({
  className: 'custom-shelter-pin',
  html: `
    <div style="
      background-color: #059669;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      color: white;
    ">
      ⛺
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function AuthorityDashboard() {
  const {
    crisisInfo,
    requests,
    shelters,
    verifyRequest,
    updateRequestStatus,
    addRequest,
    broadcasts,
    publishAuthorityVolunteerTask,
    volunteerTasks,
    sendAuthorityNotification,
  } = useCrisis();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);
  const [mapZoom, setMapZoom] = useState(12);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isMobilizeOpen, setIsMobilizeOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [verifyModalIncident, setVerifyModalIncident] = useState(null);
  const [notifyIncident, setNotifyIncident] = useState(null);
  const [notifyMessage, setNotifyMessage] = useState('');

  // Background Notification Permission state
  const [showNotificationBanner, setShowNotificationBanner] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted';
  });

  const handleEnableNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setShowNotificationBanner(false);
          toast.success('🔔 Background alerts enabled! Dispatch popups will trigger for your department.');
        } else {
          toast.error('Notifications blocked in browser settings. Please allow in browser permissions.');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const pendingVolunteersCount = (volunteerTasks || [])
    .flatMap((t) => t.roster || [])
    .filter((v) => v.attendanceStatus === 'PENDING').length;

  const QUICK_MESSAGES = [
    '🚔 We are on the way! Stay safe.',
    '📍 Rescue team is very close to your location.',
    '⏱️ ETA ~5 minutes. Hold your position.',
    '✅ Team has arrived. Opening rescue operation.',
    '🏥 Ambulance dispatched. Medical help incoming.',
    '📞 Please keep your phone reachable. Calling shortly.',
  ];

  const handleSendNotification = () => {
    if (!notifyIncident || !notifyMessage.trim()) return;
    sendAuthorityNotification(
      notifyIncident.id,
      notifyMessage.trim(),
      currentUser?.name || currentUser?.department || 'Authority EOC'
    );
    setNotifyMessage('');
    setNotifyIncident(null);
  };

  const handleSendTestAlert = async () => {
    setIsSendingTest(true);
    try {
      const deptName = currentUser?.department || 'Police Command';
      const trackingCode = `TEST-${Math.floor(100000 + Math.random() * 900000)}`;

      await addRequest({
        trackingCode,
        title: `CRITICAL ALERT: Priority Incident Dispatched to ${deptName}`,
        category: deptName.includes('Fire') ? 'Fire Hazard' : deptName.includes('Hospital') ? 'Medical Trauma' : 'Rescue',
        urgency: 'critical',
        description: `Live diagnostic emergency alert dispatched for ${deptName}. Testing live real-time notification sync.`,
        locationName: 'Active Sector Test Zone',
        lat: currentUser?.location?.lat || 19.0760,
        lng: currentUser?.location?.lng || 72.8777,
        peopleCount: 4,
        contactName: 'Central EOC Dispatch',
        contactPhone: currentUser?.hotline || '112',
      });

      toast.success('🚨 Test Emergency Broadcasted! Real-time alerts dispatched across network.');
    } catch (err) {
      toast.error('Failed to dispatch test alert: ' + err.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Auto-center on latest emergency if available
  useEffect(() => {
    if (requests.length > 0 && requests[0].lat && requests[0].lng) {
      setMapCenter([requests[0].lat, requests[0].lng]);
      setSelectedIncident(requests[0]);
    }
  }, [requests.length]);

  // Real-time sound chime when a new incident arrives
  const previousCountRef = useRef(requests.length);
  useEffect(() => {
    if (requests.length > previousCountRef.current) {
      const newest = requests[0];
      if (soundEnabled) {
        playEmergencyAlertSound();
      }
      toast.error(`🚨 NEW DISTRESS ALERT: ${newest.title} (${newest.contactName || 'Citizen'})`, {
        duration: 7000,
        position: 'top-right',
      });
      if (newest.lat && newest.lng) {
        setMapCenter([newest.lat, newest.lng]);
        setSelectedIncident(newest);
      }
    }
    previousCountRef.current = requests.length;
  }, [requests, soundEnabled]);

  const isPending = (status) => {
    const s = (status || '').toLowerCase();
    return !s || s === 'pending' || s === 'unverified';
  };

  const myAgency =
    currentUser?.agencyType ||
    (currentUser?.badgeId?.toLowerCase().startsWith('police')
      ? 'police'
      : currentUser?.badgeId?.toLowerCase().startsWith('fire')
      ? 'fire'
      : currentUser?.badgeId?.toLowerCase().startsWith('hosp')
      ? 'hospital'
      : currentUser?.badgeId?.toLowerCase().startsWith('ndrf')
      ? 'ndrf'
      : currentUser?.badgeId?.toLowerCase().startsWith('usar')
      ? 'usar'
      : currentUser?.badgeId?.toLowerCase().startsWith('relief')
      ? 'relief'
      : null);
  const deptInfo = useMemo(() => {
    switch (myAgency) {
      case 'hospital':
        return { label: 'Medical & Trauma', icon: '🏥', badge: '🏥 DIRECT MEDICAL DISPATCH • CMO 108' };
      case 'fire':
        return { label: 'Fire & HazMat', icon: '🚒', badge: '🚒 FIRE & HAZMAT DISPATCH • 101' };
      case 'ndrf':
        return { label: 'NDRF Water Rescue', icon: '🚤', badge: '🚤 NDRF RESCUE DISPATCH • 1077' };
      case 'usar':
        return { label: 'USAR Structural', icon: '🏚️', badge: '🏚️ USAR COLLAPSE DISPATCH • 112' };
      case 'relief':
        return { label: 'Relief & Rations', icon: '📦', badge: '📦 RELIEF & SHELTER DISPATCH • 1070' };
      case 'police':
        return { label: 'Police QRT', icon: '🚓', badge: '🚓 POLICE QRT DISPATCH • 100' };
      default:
        return { label: 'My Dept', icon: '🛡️', badge: '🛡️ DIRECT SECTOR DISPATCH' };
    }
  }, [myAgency]);

  const isReqForMyDept = (req) => {
    if (!myAgency || myAgency === 'all') return true;
    const cat = (req.category || '').toUpperCase();
    const targetAgency = req.targetAuthority?.agencyType;
    if (targetAgency === myAgency) return true;

    const text = `${req.title || ''} ${req.description || ''}`.toLowerCase();

    if (myAgency === 'hospital') {
      return ['MEDICAL', 'BLOOD', 'OXYGEN', 'MEDICINES', 'SURGERY'].some((c) => cat.includes(c)) ||
        text.includes('surgery') || text.includes('medical') || text.includes('doctor') ||
        text.includes('blood') || text.includes('hospital') || text.includes('icu') || text.includes('operation');
    }
    if (myAgency === 'fire') {
      return cat.includes('FIRE') || cat.includes('GAS') || text.includes('fire') || text.includes('blast') || text.includes('smoke');
    }
    if (myAgency === 'ndrf') {
      return cat.includes('RESCUE') || cat.includes('WATER') || cat.includes('FLOOD') || text.includes('flood') || text.includes('drown') || text.includes('boat');
    }
    if (myAgency === 'usar') {
      return cat.includes('COLLAPSE') || cat.includes('SHELTER') || text.includes('collapse') || text.includes('rubble') || text.includes('trapped');
    }
    if (myAgency === 'relief') {
      return cat.includes('FOOD') || cat.includes('WATER') || cat.includes('SHELTER') || text.includes('ration') || text.includes('food');
    }
    if (myAgency === 'police') {
      return cat.includes('POLICE') || cat.includes('EVAC') || text.includes('police') || text.includes('stampede') || text.includes('crowd');
    }
    return false;
  };

  const pendingRequests = requests.filter((r) => isPending(r.verificationStatus));
  const activeSOS = requests.filter((r) => r.urgency === 'critical' && r.status !== 'resolved');
  const myDeptRequests = requests.filter(isReqForMyDept);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchSearch =
        !searchTerm ||
        (req.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.contactPhone || '').includes(searchTerm) ||
        (req.trackingCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.locationName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        filterCategory === 'ALL'
          ? true
          : filterCategory === 'MY_DEPT'
          ? isReqForMyDept(req)
          : filterCategory === 'SOS'
          ? req.urgency === 'critical' || req.isSOS
          : filterCategory === 'PENDING'
          ? isPending(req.verificationStatus)
          : filterCategory === 'ASSIGNED'
          ? req.status === 'assigned' || req.status === 'in_progress'
          : filterCategory === 'RESOLVED'
          ? req.status === 'resolved'
          : true;

      return matchSearch && matchCategory;
    }).sort((a, b) => {
      // Prioritize logged-in department requests to the top
      if (myAgency && myAgency !== 'all') {
        const aMine = isReqForMyDept(a);
        const bMine = isReqForMyDept(b);
        if (aMine && !bMine) return -1;
        if (!aMine && bMine) return 1;
      }
      return 0;
    });
  }, [requests, searchTerm, filterCategory, myAgency]);

  const handleFlyToIncident = (incident) => {
    setSelectedIncident(incident);
    if (incident.lat && incident.lng) {
      setMapCenter([incident.lat, incident.lng]);
      setMapZoom(15);
    }
  };

  const handleTestSiren = () => {
    playEmergencyAlertSound();
    toast.success('Disaster EOC Siren Broadcast Test: 880Hz Sawtooth Alarm Active');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 space-y-5 pb-28 animate-fade-in">
      {/* Top Official Command Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5">
        {/* Officer Identity & Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/25 shrink-0 border border-blue-400/30">
              <span className="text-2xl">{deptInfo?.icon || '🏛️'}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                  {currentUser?.department || 'Disaster Operations Command'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Satellite & Radar
                </span>
              </div>
              <h1 className="text-xl font-black text-white mt-0.5">
                {currentUser?.name || 'Commander Vikram Rathore'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Badge: <span className="font-mono text-slate-200 font-bold">{currentUser?.badgeId || 'NDMA-8821'}</span> • {currentUser?.rank || 'Senior Incident Controller'}
              </p>
            </div>
          </div>

          {/* Utility Controls */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title={soundEnabled ? 'Alert Sounds: Active' : 'Alert Sounds: Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
            </button>

            <button
              onClick={handleTestSiren}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Test Audio Siren Alert"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Alert</span>
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-400 text-slate-400 border border-slate-700 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Structured Primary Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Incoming Requests */}
          <Link
            to="/authority/requests"
            className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-800/95 to-slate-850/90 hover:from-slate-750 hover:to-slate-800 border border-slate-700/80 hover:border-blue-500/50 transition-all group flex items-center justify-between shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ListFilter className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-white block group-hover:text-blue-300 transition-colors">
                  Incoming Requests
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {pendingRequests.length} awaiting verification
                </span>
              </div>
            </div>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xs animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </Link>

          {/* 2. Send Help */}
          <button
            onClick={() => setIsMobilizeOpen(true)}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/70 to-blue-900/40 hover:from-blue-900/70 hover:to-blue-850/50 border border-blue-600/40 hover:border-blue-400 text-left transition-all group flex items-center justify-between shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-white block group-hover:text-blue-200 transition-colors">
                  Send Help
                </span>
                <span className="text-[11px] text-blue-200/70 block">
                  Mobilize squads & volunteers
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 3. Available Volunteers */}
          <button
            onClick={() => setIsAttendanceOpen(true)}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-emerald-900/40 hover:from-emerald-900/70 hover:to-emerald-850/50 border border-emerald-600/40 hover:border-emerald-400 text-left transition-all group flex items-center justify-between shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-white block group-hover:text-emerald-200 transition-colors">
                  Available Volunteers
                </span>
                <span className="text-[11px] text-emerald-200/70 block">
                  {pendingVolunteersCount > 0 ? `${pendingVolunteersCount} awaiting check-in` : 'View active roster'}
                </span>
              </div>
            </div>
            {pendingVolunteersCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs animate-pulse">
                {pendingVolunteersCount}
              </span>
            ) : (
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            )}
          </button>

          {/* 4. Send Test Notification */}
          <button
            onClick={handleSendTestAlert}
            disabled={isSendingTest}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-red-950/70 to-red-900/40 hover:from-red-900/70 hover:to-red-850/50 border border-red-600/40 hover:border-red-400 text-left transition-all group flex items-center justify-between shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
                <Radio className={`w-5 h-5 ${isSendingTest ? 'animate-spin' : 'animate-pulse'}`} />
              </div>
              <div>
                <span className="text-xs font-black text-white block group-hover:text-red-200 transition-colors">
                  {isSendingTest ? 'Sending...' : 'Send Test Notification'}
                </span>
                <span className="text-[11px] text-red-200/70 block">
                  Broadcast test alert
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Background Notification Enable Banner */}
        {showNotificationBanner && (
          <div className="p-3.5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl flex items-center justify-between gap-3 shadow-lg border border-blue-700 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl">🔔</span>
              <div>
                <p className="text-xs font-black leading-tight">Enable Live Background Dispatch Pop-ups</p>
                <p className="text-[10px] text-blue-200 mt-0.5">Receive audio alerts & popups for your department even when app is minimized</p>
              </div>
            </div>
            <button
              onClick={handleEnableNotifications}
              className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs shrink-0 shadow-md cursor-pointer transition-all"
            >
              Enable Now
            </button>
          </div>
        )}

        {/* Real-time Alert Banner: Pulsing notification if pending or SOS requests exist */}
        {requests.length > 0 && (
          <div className="p-3.5 bg-red-950/70 border border-red-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <div className="truncate">
                <strong className="text-white">Active Incident: </strong>
                <span className="font-semibold">{requests[0].title}</span> • Caller: <span className="text-amber-300 font-bold">{requests[0].contactName}</span> ({requests[0].contactPhone})
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <a
                href={`tel:${requests[0].contactPhone}`}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 text-xs shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" /> Call Citizen
              </a>
              <button
                onClick={() => handleFlyToIncident(requests[0])}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 text-xs border border-slate-700 shadow-xs cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5 text-blue-400" /> View on Map
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. MAIN SCREEN: LIVE INTERACTIVE DISASTER RADAR MAP */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-0">
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Live Disaster Radar Map & Evacuation Perimeter
              </h2>
              <p className="text-xs text-slate-400">
                Real-time incident pins with victim contact details, GPS tracking, and 500m hazard zones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              {requests.length} Distress Beacons
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              ⛺ {shelters.length} Shelters
            </span>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="relative h-[420px] w-full z-10 bg-slate-100">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} zoom={mapZoom} />

            {/* Emergency Request Markers */}
            {requests.map((req) => {
              const pinColor =
                req.urgency === 'critical' || req.isSOS
                  ? '#dc2626'
                  : req.verificationStatus === 'pending'
                  ? '#ea580c'
                  : '#2563eb';

              const pinSymbol = req.targetAuthority?.icon || (req.urgency === 'critical' ? '🚨' : '📍');
              const icon = createPin(pinColor, pinSymbol);

              return (
                <React.Fragment key={req.id}>
                  {/* High Alert (Red) vs Moderate Alert (Yellow) Area Circles */}
                  {req.urgency === 'critical' || req.isSOS || req.urgency === 'high' ? (
                    <Circle
                      center={[req.lat, req.lng]}
                      radius={750}
                      pathOptions={{
                        color: '#dc2626',
                        fillColor: '#ef4444',
                        fillOpacity: 0.22,
                        weight: 2,
                        dashArray: '5, 8',
                      }}
                    />
                  ) : (
                    <Circle
                      center={[req.lat, req.lng]}
                      radius={480}
                      pathOptions={{
                        color: '#ca8a04',
                        fillColor: '#eab308',
                        fillOpacity: 0.20,
                        weight: 1.5,
                        dashArray: '3, 6',
                      }}
                    />
                  )}

                  <Marker
                    position={[req.lat, req.lng]}
                    icon={icon}
                    eventHandlers={{
                      click: () => {
                        setSelectedIncident(req);
                      },
                    }}
                  >
                    <Popup className="custom-authority-popup">
                      <div className="p-1 space-y-2 max-w-xs text-slate-900">
                        <div className="flex items-center justify-between border-b pb-1">
                          <span className="text-[10px] font-mono font-black text-red-600 uppercase">
                            {req.trackingCode || req.id}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 uppercase">
                            {req.urgency}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{req.title}</h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{req.description}</p>
                        </div>

                        {/* Citizen Contact Details */}
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">👤 {req.contactName || 'Citizen'}</span>
                            <span>👥 {req.peopleCount || 1} in danger</span>
                          </div>
                          {req.contactPhone && (
                            <a
                              href={`tel:${req.contactPhone}`}
                              className="text-blue-600 font-bold flex items-center gap-1 hover:underline pt-0.5"
                            >
                              <Phone className="w-3 h-3" /> {req.contactPhone}
                            </a>
                          )}
                        </div>

                        {/* Live GPS Coordinates & Google Maps Link */}
                        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                          <span>📍 [{req.lat?.toFixed(4)}, {req.lng?.toFixed(4)}]</span>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${req.lat},${req.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-bold flex items-center gap-0.5 hover:underline"
                          >
                            <Navigation className="w-3 h-3" /> Turn-by-Turn
                          </a>
                        </div>

                        {/* 1-Click Verification if pending */}
                        {req.verificationStatus === 'pending' && (
                          <button
                            onClick={() => verifyRequest(req.id, currentUser?.name || 'Authority EOC')}
                            className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold text-center transition-colors"
                          >
                            ✓ Verify & Dispatch
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}

            {/* Safe Evacuation Shelters */}
            {shelters.map((shelter) => (
              <Marker
                key={shelter.id}
                position={[shelter.lat, shelter.lng]}
                icon={shelterIcon}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-slate-900 text-xs">
                    <p className="font-black text-emerald-800">⛺ {shelter.name}</p>
                    <p className="text-[11px] text-slate-600">{shelter.address}</p>
                    <p className="text-[10px] font-semibold text-slate-500">
                      Capacity: {shelter.occupancy} / {shelter.capacity} occupied
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Real Verified Police Stations */}
            {REAL_POLICE_STATIONS.map((ps) => (
              <Marker
                key={ps.id}
                position={[ps.lat, ps.lng]}
                icon={createPin('#1e40af', '🚓')}
              >
                <Popup>
                  <div className="p-1.5 space-y-1.5 max-w-xs text-xs font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                        🚓 Police Station
                      </span>
                      <span className="font-mono text-[9px] font-bold text-slate-500">
                        {ps.badge}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-900 text-xs">{ps.name}</h4>
                    <p className="text-[11px] text-slate-600">📍 {ps.address}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{ps.availableUnits}</p>
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={`tel:${ps.emergencyHotline}`}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Dial {ps.emergencyHotline}
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${ps.lat},${ps.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded bg-blue-600 text-white font-bold text-[10px] flex items-center gap-1"
                      >
                        <Navigation className="w-3 h-3" /> Turn-by-Turn
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Real Verified Hospitals */}
            {REAL_HOSPITALS.map((hosp) => (
              <Marker
                key={hosp.id}
                position={[hosp.lat, hosp.lng]}
                icon={createPin('#dc2626', '🏥')}
              >
                <Popup>
                  <div className="p-1.5 space-y-1.5 max-w-xs text-xs font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                        🏥 24/7 Hospital
                      </span>
                      <span className="font-mono text-[9px] font-bold text-slate-500">
                        {hosp.badge}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-900 text-xs">{hosp.name}</h4>
                    <p className="text-[11px] text-slate-600">📍 {hosp.address}</p>
                    <p className="text-[10px] text-slate-500">{hosp.facilities}</p>
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={`tel:${hosp.emergencyHotline}`}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Dial {hosp.emergencyHotline}
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded bg-blue-600 text-white font-bold text-[10px] flex items-center gap-1"
                      >
                        <Navigation className="w-3 h-3" /> Turn-by-Turn
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Real-time KPI Counters (Interactive Filter Buttons) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => {
            setFilterCategory('ALL');
            document.getElementById('alerts-feed-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`p-4 rounded-2xl border shadow-xs text-left cursor-pointer transition-all active:scale-98 ${
            filterCategory === 'ALL'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Logged
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{requests.length}</p>
          <span className="text-[10px] text-slate-500">Citizen incidents</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterCategory('PENDING');
            document.getElementById('alerts-feed-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`p-4 rounded-2xl border-2 shadow-xs text-left cursor-pointer transition-all active:scale-98 group ${
            filterCategory === 'PENDING'
              ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-amber-50/80 hover:bg-amber-100/80 border-amber-300'
          }`}
          title="Click to view all pending verification incidents"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
              Pending Verify
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-2xl font-black text-amber-950 mt-1">{pendingRequests.length}</p>
          <span className="text-[10px] text-amber-800 font-black flex items-center gap-1">
            Action required ({pendingRequests.length}) →
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterCategory('ASSIGNED');
            document.getElementById('alerts-feed-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`p-4 rounded-2xl border shadow-xs text-left cursor-pointer transition-all active:scale-98 ${
            filterCategory === 'ASSIGNED'
              ? 'bg-blue-100/90 border-blue-500 ring-2 ring-blue-500/30'
              : 'bg-blue-50/70 hover:bg-blue-100/70 border-blue-200'
          }`}
        >
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
            Active / Assigned
          </span>
          <p className="text-2xl font-black text-blue-900 mt-1">
            {crisisInfo.stats.assignedMissions}
          </p>
          <span className="text-[10px] text-blue-700 font-semibold">NGO squads on site</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterCategory('RESOLVED');
            document.getElementById('alerts-feed-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`p-4 rounded-2xl border shadow-xs text-left cursor-pointer transition-all active:scale-98 ${
            filterCategory === 'RESOLVED'
              ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200'
          }`}
        >
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Rescues Safe
          </span>
          <p className="text-2xl font-black text-emerald-900 mt-1">
            {crisisInfo.stats.rescuesCompleted}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold">Missions resolved</span>
        </button>
      </div>

      {/* AI Disaster Routing & Automated Authority Intimation Matrix */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                AI Automated Dispatch & Authority Intimation Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Incoming distress signals auto-analyzed by AI and routed directly to specialized agencies
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30 self-start sm:self-center">
            AUTO-INTIMATION: ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            {
              name: 'NDRF Water Rescue',
              icon: '🚤',
              hotline: '1077',
              color: 'border-sky-500/40 bg-sky-950/30',
              count: requests.filter((r) => r.targetAuthority?.shortName?.includes('NDRF') || r.category?.toUpperCase() === 'RESCUE').length,
            },
            {
              name: 'Medical Trauma (108)',
              icon: '🏥',
              hotline: '108',
              color: 'border-red-500/40 bg-red-950/30',
              count: requests.filter((r) => r.targetAuthority?.shortName?.includes('Medical') || ['MEDICAL', 'BLOOD', 'OXYGEN', 'MEDICINES'].includes(r.category?.toUpperCase())).length,
            },
            {
              name: 'Fire & HazMat (101)',
              icon: '🔥',
              hotline: '101',
              color: 'border-orange-500/40 bg-orange-950/30',
              count: requests.filter((r) => r.targetAuthority?.shortName?.includes('Fire')).length,
            },
            {
              name: 'USAR Structural (112)',
              icon: '🏚️',
              hotline: '112',
              color: 'border-purple-500/40 bg-purple-950/30',
              count: requests.filter((r) => r.targetAuthority?.shortName?.includes('USAR')).length,
            },
            {
              name: 'Civil Defense & Storm',
              icon: '🌪️',
              hotline: '1070',
              color: 'border-emerald-500/40 bg-emerald-950/30',
              count: requests.filter((r) => r.targetAuthority?.shortName?.includes('Storm') || ['SHELTER', 'FOOD & WATER', 'GENERAL'].includes(r.category?.toUpperCase())).length,
            },
          ].map((dept) => (
            <div
              key={dept.name}
              className={`p-3 rounded-2xl border ${dept.color} flex flex-col justify-between space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{dept.icon}</span>
                <span className="text-lg font-black text-white">{dept.count}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">{dept.name}</p>
                <span className="text-[10px] text-slate-400 font-mono">Hotline: {dept.hotline}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. LIVE INCOMING ALERTS & CITIZEN CONTACT DETAILS FEED */}
      <div id="alerts-feed-section" className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-600 animate-pulse" />
              Live Incoming Distress Alerts ({filteredRequests.length})
            </h2>
            <p className="text-xs text-slate-500">
              Direct caller identity, callback mobile number, exact GPS coordinates, and 1-click field dispatch
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            {(myAgency && myAgency !== 'all'
              ? ['ALL', 'MY_DEPT', 'SOS', 'PENDING', 'ASSIGNED', 'RESOLVED']
              : ['ALL', 'SOS', 'PENDING', 'ASSIGNED', 'RESOLVED']
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterCategory(tab)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  filterCategory === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : tab === 'MY_DEPT'
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab === 'MY_DEPT' ? `${deptInfo.icon} My Dept: ${deptInfo.label} (${myDeptRequests.length})` : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by caller name, mobile no, location, or tracking token..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* List of Incoming Incidents */}
        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
              No emergency incidents match this filter. All clear in this sector.
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className={`p-4 rounded-2xl border transition-all ${
                  selectedIncident?.id === req.id
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                    : req.urgency === 'critical'
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Incident Details & AI Badge */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                        {req.trackingCode || req.id}
                      </span>
                      {isReqForMyDept(req) && myAgency && myAgency !== 'all' && (
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-600 text-white shadow-xs animate-pulse">
                          {deptInfo.badge}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          req.urgency === 'critical'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.urgency}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Status: {req.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900">{req.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{req.description}</p>

                    {/* AI Intimation Department Tag */}
                    {req.targetAuthority && (
                      <div className="p-2 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{req.targetAuthority.icon}</span>
                          <div>
                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">
                              AI Intimated Authority ({req.aiClassification?.confidence || '96%'})
                            </span>
                            <span className="font-bold text-white text-[11px]">
                              {req.targetAuthority.name}
                            </span>
                          </div>
                        </div>
                        <a
                          href={`tel:${req.targetAuthority.hotline}`}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/30"
                        >
                          Hotline: {req.targetAuthority.hotline}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right: Citizen Contact Details & GPS Location Box */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 lg:w-80 space-y-2 shrink-0">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">
                          👤 {req.contactName || 'Citizen in Distress'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {req.peopleCount || 1} Trapped
                      </span>
                    </div>

                    {/* Callback Phone with 1-Click Action */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Callback Mobile:</span>
                      {req.contactPhone ? (
                        <a
                          href={`tel:${req.contactPhone}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 text-[11px] shadow-2xs"
                        >
                          <Phone className="w-3 h-3" /> {req.contactPhone}
                        </a>
                      ) : (
                        <span className="text-slate-400">Not provided</span>
                      )}
                    </div>

                    {/* Live GPS Coordinates */}
                    <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span className="font-semibold text-slate-800 line-clamp-1">{req.locationName || 'GPS Location'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Lat: {req.lat?.toFixed(5)}</span>
                        <span>Lng: {req.lng?.toFixed(5)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => handleFlyToIncident(req)}
                        className="py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Crosshair className="w-3 h-3 text-blue-400" /> Focus Map
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${req.lat},${req.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                      >
                        <Navigation className="w-3 h-3" /> Navigate
                      </a>
                    </div>

                    {/* Quick Verification & Resolution Buttons */}
                    <div className="pt-1 flex items-center gap-1.5">
                      {req.verificationStatus === 'pending' ? (
                        <button
                          onClick={() => setVerifyModalIncident(req)}
                          className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Inspect & Authenticate</span>
                        </button>
                      ) : req.status !== 'resolved' ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <button
                            onClick={() => {
                              setNotifyIncident(req);
                              setNotifyMessage('');
                            }}
                            className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Notify Citizen
                          </button>
                          <button
                            onClick={() => updateRequestStatus(req.id, 'resolved', currentUser?.name || 'Authority EOC')}
                            className="flex-1 py-1.5 rounded-xl bg-slate-200 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Mark Rescued
                          </button>
                        </div>
                      ) : (
                        <span className="w-full py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-bold text-center border border-emerald-200 block">
                          ✓ Mission Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Incident Verification & Authenticity Modal */}
      {verifyModalIncident && (
        <IncidentVerificationModal
          incident={verifyModalIncident}
          authority={currentUser}
          onVerify={(id, authorityName, auditData) => {
            verifyRequest(id, authorityName, auditData);
            setVerifyModalIncident(null);
          }}
          onReject={(id, reason, authorityName) => {
            rejectRequest(id, reason, authorityName);
            setVerifyModalIncident(null);
          }}
          onClose={() => setVerifyModalIncident(null)}
        />
      )}

      {/* Authority Mobilize Volunteers Modal */}
      {isMobilizeOpen && (
        <AuthorityMobilizeVolunteersModal
          authority={currentUser}
          onPublish={publishAuthorityVolunteerTask}
          onClose={() => setIsMobilizeOpen(false)}
        />
      )}

      {/* Volunteer Attendance & Verification Modal */}
      {isAttendanceOpen && (
        <VolunteerAttendanceModal onClose={() => setIsAttendanceOpen(false)} />
      )}

      {/* Authority → Citizen Live Notification Modal */}
      {notifyIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setNotifyIncident(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                Notify Citizen — Live Status
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Send a real-time notification to <strong className="text-slate-800">{notifyIncident.contactName}</strong> ({notifyIncident.contactPhone})
              </p>
            </div>

            {/* Incident Reference */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-900">{notifyIncident.title}</span>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {notifyIncident.locationName}
              </p>
            </div>

            {/* Quick Message Chips */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Responses:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_MESSAGES.map((msg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNotifyMessage(msg)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                      notifyMessage === msg
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-slate-100 hover:bg-blue-50 text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message Input */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Or type a custom message:
              </label>
              <textarea
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                rows={2}
                placeholder="e.g. We are 2 streets away, hold your position..."
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Send Button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSendNotification}
                disabled={!notifyMessage.trim()}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                <Send className="w-4 h-4" />
                Send Notification to Citizen
              </button>
              <button
                onClick={() => setNotifyIncident(null)}
                className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
