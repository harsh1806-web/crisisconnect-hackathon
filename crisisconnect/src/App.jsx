import { useState } from 'react';
import { sampleRequests } from './database/sampleRequests';
import { sampleUsers } from './database/sampleUsers';
import './App.css';

function App() {
  const [emergencies, setEmergencies] = useState(sampleRequests);
  const [activeTab, setActiveTab] = useState('All');
  const [roleFilter, setRoleFilter] = useState('usr_authority_01');
  const [searchToken, setSearchToken] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New Emergency Form state
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Medical');
  const [newSeverity, setNewSeverity] = useState('High');
  const [newPriority, setNewPriority] = useState('P1');
  const [newAddress, setNewAddress] = useState('101 Howard St, San Francisco, CA');

  // Filter emergencies based on active Tab, Role, and Search Query
  const filteredEmergencies = emergencies.filter(e => {
    const matchesTab = activeTab === 'All' || e.status === activeTab;
    const matchesSearch = searchToken === '' || 
      e.token.toLowerCase().includes(searchToken.toLowerCase()) ||
      e.description.toLowerCase().includes(searchToken.toLowerCase()) ||
      e.category.toLowerCase().includes(searchToken.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Calculate quick platform stats
  const totalCount = emergencies.length;
  const criticalP1Count = emergencies.filter(e => e.priority === 'P1').length;
  const activeDispatchedCount = emergencies.filter(e => e.status === 'Dispatched' || e.status === 'In Progress').length;
  const resolvedCount = emergencies.filter(e => e.status === 'Resolved').length;

  // Handle status updates (Simulator for Firestore arrayUnion & updateDoc)
  const handleUpdateStatus = (id, newStatus) => {
    setEmergencies(prev => prev.map(item => {
      if (item.id === id) {
        const updatedHistory = [
          ...item.statusHistory,
          {
            status: newStatus,
            updatedAt: new Date().toISOString(),
            updatedBy: roleFilter
          }
        ];
        return {
          ...item,
          status: newStatus,
          statusHistory: updatedHistory,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    }));
  };

  // Submit new Emergency request
  const handleCreateEmergency = (e) => {
    e.preventDefault();
    const token = `CC-${Math.floor(100000 + Math.random() * 900000)}`;
    const newEmergency = {
      id: `emg_${Date.now()}`,
      token: token,
      userId: "usr_citizen_01",
      userName: "Jane Doe",
      description: newDesc,
      language: "en",
      category: newCategory,
      severity: newSeverity,
      priority: newPriority,
      assignedAuthority: "auth_ems_sf",
      assignedAuthorityName: "SF General EMS",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: newAddress
      },
      status: "Submitted",
      statusHistory: [
        {
          status: "Submitted",
          updatedAt: new Date().toISOString(),
          updatedBy: "usr_citizen_01"
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEmergencies([newEmergency, ...emergencies]);
    setShowModal(false);
    setNewDesc('');
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-title">
          <h1>CrisisConnect</h1>
          <div className="live-badge">
            <span className="pulse-dot"></span>
            Realtime Firestore Active
          </div>
        </div>

        <div className="role-selector">
          <span>Active Persona:</span>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="usr_authority_01">Captain Vance (Authority Dispatch)</option>
            <option value="usr_citizen_01">Jane Doe (Citizen)</option>
            <option value="usr_volunteer_01">Alex Rivera (Volunteer)</option>
          </select>
        </div>
      </header>

      {/* Platform Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Emergencies</span>
          <span className="stat-value">{totalCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Critical (P1 Priority)</span>
          <span className="stat-value" style={{ color: '#ff3b30' }}>{criticalP1Count}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Units Dispatched / Active</span>
          <span className="stat-value" style={{ color: '#ff9500' }}>{activeDispatchedCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Resolved Incidents</span>
          <span className="stat-value" style={{ color: '#34c759' }}>{resolvedCount}</span>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="controls-bar">
        <div className="tabs-group">
          {['All', 'Submitted', 'Acknowledged', 'Dispatched', 'In Progress', 'Resolved'].map(tab => (
            <button 
              key={tab} 
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search Token (e.g. CC-982410)..."
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Report Emergency
        </button>
      </div>

      {/* Emergency Grid */}
      <div className="emergency-grid">
        {filteredEmergencies.map(item => (
          <div key={item.id} className={`emergency-card priority-border-${item.priority}`}>
            <div className="card-top">
              <span className="token-badge">{item.token}</span>
              <span className={`priority-tag badge-${item.priority}`}>{item.priority} - {item.severity}</span>
            </div>

            <h3 style={{ margin: '6px 0', fontSize: '1.1rem' }}>{item.category} Request</h3>
            <div className="card-desc">{item.description}</div>

            <div className="card-meta">
              <span><strong>Location:</strong> {item.location.address}</span>
              <span><strong>Assigned:</strong> {item.assignedAuthorityName}</span>
              <span><strong>Reported By:</strong> {item.userName}</span>
            </div>

            {/* Status Timeline */}
            <div className="status-timeline">
              {['Submitted', 'Acknowledged', 'Dispatched', 'In Progress', 'Resolved'].map((st, idx) => {
                const isPassed = item.statusHistory.some(h => h.status === st);
                return (
                  <div key={st} className={`timeline-step ${isPassed ? 'active' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div>{st}</div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons for Responders */}
            <div className="action-buttons">
              {item.status === 'Submitted' && (
                <button className="btn-action" onClick={() => handleUpdateStatus(item.id, 'Acknowledged')}>
                  Acknowledge
                </button>
              )}
              {item.status === 'Acknowledged' && (
                <button className="btn-action" onClick={() => handleUpdateStatus(item.id, 'Dispatched')}>
                  Dispatch Response Unit
                </button>
              )}
              {item.status === 'Dispatched' && (
                <button className="btn-action" onClick={() => handleUpdateStatus(item.id, 'In Progress')}>
                  Mark In Progress
                </button>
              )}
              {item.status === 'In Progress' && (
                <button className="btn-action" style={{ background: '#34c759' }} onClick={() => handleUpdateStatus(item.id, 'Resolved')}>
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Emergency Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 style={{ marginTop: 0 }}>Report Emergency</h2>
            <form onSubmit={handleCreateEmergency}>
              <div className="form-group">
                <label>Category</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                  <option value="Medical">Medical Emergency</option>
                  <option value="Fire">Fire Surge</option>
                  <option value="Flood">Flooding / Disaster</option>
                  <option value="Accident">Vehicle Collision</option>
                  <option value="Crime">Public Safety / Crime</option>
                  <option value="Hazard">Environmental Hazard</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value)}>
                  <option value="P1">P1 - Immediate Danger to Life</option>
                  <option value="P2">P2 - High Urgency</option>
                  <option value="P3">P3 - Medium Priority</option>
                  <option value="P4">P4 - Low Urgency</option>
                </select>
              </div>

              <div className="form-group">
                <label>Location</label>
                <input 
                  type="text" 
                  value={newAddress} 
                  onChange={e => setNewAddress(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Description of Incident</label>
                <textarea 
                  rows="3"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Describe the situation in detail..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn-action" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Emergency Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
