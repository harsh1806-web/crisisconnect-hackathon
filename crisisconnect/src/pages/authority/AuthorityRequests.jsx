import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  Users,
  ShieldCheck,
  MapPin,
  Clock,
  X,
  Phone,
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthorityRequests() {
  const { requests, ngos, verifyRequest, rejectRequest, assignNGO, updateRequestStatus } =
    useCrisis();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [assignModalReq, setAssignModalReq] = useState(null);
  const [selectedNGOId, setSelectedNGOId] = useState('');

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchSearch =
        !searchTerm ||
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.trackingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.contactName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'pending_verification') return req.verificationStatus === 'pending';
      if (statusFilter === 'verified')
        return req.verificationStatus === 'verified' && !req.assignedNGO && req.status !== 'resolved';
      if (statusFilter === 'assigned') return req.status === 'assigned' || (req.assignedNGO && req.status !== 'resolved');
      if (statusFilter === 'in_progress') return req.status === 'in_progress';
      if (statusFilter === 'resolved') return req.status === 'resolved';
      if (statusFilter === 'rejected') return req.verificationStatus === 'rejected';

      return true;
    });
  }, [requests, searchTerm, statusFilter]);

  const handleConfirmReject = () => {
    if (!rejectModalReq) return;
    rejectRequest(rejectModalReq.id, rejectReason, currentUser?.name || 'Authority EOC');
    setRejectModalReq(null);
    setRejectReason('');
  };

  const handleConfirmAssign = () => {
    if (!assignModalReq || !selectedNGOId) {
      toast.error('Please select an NGO from the registry.');
      return;
    }
    const ngo = ngos.find((n) => n.id === selectedNGOId);
    if (!ngo) return;

    assignNGO(assignModalReq.id, ngo, currentUser?.name || 'Authority EOC');
    setAssignModalReq(null);
    setSelectedNGOId('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 space-y-5 pb-24 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            to="/authority/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">
              Emergency Requests Command Queue
            </h1>
            <p className="text-xs text-slate-500">
              Flow: Verify / Reject ➔ Assign Volunteer/NGO ➔ Update Status ➔ Mark Resolved
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Showing <strong>{filteredRequests.length}</strong> of {requests.length} incidents
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Tracking Code (e.g. CRISIS-103), title, location..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { label: 'All Incidents', value: 'all' },
            { label: 'Pending Verification', value: 'pending_verification', alert: true },
            { label: 'Verified & Ready', value: 'verified' },
            { label: 'Assigned to NGO', value: 'assigned' },
            { label: 'En Route / Active', value: 'in_progress' },
            { label: 'Resolved Safe', value: 'resolved' },
            { label: 'Rejected', value: 'rejected' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => {
            const isPending = req.verificationStatus === 'pending';
            const isVerified = req.verificationStatus === 'verified';
            const isRejected = req.verificationStatus === 'rejected';
            const hasNGO = !!req.assignedNGO;
            const isResolved = req.status === 'resolved';

            return (
              <div
                key={req.id}
                className={`bg-white rounded-3xl border p-5 shadow-xs space-y-3 transition-all ${
                  req.urgency === 'critical'
                    ? 'border-red-300 ring-1 ring-red-100'
                    : 'border-slate-200'
                }`}
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                      {req.trackingCode || req.id}
                    </span>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        req.urgency === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.urgency}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {req.category}
                    </span>
                  </div>

                  {/* Verification & Mission Status Pills */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isRejected
                          ? 'bg-red-100 text-red-800'
                          : isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Verify: {req.verificationStatus}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      Status: {req.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Title and details */}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{req.description}</p>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {req.locationName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {req.peopleCount} in danger
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{req.contactName}</span>
                    {req.contactPhone && (
                      <a
                        href={`tel:${req.contactPhone}`}
                        className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Phone className="w-3 h-3" /> {req.contactPhone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Assigned NGO badge if assigned */}
                {hasNGO && (
                  <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900 text-xs">
                          Deployed NGO: {req.assignedNGO.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Leader: {req.assignedNGO.leader} • Contact: {req.assignedNGO.phone}
                        </p>
                      </div>
                    </div>
                    {req.assignedNGO.phone && (
                      <a
                        href={`tel:${req.assignedNGO.phone}`}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold"
                      >
                        Contact Squad
                      </a>
                    )}
                  </div>
                )}

                {/* Rejection notice if rejected */}
                {isRejected && (
                  <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 space-y-0.5">
                    <span className="font-bold uppercase text-[10px] text-red-700">Rejection Reason:</span>
                    <p>{req.rejectionReason}</p>
                  </div>
                )}

                {/* OPERATIONAL ACTION TOOLBAR (Matching Flowchart) */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Authority Actions:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* 1. Verify / Reject buttons */}
                    {isPending && (
                      <>
                        <button
                          onClick={() => verifyRequest(req.id, currentUser?.name)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                        <button
                          onClick={() => setRejectModalReq(req)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {/* 2. Assign Volunteer / NGO */}
                    {isVerified && !hasNGO && !isResolved && (
                      <button
                        onClick={() => {
                          setAssignModalReq(req);
                          setSelectedNGOId(ngos[0]?.id || '');
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Assign Volunteer / NGO</span>
                      </button>
                    )}

                    {/* 3. Update Status to En Route */}
                    {hasNGO && req.status === 'assigned' && !isResolved && (
                      <button
                        onClick={() => updateRequestStatus(req.id, 'in_progress', currentUser?.name)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Status: Set En Route</span>
                      </button>
                    )}

                    {/* 4. Mark as Resolved */}
                    {!isResolved && !isRejected && (
                      <button
                        onClick={() => updateRequestStatus(req.id, 'resolved', currentUser?.name)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mark as Resolved</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
            <p className="text-sm font-bold text-slate-900">No requests match this filter.</p>
            <button
              onClick={() => setStatusFilter('all')}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Show All Requests
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-2 border-red-500 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" /> Reject Incident Report
              </h3>
              <button
                onClick={() => setRejectModalReq(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Rejecting incident <strong>{rejectModalReq.trackingCode || rejectModalReq.id}</strong> ({rejectModalReq.title}). Please log the reason.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Rejection:
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Duplicate report from same household, verified as false alarm, outside emergency jurisdiction..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Volunteer / NGO Modal */}
      {assignModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-2 border-blue-500 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Assign Volunteer / NGO Squad
              </h3>
              <button
                onClick={() => setAssignModalReq(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Deploy a registered disaster rescue organization to incident{' '}
              <strong>{assignModalReq.trackingCode || assignModalReq.id}</strong>.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Select Response Organization:
              </label>
              {ngos.map((ngo) => (
                <label
                  key={ngo.id}
                  className={`block p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                    selectedNGOId === ngo.id
                      ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-300'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="ngoSelect"
                        checked={selectedNGOId === ngo.id}
                        onChange={() => setSelectedNGOId(ngo.id)}
                        className="text-blue-600"
                      />
                      <span className="font-bold text-slate-900">{ngo.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700">{ngo.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 pl-5">{ngo.specialty}</p>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmAssign}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                Confirm Squad Dispatch
              </button>
              <button
                onClick={() => setAssignModalReq(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
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
