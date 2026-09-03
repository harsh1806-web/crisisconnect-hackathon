import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Users, Navigation, ShieldCheck } from 'lucide-react';
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

  const defaultCenter = requests.length > 0 && requests[0].lat && requests[0].lng
    ? [requests[0].lat, requests[0].lng]
    : [19.0760, 72.8777];

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);

  // Filter requests
  const visibleRequests = requests.filter((r) => {
    if (!showRequests) return false;
    if (criticalOnly) return r.urgency === 'critical';
    return true;
  });

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setMapCenter(coords);
        setMapZoom(15);
        toast.success('Map centered on your current position!');
      },
      () => {
        toast.error('Could not determine your GPS location.');
      },
      { timeout: 8000 }
    );
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

        {/* Locate Me Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={handleLocateMe}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>Locate Me</span>
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

          {/* User Location Beacon */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <p className="font-bold text-blue-600">Your Current Position</p>
                  <p className="text-slate-500">Live GPS lock</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 500-Meter Duplicate / Hazard Zones */}
          {showRadiuses &&
            visibleRequests.map((req) => (
              <Circle
                key={`circ-500-${req.id}`}
                center={[req.lat, req.lng]}
                radius={500}
                pathOptions={{
                  color: req.urgency === 'critical' ? '#dc2626' : '#ea580c',
                  fillColor: req.urgency === 'critical' ? '#dc2626' : '#ea580c',
                  fillOpacity: 0.12,
                  weight: 1.5,
                  dashArray: '4, 6',
                }}
              />
            ))}

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
            const isCritical = req.urgency === 'critical';
            const color =
              req.status === 'resolved'
                ? '#94a3b8'
                : isCritical
                ? '#dc2626'
                : req.status === 'in_progress'
                ? '#2563eb'
                : '#ea580c';
            const iconSymbol = isCritical ? '⚠️' : req.category === 'Medical' ? '⚕️' : '📍';

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
                  <div className="w-64 p-1 space-y-2 text-xs font-sans">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                        {req.trackingCode || req.id}
                      </span>
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

                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase text-[10px] text-red-600 tracking-wider">
                        {req.urgency} • {req.category}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {req.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {req.title}
                    </h4>

                    <p className="text-slate-600 text-[11px] line-clamp-2">
                      {req.description}
                    </p>

                    <p className="text-[10px] text-slate-400 truncate">
                      📍 {req.locationName}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1 font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {req.peopleCount} in distress
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

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-6 left-4 z-20 hidden md:block bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-slate-200 text-xs space-y-2 pointer-events-auto">
        <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-1">
          Disaster Map Legend
        </p>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
          <span>Critical SOS Beacon</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-3 h-3 rounded-full bg-orange-600 inline-block" />
          <span>High Urgency Incident</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-3 h-3 rounded-full border border-dashed border-red-500 bg-red-500/20 inline-block" />
          <span>500m Duplicate Zone</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-3 h-3 rounded-full border border-dashed border-emerald-500 bg-emerald-500/20 inline-block" />
          <span>5km Responder Perimeter</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
          <span>Safe Evacuation Shelter</span>
        </div>
      </div>
    </div>
  );
}
