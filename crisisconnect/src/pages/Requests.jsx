import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  Grid,
  List,
  SlidersHorizontal,
  AlertOctagon,
  ChevronDown,
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import RequestCard from '../components/RequestCard';

export default function Requests() {
  const { requests } = useCrisis();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || 'all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const categories = ['Rescue', 'Medical', 'Food & Water', 'Shelter', 'Power & Comms', 'General'];
  const urgencies = ['critical', 'high', 'medium', 'low'];

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Search term
      const matchesSearch =
        !searchTerm ||
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.contactName.toLowerCase().includes(searchTerm.toLowerCase());

      // Status
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

      // Category
      const matchesCategory =
        categoryFilter === 'all' || req.category.toLowerCase() === categoryFilter.toLowerCase();

      // Urgency
      const matchesUrgency = urgencyFilter === 'all' || req.urgency === urgencyFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesUrgency;
    });
  }, [requests, searchTerm, statusFilter, categoryFilter, urgencyFilter]);

  const priorityWeight = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const sortedByPriority = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      const pA = a.isSOS ? 5 : (priorityWeight[a.urgency?.toLowerCase()] || 2);
      const pB = b.isSOS ? 5 : (priorityWeight[b.urgency?.toLowerCase()] || 2);
      if (pB !== pA) return pB - pA;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [filteredRequests]);

  const [showMoreAlerts, setShowMoreAlerts] = useState(false);

  const highestPriorityAlert = sortedByPriority[0];
  const remainingAlerts = sortedByPriority.slice(1);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setUrgencyFilter('all');
    setSearchParams({});
  };

  const hasActiveFilters =
    searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || urgencyFilter !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Disaster Relief Request Feed
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Browse, filter, and volunteer for community emergency assistance requests
          </p>
        </div>

        <Link
          to="/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-500/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Request</span>
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Search input and View Mode */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by keywords, street name, category..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
                title="Compact List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {[
            { label: 'All', value: 'all' },
            { label: 'Open', value: 'open' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Resolved', value: 'resolved' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category & Urgency Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Urgency Level
            </label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Urgency Levels</option>
              {urgencies.map((u) => (
                <option key={u} value={u}>
                  {u.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Meta */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
        <span>
          Showing <strong>{filteredRequests.length}</strong> of {requests.length} requests
        </span>
        {hasActiveFilters && (
          <span className="text-amber-600 font-bold">Filtered Results Active</span>
        )}
      </div>

      {/* Request Cards: 1 Highest Priority Alert First + Show More Toggle */}
      {sortedByPriority.length > 0 ? (
        <div className="space-y-4">
          {/* 1. Highest Priority Alert Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5 animate-pulse">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                Highest Priority Alert (Action Required)
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 uppercase">
                {highestPriorityAlert.isSOS ? 'SOS CRITICAL' : highestPriorityAlert.urgency || 'Critical'}
              </span>
            </div>
            
            <div className="rounded-3xl border-2 border-red-500 shadow-lg p-1 bg-red-50/15">
              <RequestCard request={highestPriorityAlert} />
            </div>
          </div>

          {/* 2. Remaining Alerts Collapsed Under Show More */}
          {remainingAlerts.length > 0 && (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => setShowMoreAlerts(!showMoreAlerts)}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-800 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showMoreAlerts ? 'rotate-180 text-red-600' : 'text-slate-500'}`} />
                <span>
                  {showMoreAlerts
                    ? 'Show Less'
                    : `Show More Alerts & Incidents (${remainingAlerts.length} more)`}
                </span>
              </button>

              {showMoreAlerts && (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in'
                      : 'flex flex-col gap-3 animate-fade-in'
                  }
                >
                  {remainingAlerts.map((req) => (
                    <RequestCard key={req.id} request={req} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <SlidersHorizontal className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No active incidents reported</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Emergency requests triggered by citizens or authorities will appear here in real time.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
