import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, Crosshair, Navigation, Phone, ExternalLink, ShieldAlert, HeartPulse, X, Compass, ArrowUpDown } from 'lucide-react';
import { REAL_POLICE_STATIONS, REAL_HOSPITALS } from '../data/emergencyFacilities';
import EmergencyFacilitiesSorterModal from '../components/EmergencyFacilitiesSorterModal';
import { useCrisis } from '../context/CrisisContext';
import toast from 'react-hot-toast';

// Custom Marker generator using SVG & HTML
const createCustomPin = (color, symbol, zoom = 13, isSelected = false) => {
  const baseSize = zoom >= 16 ? 44 : zoom >= 14 ? 38 : 32;
  const size = isSelected ? Math.round(baseSize * 1.25) : baseSize;
  const fontSize = size >= 40 ? 17 : size >= 36 ? 15 : 13;

  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${isSelected ? '3.5px solid #f59e0b' : '2.5px solid white'};
        box-shadow: ${isSelected ? '0 0 0 6px rgba(245, 158, 11, 0.45), 0 4px 14px rgba(0,0,0,0.45)' : '0 4px 12px rgba(0,0,0,0.35)'};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${fontSize}px;
        color: white;
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      ">
        ${symbol}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const getUserLocationIcon = (zoom = 13) => {
  const size = zoom >= 16 ? 28 : zoom >= 14 ? 24 : 20;
  return L.divIcon({
    className: 'user-loc-icon',
    html: `
      <div style="
        background-color: #2563eb;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 0 8px rgba(37,99,235,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const userLocationIcon = getUserLocationIcon(13);

// Helper component to smoothly center map
function MapController({ center, zoom }) {
  const map = useMap();
  if (center) {
    map.flyTo(center, zoom || 14, { duration: 1.5 });
  }
  return null;
}

// Helper component to track map zoom level and scale icons smoothly
function MapZoomListener({ onZoomChange }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const handleZoom = () => {
      if (typeof onZoomChange === 'function') {
        onZoomChange(map.getZoom());
      }
    };
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);
  return null;
}

// Helper to compute minutes remaining before a solved alert disappears (1-hour window)
const getRemainingMins = (req) => {
  if (!req.resolvedAt) return 60;
  const elapsed = Date.now() - new Date(req.resolvedAt).getTime();
  return Math.max(1, Math.ceil((60 * 60 * 1000 - elapsed) / 60000));
};

export default function MapView() {
  const { requests, shelters } = useCrisis();

  const [showRequests, setShowRequests] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showRadiuses, setShowRadiuses] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [showPolice, setShowPolice] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [navConfirmModal, setNavConfirmModal] = useState(null);
  const [isSorterOpen, setIsSorterOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const defaultCenter = requests.length > 0 && requests[0].lat && requests[0].lng
    ? [requests[0].lat, requests[0].lng]
    : [19.0760, 72.8777];

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [activeMarkerId, setActiveMarkerId] = useState(null);

  const [alertZoneFilter, setAlertZoneFilter] = useState('ALL'); // 'ALL' | 'HIGH' | 'MODERATE'

  const isHighAlert = (r) => {
    const urg = (r.urgency || '').toLowerCase();
    const cat = (r.category || '').toUpperCase();
    return (
      urg === 'critical' ||
      urg === 'high' ||
      r.isSOS ||
      cat === 'RESCUE' ||
      (r.title || '').toUpperCase().includes('SOS') ||
      (r.title || '').toUpperCase().includes('CRITICAL') ||
      Number(r.peopleCount) >= 4
    );
  };

  const highAlertsCount = requests.filter(isHighAlert).length;
  const moderateAlertsCount = requests.filter((r) => !isHighAlert(r)).length;

  // Filter requests
  const visibleRequests = requests.filter((r) => {
    if (!showRequests) return false;
    if (criticalOnly && !isHighAlert(r)) return false;
    if (alertZoneFilter === 'HIGH' && !isHighAlert(r)) return false;
    if (alertZoneFilter === 'MODERATE' && isHighAlert(r)) return false;
    return true;
  });

  // Continuous Real-Time Live GPS tracking: Updates map as you move in real-time
  useEffect(() => {
    let initialCenterDone = false;

    // 1. Instant check for native mobile GPS coordinates
    if (window.__NATIVE_GPS__) {
      const coords = [window.__NATIVE_GPS__.lat, window.__NATIVE_GPS__.lng];
      setUserLocation(coords);
      setMapCenter(coords);
      setMapZoom(16);
      initialCenterDone = true;
    }

    // 2. Continuous native mobile GPS listener
    window.onNativeGpsUpdate = (lat, lng) => {
      const coords = [lat, lng];
      setUserLocation(coords);
      if (!initialCenterDone) {
        setMapCenter(coords);
        setMapZoom(16);
        initialCenterDone = true;
      }
    };

    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setGpsAccuracy(pos.coords.accuracy || 20);

        // Immediately snap map to user's real-time live location on first coordinate lock
        if (!initialCenterDone) {
          setMapCenter(coords);
          setMapZoom(16);
          initialCenterDone = true;
          toast.success('Live GPS lock established!');
        }
      },
      (err) => {
        console.warn('Real-time GPS update warning:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000, // 1s fresh updates
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.onNativeGpsUpdate = null;
    };
  }, []);

  const handleLocateMe = () => {
    if (userLocation) {
      setMapCenter([...userLocation]);
      setMapZoom(16);
      toast.success('Centered on your live GPS position!');
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          setMapCenter(coords);
          setMapZoom(16);
          toast.success('Live GPS location locked!');
        },
        () => {
          toast.error('Could not determine your live GPS location.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-6.5rem)] pb-16 md:pb-0 overflow-hidden flex flex-col">
      {/* Top Floating Map Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Layer Filters */}
        <div className="pointer-events-auto bg-white/90 backdrop-blur-md rounded-2xl p-2 sm:p-3 shadow-lg border border-slate-200 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1 hidden sm:inline">
            Layers:
          </span>

          <button
            onClick={() => setShowRequests(!showRequests)}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              showRequests
                ? 'bg-red-50 border-red-300 text-red-700 font-bold'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            🚨 Requests ({requests.length})
          </button>

          <button
            onClick={() => setShowRadiuses(!showRadiuses)}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              showRadiuses
                ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            ⭕ 500m & 5km Radiuses
          </button>

          <button
            onClick={() => setShowShelters(!showShelters)}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              showShelters
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            🏕️ Shelters ({shelters.length})
          </button>

          <button
            onClick={() => setCriticalOnly(!criticalOnly)}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              criticalOnly
                ? 'bg-slate-900 border-slate-900 text-white font-bold'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            Critical SOS Only
          </button>
        </div>

        {/* Right Action Bar: Real-time GPS Chip & Re-center */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Live Real-Time GPS Status Chip */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3 py-2 shadow-lg border border-slate-200 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                userLocation ? 'bg-emerald-500 animate-ping' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <div className="text-[11px] leading-tight">
              <span className="font-black text-slate-800 flex items-center gap-1">
                {userLocation ? 'Live GPS Active' : 'City EOC Center'}
              </span>
              {userLocation ? (
                <p className="font-mono text-[10px] text-slate-500">
                  {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                </p>
              ) : (
                <p className="text-[10px] text-amber-700 font-medium">
                  Tap 🎯 to enable GPS
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleLocateMe}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            title="Snap map back to your current live position"
          >
            <Crosshair className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">My Live Location</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map */}
      <div className="w-full h-full">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController center={mapCenter} zoom={mapZoom} />
          <MapZoomListener onZoomChange={setCurrentZoom} />

          {/* User Live Real-Time Location Beacon & Accuracy Radius */}
          {userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={gpsAccuracy || 35}
                pathOptions={{
                  color: '#2563eb',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.18,
                  weight: 1.5,
                }}
              />
              <Marker position={userLocation} icon={getUserLocationIcon(currentZoom)}>
                <Popup>
                  <div className="p-1.5 space-y-1.5 text-xs font-sans">
                    <div className="flex items-center gap-1.5 font-bold text-blue-600">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      <span>Your Live Real-Time Position</span>
                    </div>
                    <p className="font-mono text-[10px] text-slate-600">
                      📍 {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      GPS Accuracy: ±{Math.round(gpsAccuracy || 10)} meters
                    </p>
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        to="/user/dashboard"
                        className="text-[11px] font-bold text-red-600 hover:underline"
                      >
                        Trigger SOS Here →
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* HIGH ALERT AREAS (RED) & MODERATE ALERT AREAS (YELLOW) */}
          {showRadiuses &&
            visibleRequests.map((req) => {
              const isHigh = isHighAlert(req);
              if (isHigh) {
                // 🔴 HIGH ALERT AREA (RED): Dual circle with outer hazard & inner impact zone
                return (
                  <React.Fragment key={`alert-zone-${req.id}`}>
                    <Circle
                      center={[req.lat, req.lng]}
                      radius={800}
                      pathOptions={{
                        color: '#dc2626',
                        fillColor: '#ef4444',
                        fillOpacity: 0.20,
                        weight: 2,
                        dashArray: '6, 8',
                      }}
                    />
                    <Circle
                      center={[req.lat, req.lng]}
                      radius={350}
                      pathOptions={{
                        color: '#991b1b',
                        fillColor: '#dc2626',
                        fillOpacity: 0.35,
                        weight: 2.5,
                      }}
                    />
                  </React.Fragment>
                );
              } else {
                // 🟡 MODERATE ALERT AREA (YELLOW): Cautionary amber/yellow zone
                return (
                  <Circle
                    key={`alert-zone-${req.id}`}
                    center={[req.lat, req.lng]}
                    radius={550}
                    pathOptions={{
                      color: '#ca8a04',
                      fillColor: '#eab308',
                      fillOpacity: 0.22,
                      weight: 2,
                      dashArray: '4, 6',
                    }}
                  />
                );
              }
            })}

          {/* 5km Immediate Volunteer Response Perimeter around selected emergency */}
          {showRadiuses && selectedRequest && (
            <Circle
              center={[selectedRequest.lat, selectedRequest.lng]}
              radius={5000}
              pathOptions={{
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.08,
                weight: 2,
                dashArray: '3, 6',
              }}
            />
          )}

          {/* Crisis Requests Pins */}
          {visibleRequests.map((req) => {
            const isHigh = isHighAlert(req);
            const color =
              req.status === 'resolved'
                ? '#94a3b8'
                : isHigh
                ? '#dc2626' // Red for High Alert
                : '#eab308'; // Yellow for Moderate Alert

            const iconSymbol = isHigh ? '🔴' : '🟡';

            return (
              <Marker
                key={req.id}
                position={[req.lat, req.lng]}
                icon={createCustomPin(color, iconSymbol)}
                eventHandlers={{
                  click: () => setSelectedRequest(req),
                }}
              >
                <Popup className="custom-popup">
                  <div className="w-68 p-1 space-y-2 text-xs font-sans">
                    {/* Alert Level Pill */}
                    <div className="flex items-center justify-between">
                      {isHigh ? (
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-pulse">
                          🔴 High Alert Area
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          🟡 Moderate Alert Area
                        </span>
                      )}

                      {req.verificationStatus === 'verified' ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Unverified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Ref: {req.trackingCode || req.id}</span>
                      <span className="font-bold text-slate-700 uppercase">{req.category}</span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm leading-snug">
                      {req.title}
                    </h4>

                    <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                      {req.description}
                    </p>

                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      📍 <span className="truncate">{req.locationName}</span>
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-700 flex items-center gap-1 font-bold">
                        <Users className="w-3.5 h-3.5 text-slate-500" /> {req.peopleCount} in sector
                      </span>
                      <Link
                        to={`/requests/${req.id}`}
                        className="font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                      >
                        Mission Hub →
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* REAL VERIFIED POLICE STATIONS */}
          {showPolice &&
            REAL_POLICE_STATIONS.map((ps) => (
              <Marker
                key={ps.id}
                position={[ps.lat, ps.lng]}
                icon={createCustomPin('#1e40af', '🚓', currentZoom, activeMarkerId === ps.id)}
                eventHandlers={{
                  click: () => {
                    setActiveMarkerId(ps.id);
                    setNavConfirmModal({
                      ...ps,
                      phone: ps.emergencyHotline || ps.phone,
                    });
                  },
                }}
              >
                <Popup
                  autoClose={false}
                  closeOnClick={false}
                  keepInView={true}
                  onClose={() => {
                    if (activeMarkerId === ps.id) setActiveMarkerId(null);
                  }}
                >
                  <div className="w-68 p-1.5 space-y-2 text-xs font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        🚓 Verified Police Station
                      </span>
                      <span className="font-mono text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {ps.badge}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm leading-snug">
                      {ps.name}
                    </h4>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      📍 {ps.address}
                    </p>

                    <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] space-y-1">
                      <p className="text-slate-700 font-medium">
                        <strong>Commander:</strong> {ps.leadOfficer}
                      </p>
                      <p className="text-blue-900 text-[10px] font-semibold">
                        🛡️ {ps.availableUnits}
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
                      <a
                        href={`tel:${ps.emergencyHotline}`}
                        className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-1"
                        title="Emergency Police Dial 100"
                      >
                        <Phone className="w-3 h-3" /> Dial {ps.emergencyHotline}
                      </a>

                      <button
                        onClick={() => setNavConfirmModal(ps)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                      >
                        <Navigation className="w-3 h-3 text-blue-200" />
                        <span>Navigate</span>
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* REAL VERIFIED 24/7 HOSPITALS & TRAUMA CENTRES */}
          {showHospitals &&
            REAL_HOSPITALS.map((hosp) => (
              <Marker
                key={hosp.id}
                position={[hosp.lat, hosp.lng]}
                icon={createCustomPin('#dc2626', '🏥', currentZoom, activeMarkerId === hosp.id)}
                eventHandlers={{
                  click: () => {
                    setActiveMarkerId(hosp.id);
                    setNavConfirmModal({
                      ...hosp,
                      phone: hosp.emergencyHotline || hosp.phone,
                    });
                  },
                }}
              >
                <Popup
                  autoClose={false}
                  closeOnClick={false}
                  keepInView={true}
                  onClose={() => {
                    if (activeMarkerId === hosp.id) setActiveMarkerId(null);
                  }}
                >
                  <div className="w-68 p-1.5 space-y-2 text-xs font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-900 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        🏥 24/7 Emergency Hospital
                      </span>
                      <span className="font-mono text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {hosp.badge}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm leading-snug">
                      {hosp.name}
                    </h4>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      📍 {hosp.address}
                    </p>

                    <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-200/80 text-[11px] space-y-1">
                      <p className="text-rose-950 font-bold text-[10px]">
                        🩺 {hosp.specialty}
                      </p>
                      <p className="text-slate-700 text-[10px]">
                        🏥 {hosp.facilities}
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
                      <a
                        href={`tel:${hosp.emergencyHotline}`}
                        className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-1"
                        title="Ambulance Emergency Dial 108"
                      >
                        <Phone className="w-3 h-3" /> Dial {hosp.emergencyHotline}
                      </a>

                      <button
                        onClick={() => setNavConfirmModal(hosp)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                      >
                        <Navigation className="w-3 h-3 text-blue-200" />
                        <span>Navigate</span>
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Shelters Pins */}
          {showShelters &&
            shelters.map((sh) => (
              <Marker
                key={sh.id}
                position={[sh.lat, sh.lng]}
                icon={createCustomPin('#059669', '🏕️')}
              >
                <Popup>
                  <div className="w-60 p-1 space-y-2 text-xs font-sans">
                    <span className="font-bold uppercase text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Safe Shelter • {sh.status}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{sh.name}</h4>
                    <p className="text-slate-500 text-[11px]">{sh.address}</p>
                    <div className="text-[11px] font-semibold text-slate-700">
                      Capacity: {sh.occupied} / {sh.capacity}
                    </div>
                    <a
                      href={`tel:${sh.contact}`}
                      className="block text-emerald-700 font-bold text-[11px] hover:underline"
                    >
                      Call Center: {sh.contact}
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* Bottom Floating Alert Level Bar & Quick Filter (Responsive on Mobile & Desktop) */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-center">
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-2.5 sm:px-4 sm:py-2.5 shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs flex-wrap justify-center max-w-xl w-full">
          <div className="flex items-center gap-1.5 mr-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Alert Zones:
            </span>
          </div>

          <button
            onClick={() => setAlertZoneFilter(alertZoneFilter === 'HIGH' ? 'ALL' : 'HIGH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
              alertZoneFilter === 'HIGH'
                ? 'bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-400/50'
                : 'bg-red-950/60 hover:bg-red-900 text-red-200 border-red-700/50'
            }`}
            title="Filter to areas having High Alerts (Red Zone)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <span>🔴 High Alerts ({highAlertsCount})</span>
          </button>

          <button
            onClick={() => setAlertZoneFilter(alertZoneFilter === 'MODERATE' ? 'ALL' : 'MODERATE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
              alertZoneFilter === 'MODERATE'
                ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-md ring-2 ring-yellow-400/50'
                : 'bg-yellow-950/60 hover:bg-yellow-900 text-yellow-200 border-yellow-700/50'
            }`}
            title="Filter to areas having Moderate Alerts (Yellow Zone)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
            <span>🟡 Moderate Alerts ({moderateAlertsCount})</span>
          </button>

          <button
            onClick={() => setShowShelters(!showShelters)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border ${
              showShelters
                ? 'bg-emerald-950/60 text-emerald-200 border-emerald-700/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle Safe Shelters"
          >
            <span>🟢 Shelters ({shelters.length})</span>
          </button>

          {alertZoneFilter !== 'ALL' && (
            <button
              onClick={() => setAlertZoneFilter('ALL')}
              className="text-[11px] text-slate-300 hover:text-white underline font-semibold cursor-pointer ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      {/* Emergency Facilities Sorter Drawer / Modal */}
      {isSorterOpen && (
        <EmergencyFacilitiesSorterModal
          userLocation={userLocation}
          onSelectFacility={(fac) => {
            setMapCenter([fac.lat, fac.lng]);
            setMapZoom(16);
            toast.success(`Centered on ${fac.name}!`);
          }}
          onNavigate={(fac) => {
            setIsSorterOpen(false);
            setNavConfirmModal(fac);
          }}
          onClose={() => setIsSorterOpen(false)}
        />
      )}

      {/* Navigation Modal Confirmation */}
      {navConfirmModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{navConfirmModal.icon || '🧭'}</span>
                <div>
                  <h3 className="font-black text-sm text-slate-900 leading-tight">
                    Start Navigation
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {navConfirmModal.type === 'POLICE' ? 'Police Station' : 'Emergency Hospital'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setNavConfirmModal(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">{navConfirmModal.name}</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">📍 {navConfirmModal.address}</p>
              <p className="text-blue-600 font-mono text-[10px] font-semibold pt-1">
                GPS: {navConfirmModal.lat}, {navConfirmModal.lng}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${navConfirmModal.lat},${navConfirmModal.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setNavConfirmModal(null)}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Open in Google Maps (Turn-by-Turn)</span>
              </a>

              <a
                href={`https://maps.apple.com/?daddr=${navConfirmModal.lat},${navConfirmModal.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setNavConfirmModal(null)}
                className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Open in Apple Maps</span>
              </a>

              <a
                href={`tel:${navConfirmModal.emergencyHotline || navConfirmModal.phone}`}
                className="w-full py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call Emergency Hotline ({navConfirmModal.emergencyHotline || navConfirmModal.phone})</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
