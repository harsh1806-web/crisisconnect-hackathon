import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  Users,
  Package,
  PlusCircle,
  MapPin,
  Phone,
  CheckCircle,
  LogOut,
  Send,
  AlertTriangle,
  Radio,
  Clock,
  ShieldCheck,
  Navigation,
  Sparkles,
  Award,
  Truck,
  Flame,
  Droplets,
  Plus,
  Minus,
  Layers,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useCrisis } from '../../context/CrisisContext';
import { useAuth } from '../../context/AuthContext';
import VolunteerAttendanceModal from '../../components/VolunteerAttendanceModal';
import { REAL_POLICE_STATIONS, REAL_HOSPITALS } from '../../data/emergencyFacilities';
import toast from 'react-hot-toast';

// Custom Pin generator for NGO map
const createPin = (color, symbol) =>
  L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <div style="transform: rotate(45deg); font-size: 14px;">
          ${symbol}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

// Seed of registered, vetted civilian volunteers in this operational sector
const SECTOR_VOLUNTEERS = [
  {
    id: 'vol-1',
    name: 'Rahul Verma',
    phone: '9820112233',
    distance: '0.6 km away',
    skills: ['🩺 CPR & First Aid', 'English / Hindi'],
    status: 'AVAILABLE',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
    karmaPoints: 450,
    missionsCompleted: 6,
  },
  {
    id: 'vol-2',
    name: 'Pooja Sharma',
    phone: '9819223344',
    distance: '1.1 km away',
    skills: ['🏊 Certified Swimmer', 'Boat Extraction'],
    status: 'AVAILABLE',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja',
    karmaPoints: 720,
    missionsCompleted: 11,
  },
  {
    id: 'vol-3',
    name: 'Amit Jadhav',
    phone: '9821334455',
    distance: '1.4 km away',
    skills: ['🚐 4x4 Rescue Driver', 'Heavy Hauling'],
    status: 'ON_TASK',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit',
    karmaPoints: 310,
    missionsCompleted: 4,
  },
  {
    id: 'vol-4',
    name: 'Kavita Nair',
    phone: '9822445566',
    distance: '1.8 km away',
    skills: ['📦 Dry Ration Packaging', 'Baby Care Support'],
    status: 'AVAILABLE',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavita',
    karmaPoints: 540,
    missionsCompleted: 8,
  },
  {
    id: 'vol-5',
    name: 'Deepak Patil',
    phone: '9833556677',
    distance: '0.9 km away',
    skills: ['⚡ Ham Radio & Comms', 'Crowd Management'],
    status: 'AVAILABLE',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepak',
    karmaPoints: 890,
    missionsCompleted: 14,
  },
];

