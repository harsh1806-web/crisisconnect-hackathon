import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, Crosshair } from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import toast from 'react-hot-toast';

// Custom Marker generator using SVG & HTML
const createCustomPin = (color, symbol) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: white;
        cursor: pointer;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-loc-icon',
  html: `
    <div style="
      background-color: #2563eb;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 8px rgba(37,99,235,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Helper component to smoothly center map
function MapController({ center, zoom }) {
  const map = useMap();
  if (center) {
    map.flyTo(center, zoom || 14, { duration: 1.5 });
  }
  return null;
}

export default function MapView() {
  const { requests, shelters } = useCrisis();

  const [showRequests, setShowRequests] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showRadiuses, setShowRadiuses] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const defaultCenter = requests.length > 0 && requests[0].lat && requests[0].lng
    ? [requests[0].lat, requests[0].lng]
    : [19.0760, 72.8777];

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);

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
                {userLocation ? 'Real-Time GPS' : 'Connecting GPS...'}
              </span>
              {userLocation && (
                <p className="font-mono text-[10px] text-slate-500">
                  {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
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
              <Marker position={userLocation} icon={userLocationIcon}>
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
    </div>
  );
}
