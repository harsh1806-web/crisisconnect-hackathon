import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  AlertOctagon,
  Phone,
  ShieldCheck,
  CheckCircle,
  Share2,
  Send,
  Navigation,
  HeartHandshake,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useCrisis } from '../context/CrisisContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Custom Map Pin SVG Icon
const createMarkerIcon = (color = '#ef4444') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">📍</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

export default function RequestDetails() {
  const { id } = useParams();
  const { requests, claimRequest, updateRequestStatus, addUpdateToRequest } = useCrisis();
  const { currentUser, isVolunteer, isCoordinator } = useAuth();
  const [commentText, setCommentText] = useState('');

  const request = requests.find((r) => r.id === id);

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertOctagon className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Request Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested emergency incident does not exist or may have been cleared.
        </p>
        <Link
          to="/requests"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Feed
        </Link>
      </div>
    );
  }

  const isCritical = request.urgency === 'critical';
  const isOpen = request.status === 'open';
  const isInProgress = request.status === 'in_progress';
  const isResolved = request.status === 'resolved';

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Incident link copied to clipboard!');
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addUpdateToRequest(request.id, commentText, currentUser?.name || 'Responder');
    setCommentText('');
  };

  // Stepper state tracking
  const steps = [
    { label: 'Reported & Logged', done: true },
    { label: 'Responder Assigned', done: isInProgress || isResolved },
    { label: 'Relief En Route', done: isInProgress || isResolved },
    { label: 'Resolved / Safe', done: isResolved },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12 animate-fade-in">
      {/* Top back navigation and share */}
      <div className="flex items-center justify-between">
        <Link
          to="/requests"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Requests Feed
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Incident
          </button>
        </div>
      </div>

      {/* Main Request Header Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-8 bg-white border shadow-xs space-y-4 ${
          isCritical ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800">
              {request.category}
            </span>
            <span
              className={`text-xs font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${
                isCritical
                  ? 'bg-red-100 text-red-700 animate-pulse'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {request.urgency} Urgency
            </span>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
              isOpen
                ? 'bg-emerald-100 text-emerald-800'
                : isInProgress
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Status: {request.status.replace('_', ' ')}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
          {request.title}
        </h1>

        <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
          {request.description}
        </p>

        {/* Vulnerability badges */}
        {request.vulnerabilities && request.vulnerabilities.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Vulnerabilities:
            </span>
            {request.vulnerabilities.map((v, i) => (
              <span
                key={i}
                className="text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-lg"
              >
                ⚠️ {v}
              </span>
            ))}
          </div>
        )}

        {/* Status Stepper */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Response Progress Pipeline:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  step.done
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="text-xs flex items-center justify-center gap-1">
                  {step.done ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block text-[9px]">
                      {idx + 1}
                    </span>
                  )}
                  <span>{step.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Details & Action vs Map & Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Responder & Contact Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Action Card for Volunteers & Coordinators */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-red-500" /> Emergency Actions
            </h2>

            {isOpen && isVolunteer && (
              <button
                onClick={() => claimRequest(request.id, currentUser)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <HeartHandshake className="w-5 h-5" />
                <span>Accept Mission & Respond</span>
              </button>
            )}

            {isInProgress && (isVolunteer || isCoordinator) && (
              <button
                onClick={() => updateRequestStatus(request.id, 'resolved', currentUser?.name)}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Mark as Mission Completed / Safe</span>
              </button>
            )}

            {isResolved && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600 font-semibold">
                This emergency mission is completed.
              </div>
            )}

            {request.contactPhone && (
              <a
                href={`tel:${request.contactPhone}`}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Direct Call Requester</span>
              </a>
            )}
          </div>

          {/* Incident Metadata */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3 text-xs text-slate-600">
            <h2 className="text-base font-bold text-slate-900">Incident Details</h2>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-medium text-slate-500">Requester Name:</span>
              <span className="font-bold text-slate-900">{request.contactName}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-medium text-slate-500">Contact Number:</span>
              <span className="font-bold text-slate-900">{request.contactPhone}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-medium text-slate-500">People Needing Aid:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Users className="w-4 h-4 text-slate-400" /> {request.peopleCount}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-medium text-slate-500">Exact Address:</span>
              <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">
                {request.locationName}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="font-medium text-slate-500">GPS Coordinates:</span>
              <span className="font-mono font-bold text-slate-900">
                {request.lat.toFixed(4)}, {request.lng.toFixed(4)}
              </span>
            </div>

            {request.assignedVolunteer && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Assigned Responder:
                </p>
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{request.assignedVolunteer.name}</p>
                    <p className="text-[10px] text-blue-700 font-semibold">{request.assignedVolunteer.role}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mini Leaflet Map & Timeline Activity */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mini Leaflet Map */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" /> Incident Location
              </h2>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${request.lat},${request.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" /> External GPS Navigation
              </a>
            </div>

            <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200">
              <MapContainer
                center={[request.lat, request.lng]}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[request.lat, request.lng]}
                  icon={createMarkerIcon(isCritical ? '#ef4444' : '#f59e0b')}
                >
                  <Popup>
                    <div className="text-xs font-sans">
                      <p className="font-bold text-slate-900">{request.title}</p>
                      <p className="text-slate-600">{request.locationName}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* Timeline & Real-time updates Feed */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" /> Live Response Updates & Log
            </h2>

            {/* Updates list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {request.updates && request.updates.length > 0 ? (
                request.updates.map((up) => (
                  <div key={up.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{up.author}</span>
                      <span className="text-[10px] text-slate-400">{up.timestamp}</span>
                    </div>
                    <p className="text-slate-700">{up.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No updates logged yet.</p>
              )}
            </div>

            {/* Add update form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Post update (e.g. Arrived at location, road clear)..."
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
