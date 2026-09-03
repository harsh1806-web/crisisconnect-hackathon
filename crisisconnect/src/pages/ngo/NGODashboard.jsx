import { useState } from 'react';
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
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function NGODashboard() {
  const { requests, donations, recordDonation, updateNGOMission, updateRequestStatus } =
    useCrisis();
  const { currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('missions'); // 'missions' | 'donations'

  // Donation form state
  const [donorName, setDonorName] = useState('');
  const [donationType, setDonationType] = useState('Supplies');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationItems, setDonationItems] = useState('');

  // Deploy squad modal / dispatch note state
  const [activeDeployReq, setActiveDeployReq] = useState(null);
  const [squadVehicle, setSquadVehicle] = useState('Rescue Zodiac Boat #2');
  const [dispatchNote, setDispatchNote] = useState('');

  // Filter missions assigned to this NGO or available for rescue
  const myMissions = requests.filter(
    (r) =>
      r.assignedNGO?.name?.toLowerCase().includes('red cross') ||
      r.assignedNGO?.name?.toLowerCase().includes('ngo') ||
      r.assignedNGO?.id === currentUser?.ngoId ||
      r.status === 'assigned'
  );

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

  const handleConfirmDeploy = () => {
    if (!activeDeployReq) return;
    const note = dispatchNote.trim()
      ? dispatchNote
      : `Squad deployed with ${squadVehicle}. En route to site.`;

    updateNGOMission(activeDeployReq.id, note, currentUser?.name || 'NGO Field Commander');
    setActiveDeployReq(null);
    setDispatchNote('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5 pb-24 animate-fade-in">
      {/* Top NGO Profile Header */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-5 border border-emerald-800/40 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Relief NGO Operations
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Verified
                </span>
              </div>
              <h1 className="text-lg font-black text-white">
                {currentUser?.ngoName || 'Red Cross Disaster Relief Corps'}
              </h1>
              <p className="text-xs text-slate-300">
                Lead: <span className="font-semibold text-white">{currentUser?.name || 'Dr. Ananya Sen'}</span> • Field Units on Call: 14 Squads
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors self-end sm:self-center"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-800/40 text-center">
          <div className="p-2 rounded-xl bg-black/20">
            <span className="text-[10px] text-emerald-300 uppercase font-bold block">
              Assigned Missions
            </span>
            <span className="text-lg font-black text-white">{myMissions.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-black/20">
            <span className="text-[10px] text-emerald-300 uppercase font-bold block">
              Volunteers Deployed
            </span>
            <span className="text-lg font-black text-white">48 Active</span>
          </div>
          <div className="p-2 rounded-xl bg-black/20">
            <span className="text-[10px] text-emerald-300 uppercase font-bold block">
              Relief Funds
            </span>
            <span className="text-lg font-black text-emerald-400">
              ${donations.totalFundsRaised.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Dual-Hub Navigation Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-200/80 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('missions')}
          className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'missions'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Volunteer Services & Field Missions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('donations')}
          className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'donations'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 text-blue-600" />
          <span>Donation & Supplies Management</span>
        </button>
      </div>

      {/* TAB 1: VOLUNTEER SERVICE & RESCUE MISSIONS */}
      {activeTab === 'missions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Rescue Missions Assigned to Your NGO ({myMissions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Authorized by Disaster Authority Command for on-site execution
              </p>
            </div>
            <Link to="/map" className="text-xs text-emerald-600 font-bold hover:underline">
              Live Map View →
            </Link>
          </div>

          <div className="space-y-3">
            {myMissions.length > 0 ? (
              myMissions.map((req) => (
                <div
                  key={req.id}
                  className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-slate-100 text-slate-900 px-2 py-0.5 rounded">
                        {req.trackingCode || req.id}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 uppercase">
                        {req.urgency}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {req.category}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize bg-blue-50 text-blue-700 border border-blue-200">
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{req.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{req.description}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {req.locationName} • {req.peopleCount} citizens
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{req.contactName}</span>
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
                      {/* Deploy squad button */}
                      <button
                        onClick={() => setActiveDeployReq(req)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Deploy Squad / Log Update</span>
                      </button>

                      {/* Mark resolved */}
                      {req.status !== 'resolved' && (
                        <button
                          onClick={() => updateRequestStatus(req.id, 'resolved', currentUser?.ngoName)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>Mark Safe</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                <p className="text-sm font-bold text-slate-900">No missions pending for this NGO.</p>
                <p className="text-xs text-slate-500">Authorities assign missions from the incident queue.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DONATIONS & RELIEF INVENTORY */}
      {activeTab === 'donations' && (
        <div className="space-y-4">
          {/* Inventory Progress Bars */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" /> Live Relief Supplies Inventory
            </h2>

            <div className="space-y-2.5">
              {donations.supplies.map((item) => {
                const percent = Math.min(100, Math.round((item.available / item.target) * 100));
                return (
                  <div key={item.id} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>{item.name}</span>
                      <span>
                        {item.available} / {item.target} {item.unit} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Record Incoming Donation / Drop */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-blue-600" /> Log Incoming Relief Donation / Supply Drop
            </h3>

            <form onSubmit={handleRecordDonationSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Donor / Organization Name
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="e.g. Metro Citizens Club"
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
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option>Supplies</option>
                    <option>Monetary Fund</option>
                    <option>Medical Kits</option>
                  </select>
                </div>
              </div>

              {donationType === 'Monetary Fund' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Amount in USD ($)
                  </label>
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Items & Quantity Description
                  </label>
                  <input
                    type="text"
                    value={donationItems}
                    onChange={(e) => setDonationItems(e.target.value)}
                    placeholder="e.g. 200 Packets Dry Rations & 50 Water Cans"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                Record Donation to Relief Pool
              </button>
            </form>
          </div>

          {/* Recent Donor Contributions */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Contributions Log
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {donations.recentDonations.map((d) => (
                <div key={d.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{d.donor}</p>
                    <p className="text-[10px] text-slate-500">{d.items} • {d.timestamp}</p>
                  </div>
                  {d.amount > 0 && (
                    <span className="font-black text-emerald-700 font-mono text-xs">
                      +${d.amount.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deploy Squad / Log Mission Update Modal */}
      {activeDeployReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-2 border-emerald-500 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" /> Deploy Field Squad / Update Progress
            </h3>

            <p className="text-xs text-slate-600">
              Updating incident <strong>{activeDeployReq.trackingCode || activeDeployReq.id}</strong> ({activeDeployReq.title}).
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Vehicle / Boat:
                </label>
                <select
                  value={squadVehicle}
                  onChange={(e) => setSquadVehicle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                >
                  <option>Rescue Zodiac Boat #2</option>
                  <option>Emergency Mobile Medical Van #4</option>
                  <option>High-Clearance 4x4 Supply Truck</option>
                  <option>Inflatable Evacuation Raft 1A</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Note / Progress Update:
                </label>
                <textarea
                  rows={2}
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  placeholder="e.g. Squad en route with food packets and medical cooler, ETA 15 mins..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConfirmDeploy}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                Confirm Dispatch
              </button>
              <button
                onClick={() => setActiveDeployReq(null)}
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
