import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Navigation,
  Phone,
  ArrowUpDown,
  MapPin,
  SlidersHorizontal,
  Compass,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { REAL_POLICE_STATIONS, REAL_HOSPITALS } from '../data/emergencyFacilities';

// Haversine distance calculator (km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export default function EmergencyFacilitiesSorterModal({
  userLocation,
  onSelectFacility,
  onNavigate,
  onClose,
  policeStations = REAL_POLICE_STATIONS,
  hospitals = REAL_HOSPITALS,
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'POLICE' | 'HOSPITAL'
  const [sortBy, setSortBy] = useState('DISTANCE'); // 'DISTANCE' | 'NAME' | 'TYPE'
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback reference point (default coordinates Mumbai: 19.0760, 72.8777)
  const userLat = userLocation?.[0] || 19.0760;
  const userLng = userLocation?.[1] || 72.8777;

  // Process combined facilities with real-time distance
  const sortedFacilities = useMemo(() => {
    const list = [
      ...(policeStations || REAL_POLICE_STATIONS).map((f) => ({ ...f, category: 'POLICE' })),
      ...(hospitals || REAL_HOSPITALS).map((f) => ({ ...f, category: 'HOSPITAL' })),
    ].map((f) => {
      const dist = calculateDistance(userLat, userLng, f.lat, f.lng);
      return {
        ...f,
        distanceKm: dist !== null ? parseFloat(dist) : 999,
        distanceFormatted: dist !== null ? `${dist} km` : '--',
      };
    });

    // 1. Filter by category
    let filtered = list;
    if (filterType === 'POLICE') filtered = list.filter((f) => f.category === 'POLICE');
    if (filterType === 'HOSPITAL') filtered = list.filter((f) => f.category === 'HOSPITAL');

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q) ||
          (f.badge || '').toLowerCase().includes(q) ||
          (f.specialty || '').toLowerCase().includes(q)
      );
    }

    // 3. Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'DISTANCE') {
        return a.distanceKm - b.distanceKm;
      }
      if (sortBy === 'NAME') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'TYPE') {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });
  }, [userLat, userLng, filterType, sortBy, searchQuery]);

  const policeCount = REAL_POLICE_STATIONS.length;
  const hospitalCount = REAL_HOSPITALS.length;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Compass className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/40">
                  REAL EMERGENCY INFRASTRUCTURE DIRECTORY
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                Sort Police Stations & 24/7 Hospitals
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Sort Controls Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, area (e.g. Bandra, Kurla, Trauma, Parel)..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Type Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500">Filter:</span>
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                  filterType === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All ({policeCount + hospitalCount})
              </button>

              <button
                onClick={() => setFilterType('POLICE')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'POLICE'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <span>🚓 Police ({policeCount})</span>
              </button>

              <button
                onClick={() => setFilterType('HOSPITAL')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'HOSPITAL'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-white text-red-800 border-red-200 hover:bg-red-50'
                }`}
              >
                <span>🏥 Hospitals ({hospitalCount})</span>
              </button>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="DISTANCE">📍 Nearest to Me (Closest First)</option>
                <option value="NAME">🔤 Name (A - Z)</option>
                <option value="TYPE">🛡️ Facility Type</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Facility List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 bg-slate-100/60">
          {sortedFacilities.length > 0 ? (
            sortedFacilities.map((fac) => {
              const isPolice = fac.category === 'POLICE';
              return (
                <div
                  key={fac.id}
                  className={`p-3.5 rounded-2xl bg-white border shadow-xs transition-all space-y-2 ${
                    isPolice ? 'border-blue-200 hover:border-blue-400' : 'border-rose-200 hover:border-rose-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl p-1.5 rounded-xl bg-slate-50 border border-slate-100">
                        {fac.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-slate-900 text-sm">{fac.name}</h4>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isPolice ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-900'
                            }`}
                          >
                            {isPolice ? 'Police Station' : '24/7 Hospital'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">📍 {fac.address}</p>
                      </div>
                    </div>

                    {/* Distance Badge */}
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono block">
                        {fac.distanceFormatted}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">from GPS</span>
                    </div>
                  </div>

                  {/* Capabilities / Facilities */}
                  <div className="text-[11px] p-2 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                    {isPolice ? (
                      <>
                        <p className="text-slate-700"><strong>Lead:</strong> {fac.leadOfficer}</p>
                        <p className="text-blue-900 font-semibold text-[10px]">🛡️ {fac.availableUnits}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-rose-900 font-semibold text-[10px]">🩺 {fac.specialty}</p>
                        <p className="text-slate-700 text-[10px]">🏥 {fac.facilities}</p>
                      </>
                    )}
                  </div>

                  {/* 3 Quick Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-xs">
                    <a
                      href={`tel:${fac.emergencyHotline || fac.phone}`}
                      className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-1 shadow-2xs"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Dial {fac.emergencyHotline || fac.phone}</span>
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectFacility(fac);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        title="Fly map view directly to this facility"
                      >
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span>Center Map</span>
                      </button>

                      <button
                        onClick={() => {
                          onNavigate(fac);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Navigation className="w-3 h-3 text-blue-200" />
                        <span>Navigate</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              No emergency facilities match "{searchQuery}". Try a different search term.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Displaying {sortedFacilities.length} real verified facilities sorted by {sortBy.toLowerCase()}</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
