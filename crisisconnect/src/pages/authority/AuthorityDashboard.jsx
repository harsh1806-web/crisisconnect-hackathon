import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';
import { useAuth } from '../../context/AuthContext';
import { playEmergencyAlertSound } from '../../services/notificationService';
import AuthorityMobilizeVolunteersModal from '../../components/AuthorityMobilizeVolunteersModal';
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
    publishAuthorityVolunteerTask,
  } = useCrisis();
  const { currentUser, logout } = useAuth();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);
  const [mapZoom, setMapZoom] = useState(12);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isMobilizeOpen, setIsMobilizeOpen] = useState(false);

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

  const pendingRequests = requests.filter((r) => r.verificationStatus === 'pending');
  const activeSOS = requests.filter((r) => r.urgency === 'critical' && r.status !== 'resolved');

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
          : filterCategory === 'SOS'
          ? req.urgency === 'critical' || req.isSOS
          : filterCategory === 'PENDING'
          ? req.verificationStatus === 'pending'
          : filterCategory === 'ASSIGNED'
          ? req.status === 'assigned' || req.status === 'in_progress'
          : filterCategory === 'RESOLVED'
          ? req.status === 'resolved'
          : true;

      return matchSearch && matchCategory;
    });
  }, [requests, searchTerm, filterCategory]);

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
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/30 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                  {currentUser?.department || 'Disaster Operations EOC Command'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Satellite & Radar Stream
                </span>
              </div>
              <h1 className="text-lg font-black text-white">
                {currentUser?.name || 'Commander Vikram Rathore'}
              </h1>
              <p className="text-xs text-slate-400">
                Official Badge: <span className="font-mono text-slate-200 font-bold">{currentUser?.badgeId || 'NDMA-8821'}</span> • {currentUser?.rank || 'Senior Incident Controller'}
              </p>
            </div>
          </div>

          {/* Quick Authority Controls */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center mt-2 sm:mt-0">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                soundEnabled
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title={soundEnabled ? 'Siren Audio Alerts: Active' : 'Siren Audio: Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Siren ON' : 'Muted'}</span>
            </button>

            <button
              onClick={handleTestSiren}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
              title="Test Audio Siren"
            >
              Test Siren
            </button>

            <button
              onClick={handleSendTestAlert}
              disabled={isSendingTest}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Broadcast Live Test Emergency Alert"
            >
              <Radio className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-spin' : 'animate-pulse'}`} />
              <span>{isSendingTest ? 'Sending...' : 'Send Test Alert'}</span>
            </button>

            <button
              onClick={() => setIsMobilizeOpen(true)}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Mobilize Civilian Volunteers in Real Time"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Mobilize Volunteers</span>
            </button>

            <Link
              to="/authority/requests"
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors border border-slate-700 flex items-center gap-1"
            >
              <span>Verify Queue</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] ml-1">
                {pendingRequests.length}
              </span>
            </Link>

            <button
              onClick={logout}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Alert Banner: Pulsing notification if pending or SOS requests exist */}
        {requests.length > 0 && (
          <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-200">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <div>
                <strong className="text-white">Active Incident: </strong>
                <span>{requests[0].title}</span> • Caller: <span className="text-amber-300 font-bold">{requests[0].contactName}</span> ({requests[0].contactPhone})
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${requests[0].contactPhone}`}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 text-[11px]"
              >
                <Phone className="w-3 h-3" /> Call Citizen
              </a>
              <button
                onClick={() => handleFlyToIncident(requests[0])}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1 text-[11px]"
              >
                <Crosshair className="w-3 h-3" /> Focus on Map
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
                  {(req.urgency === 'critical' || req.isSOS) && (
                    <Circle
                      center={[req.lat, req.lng]}
                      radius={500}
                      pathOptions={{
                        color: '#dc2626',
                        fillColor: '#ef4444',
                        fillOpacity: 0.18,
                        weight: 2,
                        dashArray: '4, 8',
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
          </MapContainer>
        </div>
      </div>

      {/* Real-time KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Logged
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{requests.length}</p>
          <span className="text-[10px] text-slate-500">Citizen incidents</span>
        </div>

        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            Pending Verify
          </span>
          <p className="text-2xl font-black text-amber-900 mt-1">{pendingRequests.length}</p>
          <span className="text-[10px] text-amber-700 font-semibold">Action required</span>
        </div>

        <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 shadow-xs">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
            Active / Assigned
          </span>
          <p className="text-2xl font-black text-blue-900 mt-1">
            {crisisInfo.stats.assignedMissions}
          </p>
          <span className="text-[10px] text-blue-700 font-semibold">NGO squads on site</span>
        </div>

        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Rescues Safe
          </span>
          <p className="text-2xl font-black text-emerald-900 mt-1">
            {crisisInfo.stats.rescuesCompleted}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold">Missions resolved</span>
        </div>
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
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xl space-y-4">
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
            {['ALL', 'SOS', 'PENDING', 'ASSIGNED', 'RESOLVED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterCategory(tab)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
                  filterCategory === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab}
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
                          onClick={() => verifyRequest(req.id, currentUser?.name || 'Authority EOC')}
                          className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors"
                        >
                          ✓ Verify Incident
                        </button>
                      ) : req.status !== 'resolved' ? (
                        <button
                          onClick={() => updateRequestStatus(req.id, 'resolved', currentUser?.name || 'Authority EOC')}
                          className="w-full py-1.5 rounded-xl bg-slate-200 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 text-[11px] font-bold transition-colors"
                        >
                          Mark Rescued / Safe
                        </button>
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

      {/* Authority Mobilize Volunteers Modal */}
      {isMobilizeOpen && (
        <AuthorityMobilizeVolunteersModal
          authority={currentUser}
          onPublish={publishAuthorityVolunteerTask}
          onClose={() => setIsMobilizeOpen(false)}
        />
      )}
    </div>
  );
}