export default function NGODashboard() {
  const { requests, donations, recordDonation, updateNGOMission, updateRequestStatus, volunteerTasks, shelters } =
    useCrisis();
  const { currentUser, logout } = useAuth();

  // Active View Tab: 'alerts' | 'volunteers' | 'supplies' | 'map'
  const [activeTab, setActiveTab] = useState('alerts');
  const [alertUrgencyFilter, setAlertUrgencyFilter] = useState('ALL'); // 'ALL' | 'HIGH' | 'MODERATE' | 'MY_MISSIONS'
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  // Live interactive supply inventory
  const [inventoryStock, setInventoryStock] = useState([
    { id: 'water', name: 'Clean Drinking Water', count: 4200, unit: 'Litres', icon: '💧' },
    { id: 'meals', name: 'Ready-to-Eat Food Packets', count: 1850, unit: 'Packs', icon: '🍱' },
    { id: 'firstaid', name: 'Emergency First-Aid Kits', count: 340, unit: 'Kits', icon: '💊' },
    { id: 'tents', name: 'Weatherproof Family Tarps', count: 120, unit: 'Tents', icon: '⛺' },
    { id: 'jackets', name: 'High-Buoyancy Life Jackets', count: 85, unit: 'Vests', icon: '🦺' },
  ]);

  // Broadcast modal form state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastVolCount, setBroadcastVolCount] = useState(10);
  const [broadcastSector, setBroadcastSector] = useState('Sector 4 Community Relief Camp');

  // Deploy squad modal / dispatch note state
  const [activeDeployReq, setActiveDeployReq] = useState(null);
  const [squadVehicle, setSquadVehicle] = useState('Rescue Zodiac Boat #2');
  const [dispatchNote, setDispatchNote] = useState('');

  // Donation form state
  const [donorName, setDonorName] = useState('');
  const [donationType, setDonationType] = useState('Supplies');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationItems, setDonationItems] = useState('');

  // Helpers to categorize alerts
  const isHighAlert = (r) => {
    const urg = (r.urgency || '').toLowerCase();
    const cat = (r.category || '').toUpperCase();
    return (
      urg === 'critical' ||
      urg === 'high' ||
      r.isSOS ||
      cat === 'RESCUE' ||
      (r.title || '').toUpperCase().includes('SOS') ||
      Number(r.peopleCount) >= 4
    );
  };

  const highAlertsCount = requests.filter(isHighAlert).length;
  const moderateAlertsCount = requests.filter((r) => !isHighAlert(r)).length;

  const myMissions = requests.filter(
    (r) =>
      r.assignedNGO?.name?.toLowerCase().includes('red cross') ||
      r.assignedNGO?.name?.toLowerCase().includes('ngo') ||
      r.assignedNGO?.id === currentUser?.ngoId ||
      r.status === 'assigned' ||
      r.status === 'in_progress'
  );

  const filteredRequests = requests.filter((r) => {
    if (alertUrgencyFilter === 'HIGH') return isHighAlert(r);
    if (alertUrgencyFilter === 'MODERATE') return !isHighAlert(r);
    if (alertUrgencyFilter === 'MY_MISSIONS') {
      return myMissions.some((m) => m.id === r.id);
    }
    return true;
  });

  const handleStockUpdate = (id, delta) => {
    setInventoryStock((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newCount = Math.max(0, item.count + delta);
          return { ...item, count: newCount };
        }
        return item;
      })
    );
    toast.success(`Stock updated for ${id}!`);
  };

  const handleConfirmDeploy = () => {
    if (!activeDeployReq) return;
    const note = dispatchNote.trim()
      ? dispatchNote
      : `Squad deployed with ${squadVehicle}. En route to site.`;

    updateNGOMission(activeDeployReq.id, note, currentUser?.name || currentUser?.shortName || 'NGO Field Lead');
    setActiveDeployReq(null);
    setDispatchNote('');
  };

  const handleRecordDonationSubmit = (e) => {
    e.preventDefault();
    if (!donationItems.trim() && !donationAmount) {
      toast.error('Please enter donation amount or supply items description.');
      return;
    }

    recordDonation({
      donor: donorName || 'Community Benefactor',
      type: donationType,
      amount: Number(donationAmount) || 0,
      items:
        donationType === 'Monetary Fund'
          ? `Disaster Relief Grant of $${donationAmount}`
          : donationItems || 'Emergency Food & Water Packets',
    });

    setDonorName('');
    setDonationAmount('');
    setDonationItems('');
  };

  const handleBroadcastSubmit = (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim()) {
      toast.error('Please enter mission title.');
      return;
    }
    toast.success(`📢 Broadcast Sent! ${broadcastVolCount} volunteers requested for "${broadcastTitle}" in ${broadcastSector}.`);
    setIsBroadcastModalOpen(false);
    setBroadcastTitle('');
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-5 space-y-5 pb-24 animate-fade-in">
      {/* Top NGO Command Profile Header */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-4 sm:p-5 border border-emerald-800/40 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/30 text-2xl">
              {currentUser?.icon || '🏥'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  DISASTER RELIEF NGO EOC
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                  {currentUser?.regId || 'NGO-RC-2024'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                {currentUser?.ngoName || 'Indian Red Cross Society Disaster Relief Corps'}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Field Lead: <span className="font-semibold text-white">{currentUser?.name || 'Dr. Ananya Sen'}</span> •{' '}
                Hotline: <span className="font-mono text-emerald-400 font-bold">{currentUser?.hotline || '011-23716441'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsAttendanceOpen(true)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/40 transition-all cursor-pointer"
              title="Verify Volunteer Attendance (+100 Karma Points)"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Verify Attendance</span>
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4-KPI Sector Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-800/40 text-center">
          <div className="p-2 rounded-2xl bg-black/25 border border-white/5">
            <span className="text-[10px] text-red-300 uppercase font-bold flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              High Alerts (Red)
            </span>
            <span className="text-lg font-black text-white">{highAlertsCount}</span>
          </div>

          <div className="p-2 rounded-2xl bg-black/25 border border-white/5">
            <span className="text-[10px] text-yellow-300 uppercase font-bold flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              Moderate Alerts
            </span>
            <span className="text-lg font-black text-white">{moderateAlertsCount}</span>
          </div>

          <div className="p-2 rounded-2xl bg-black/25 border border-white/5">
            <span className="text-[10px] text-emerald-300 uppercase font-bold block">
              Area Volunteers Ready
            </span>
            <span className="text-lg font-black text-emerald-400">
              {SECTOR_VOLUNTEERS.filter((v) => v.status === 'AVAILABLE').length} Active
            </span>
          </div>

          <div className="p-2 rounded-2xl bg-black/25 border border-white/5">
            <span className="text-[10px] text-blue-300 uppercase font-bold block">
              Active Missions
            </span>
            <span className="text-lg font-black text-white">{myMissions.length} Assigned</span>
          </div>
        </div>
      </div>

      {/* Main 4-Tab Hub Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 p-1.5 bg-slate-200/90 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'alerts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>Sector Alerts ({requests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('volunteers')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'volunteers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Area Volunteers ({SECTOR_VOLUNTEERS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('supplies')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'supplies' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 text-blue-600" />
          <span>Relief Supplies</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4 text-purple-600" />
          <span>Tactical Map</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SECTOR DISASTER ALERTS (HIGH ALERT RED VS MODERATE ALERT YELLOW)   */}
      {/* ========================================================================= */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Alert Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1">Filter Zone:</span>
              <button
                onClick={() => setAlertUrgencyFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  alertUrgencyFilter === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Sector Incidents ({requests.length})
              </button>

              <button
                onClick={() => setAlertUrgencyFilter('HIGH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  alertUrgencyFilter === 'HIGH'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>🔴 High Alerts ({highAlertsCount})</span>
              </button>

              <button
                onClick={() => setAlertUrgencyFilter('MODERATE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  alertUrgencyFilter === 'MODERATE'
                    ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-xs'
                    : 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>🟡 Moderate Alerts ({moderateAlertsCount})</span>
              </button>

              <button
                onClick={() => setAlertUrgencyFilter('MY_MISSIONS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  alertUrgencyFilter === 'MY_MISSIONS'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                🤝 Assigned to Us ({myMissions.length})
              </button>
            </div>

            <Link
              to="/map"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
            >
              Full Screen Map View →
            </Link>
          </div>

          {/* Incident Cards */}
          <div className="space-y-3">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => {
                const isHigh = isHighAlert(req);
                return (
                  <div
                    key={req.id}
                    className={`p-4 sm:p-5 bg-white rounded-3xl border shadow-xs space-y-3 transition-all ${
                      isHigh ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isHigh ? (
                          <span className="text-[10px] font-black uppercase tracking-wider text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            🔴 High Alert Area
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            🟡 Moderate Alert Area
                          </span>
                        )}

                        <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {req.trackingCode || req.id}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                          {req.category}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize bg-blue-50 text-blue-700 border border-blue-200">
                        Status: {req.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                        {req.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{req.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2">
                        <span className="flex items-center gap-1 text-slate-700 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {req.locationName || 'GPS Location Locked'}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-red-600">
                          <Users className="w-3.5 h-3.5" /> {req.peopleCount || 1} in sector peril
                        </span>
                      </div>
                    </div>

                    {/* AI Sized Gear Recommendation */}
                    {req.targetAuthority?.requiredEquipment && (
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          🛠️ Recommended Relief Equipment / Vehicles:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {req.targetAuthority.requiredEquipment.slice(0, 3).map((eq) => (
                            <span
                              key={eq}
                              className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700"
                            >
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Contact: {req.contactName}</span>
                        {req.contactPhone && (
                          <a
                            href={`tel:${req.contactPhone}`}
                            className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                          >
                            <Phone className="w-3 h-3" /> {req.contactPhone}
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${req.lat},${req.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1"
                        >
                          <Navigation className="w-3 h-3 text-blue-600" />
                          <span>Turn-by-Turn</span>
                        </a>

                        <button
                          onClick={() => setActiveDeployReq(req)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Deploy Squad</span>
                        </button>

                        {req.status !== 'resolved' && (
                          <button
                            onClick={() => updateRequestStatus(req.id, 'resolved', currentUser?.ngoName)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span>Mark Resolved</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                <p className="text-sm font-bold text-slate-900">No active incidents match this filter.</p>
                <p className="text-xs text-slate-500">All citizens in this priority bracket are safe.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AVAILABLE AREA VOLUNTEERS & MOBILIZATION ROSTER                    */}
      {/* ========================================================================= */}
      {activeTab === 'volunteers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Civilian Volunteer Force in Operational Sector
              </h2>
              <p className="text-xs text-slate-500">
                Registered local volunteers available for rapid callout and on-site task assignment
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBroadcastModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Broadcast Need</span>
              </button>

              <button
                onClick={() => setIsAttendanceOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verify Attendance (+100 Pts)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SECTOR_VOLUNTEERS.map((vol) => (
              <div
                key={vol.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={vol.avatar}
                      alt={vol.name}
                      className="w-11 h-11 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50 p-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-slate-900">{vol.name}</h4>
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {vol.distance}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        🏆 <strong className="text-amber-600">{vol.karmaPoints} Karma Pts</strong> • {vol.missionsCompleted} missions done
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      vol.status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {vol.status === 'AVAILABLE' ? '🟢 Ready' : '🟡 On Shift'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {vol.skills.map((sk) => (
                    <span
                      key={sk}
                      className="text-[10px] font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                    >
                      {sk}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <a
                    href={`tel:${vol.phone}`}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call {vol.phone}</span>
                  </a>

                  <button
                    onClick={() => {
                      toast.success(`Mobilization alert dispatched to ${vol.name} via SMS/Push!`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Mobilize Squad
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REAL-TIME RELIEF SUPPLY & INVENTORY MANAGEMENT                     */}
      {/* ========================================================================= */}
      {activeTab === 'supplies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Relief Supplies & Emergency Rations Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Manage stock levels, log shipments, and dispatch aid to affected sectors
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
              Warehouse Hub #4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inventoryStock.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100">
                    {item.icon}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 block font-mono">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unit}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900">{item.name}</h4>
                  <p className="text-[10px] text-slate-500">Available for immediate deployment</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleStockUpdate(item.id, 50)}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+50 Stock</span>
                  </button>
                  <button
                    onClick={() => handleStockUpdate(item.id, -50)}
                    className="flex-1 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>-50 Dispatch</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Record Incoming Donation / Drop */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-blue-600" /> Log Incoming Relief Donation / Supply Drop
            </h3>

            <form onSubmit={handleRecordDonationSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Donor / Benefactor Name
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="e.g. Metro Relief Foundation"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Donation Type
                  </label>
                  <select
                    value={donationType}
                    onChange={(e) => setDonationType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option>Supplies</option>
                    <option>Monetary Fund</option>
                    <option>Medical Equipment</option>
                    <option>Volunteer Hours</option>
                  </select>
                </div>
              </div>

              {donationType === 'Monetary Fund' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Supplies Description & Quantity
                  </label>
                  <input
                    type="text"
                    value={donationItems}
                    onChange={(e) => setDonationItems(e.target.value)}
                    placeholder="e.g. 200 boxes of bottled water, 50 blankets"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Log Supply Receipt
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INTERACTIVE SECTOR TACTICAL MAP                                    */}
      {/* ========================================================================= */}
      {activeTab === 'map' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                Sector Tactical Map: Red High Alert & Yellow Moderate Zones
              </h2>
              <p className="text-xs text-slate-500">
                Live geospatial overlay of distress beacons, volunteer positions, and safe shelters
              </p>
            </div>
            <Link
              to="/map"
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Open Full-Screen Live Map →
            </Link>
          </div>

          <div className="relative h-[440px] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-lg z-10 bg-slate-100">
            <MapContainer
              center={[19.0760, 72.8777]}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Emergency Request Pins and Zones */}
              {requests.map((req) => {
                const isHigh = isHighAlert(req);
                const pinColor = isHigh ? '#dc2626' : '#ea580c';
                const pinSymbol = isHigh ? '🚨' : '📍';
                const icon = createPin(pinColor, pinSymbol);

                return (
                  <React.Fragment key={req.id}>
                    {/* Red High Alert vs Yellow Moderate Alert Zones */}
                    {isHigh ? (
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

                    <Marker position={[req.lat, req.lng]} icon={icon}>
                      <Popup>
                        <div className="p-1 space-y-1.5 max-w-xs text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[10px] text-slate-700">
                              {req.trackingCode || req.id}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isHigh ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {isHigh ? '🔴 High Alert' : '🟡 Moderate'}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs">{req.title}</h4>
                          <p className="text-[11px] text-slate-500">{req.locationName}</p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-red-600">
                              👥 {req.peopleCount} trapped
                            </span>
                            <button
                              onClick={() => setActiveDeployReq(req)}
                              className="text-[10px] text-blue-600 font-bold hover:underline"
                            >
                              Deploy Squad →
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}

              {/* Safe Shelters */}
              {shelters &&
                shelters.map((sh) => (
                  <Marker
                    key={sh.id}
                    position={[sh.lat, sh.lng]}
                    icon={createPin('#059669', '🏕️')}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Safe Shelter
                        </span>
                        <h4 className="font-bold text-slate-900">{sh.name}</h4>
                        <p className="text-[11px] text-slate-500">Occupancy: {sh.occupied}/{sh.capacity}</p>
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
                          Turn-by-Turn
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
                          Turn-by-Turn
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SQUAD DEPLOYMENT MODAL                                             */}
      {/* ========================================================================= */}
      {activeDeployReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">Deploy Relief Squad</h3>
              </div>
              <button
                onClick={() => setActiveDeployReq(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <span className="font-mono text-[10px] text-slate-500 font-bold">
                REF: {activeDeployReq.trackingCode || activeDeployReq.id}
              </span>
              <h4 className="font-bold text-slate-900 text-xs">{activeDeployReq.title}</h4>
              <p className="text-slate-500 text-[11px] truncate">📍 {activeDeployReq.locationName}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Select Deployment Unit / Vehicle</label>
              <select
                value={squadVehicle}
                onChange={(e) => setSquadVehicle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              >
                <option>Rescue Zodiac Inflatable Boat #2</option>
                <option>Mobile Medical Trauma Van #4</option>
                <option>4x4 High-Clearance Relief Truck #1</option>
                <option>Community Food & Drinking Water Carrier</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Dispatcher Status Note</label>
              <textarea
                value={dispatchNote}
                onChange={(e) => setDispatchNote(e.target.value)}
                rows={3}
                placeholder="e.g. Squad en route with 50 food packets and medical first aid."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={handleConfirmDeploy}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Confirm Deployment & Notify Citizen
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BROADCAST VOLUNTEER REQUIREMENT                                    */}
      {/* ========================================================================= */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
                <h3 className="font-black text-base text-slate-900">Broadcast Volunteer Callout</h3>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mission Task Title
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Dry Ration Packaging & Distribution"
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Volunteers Required Count
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={broadcastVolCount}
                  onChange={(e) => setBroadcastVolCount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location / Sector Camp
                </label>
                <input
                  type="text"
                  value={broadcastSector}
                  onChange={(e) => setBroadcastSector(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md cursor-pointer mt-2"
              >
                📢 Broadcast Callout to Local Citizens
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Volunteer Attendance Modal */}
      {isAttendanceOpen && (
        <VolunteerAttendanceModal onClose={() => setIsAttendanceOpen(false)} />
      )}
    </div>
  );
}
