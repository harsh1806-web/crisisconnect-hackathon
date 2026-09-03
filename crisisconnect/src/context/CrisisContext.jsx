import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  INITIAL_CRISIS_INFO,
  INITIAL_BROADCASTS,
  INITIAL_REQUESTS,
  INITIAL_SHELTERS,
} from '../data/mockData';
import toast from 'react-hot-toast';

const CrisisContext = createContext(null);

export function CrisisProvider({ children }) {
  const [baseCrisisInfo] = useState(INITIAL_CRISIS_INFO);
  const [broadcasts, setBroadcasts] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_broadcasts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_BROADCASTS;
      }
    }
    return INITIAL_BROADCASTS;
  });

  const [shelters] = useState(INITIAL_SHELTERS);

  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_REQUESTS;
      }
    }
    return INITIAL_REQUESTS;
  });

  // Save changes to localStorage for persistent hackathon demo experience
  useEffect(() => {
    localStorage.setItem('crisisconnect_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('crisisconnect_broadcasts', JSON.stringify(broadcasts));
  }, [broadcasts]);

  // Recalculate stats dynamically based on current requests as derived state
  const crisisInfo = useMemo(() => {
    const activeReqs = requests.filter((r) => r.status !== 'resolved').length;
    const criticalReqs = requests.filter((r) => r.urgency === 'critical' && r.status !== 'resolved').length;
    const resolvedReqs = requests.filter((r) => r.status === 'resolved').length;

    return {
      ...baseCrisisInfo,
      stats: {
        ...baseCrisisInfo.stats,
        activeRequests: activeReqs,
        criticalSOS: criticalReqs,
        rescuesCompleted: 60 + resolvedReqs,
      },
    };
  }, [baseCrisisInfo, requests]);

  // Add a new request (from CreateRequest form)
  const addRequest = (newRequestData) => {
    const newReq = {
      id: `req-${Date.now()}`,
      title: newRequestData.title || 'Emergency Assistance Requested',
      category: newRequestData.category || 'General',
      urgency: newRequestData.urgency || 'high',
      status: 'open',
      description: newRequestData.description || '',
      locationName: newRequestData.locationName || 'Near Sector Coordinates',
      lat: newRequestData.lat || 13.0827 + (Math.random() - 0.5) * 0.02,
      lng: newRequestData.lng || 80.2707 + (Math.random() - 0.5) * 0.02,
      peopleCount: Number(newRequestData.peopleCount) || 1,
      vulnerabilities: newRequestData.vulnerabilities || [],
      contactName: newRequestData.contactName || 'Anonymous Citizen',
      contactPhone: newRequestData.contactPhone || '+1-555-0100',
      createdAt: new Date().toISOString(),
      assignedVolunteer: null,
      updates: [
        {
          id: `up-${Date.now()}`,
          author: newRequestData.contactName || 'Requester',
          text: 'Request logged into CrisisConnect system. Responders alerted.',
          timestamp: 'Just now',
        },
      ],
    };

    setRequests((prev) => [newReq, ...prev]);
    toast.success('Emergency request broadcasted to all nearby responders!', {
      duration: 5000,
    });
    return newReq;
  };

  // One-Touch SOS Quick Dispatch
  const triggerSOS = (coords, customDetails = {}) => {
    const lat = coords?.lat || 13.0835 + (Math.random() - 0.5) * 0.015;
    const lng = coords?.lng || 80.2725 + (Math.random() - 0.5) * 0.015;

    const sosReq = {
      id: `sos-${Date.now()}`,
      title: '🚨 CRITICAL SOS: Immediate Life-Threatening Emergency',
      category: 'Rescue',
      urgency: 'critical',
      status: 'open',
      description:
        customDetails.description ||
        'Automated SOS beacon activated. User reported immediate distress. Real-time GPS coordinates recorded.',
      locationName: customDetails.locationName || `GPS Beacon: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`,
      lat,
      lng,
      peopleCount: customDetails.peopleCount || 1,
      vulnerabilities: ['Urgent SOS', 'Immediate Threat'],
      contactName: customDetails.contactName || 'Distressed Citizen',
      contactPhone: customDetails.contactPhone || '+1-555-EMERGENCY',
      createdAt: new Date().toISOString(),
      isSOS: true,
      assignedVolunteer: null,
      updates: [
        {
          id: `up-sos-${Date.now()}`,
          author: 'CrisisConnect SOS Dispatch',
          text: 'High-priority SOS signal transmitted to EOC and nearest mobile units.',
          timestamp: 'Just now',
        },
      ],
    };

    setRequests((prev) => [sosReq, ...prev]);

    // Audio beep simulation via Web Audio API for sensory feedback
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted before interaction
    }

    toast.error('🚨 CRITICAL SOS BROADCASTED! First responders notified.', {
      duration: 6000,
      icon: '🚨',
    });

    return sosReq;
  };

  // Claim a request as a volunteer
  const claimRequest = (requestId, volunteer) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          const updated = {
            ...req,
            status: 'in_progress',
            assignedVolunteer: {
              id: volunteer.id,
              name: volunteer.name,
              role: volunteer.roleLabel || 'Volunteer Responder',
              phone: volunteer.phone,
              eta: 'En Route',
            },
            updates: [
              ...req.updates,
              {
                id: `up-${Date.now()}`,
                author: volunteer.name,
                text: `${volunteer.name} accepted this mission and is en route.`,
                timestamp: 'Just now',
              },
            ],
          };
          return updated;
        }
        return req;
      })
    );
    toast.success('Mission accepted! Requester updated that you are on the way.');
  };

  // Update status (e.g. resolve)
  const updateRequestStatus = (requestId, newStatus, authorName = 'Coordinator') => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          const statusLabels = {
            open: 'Reopened request for responders',
            in_progress: 'Marked in progress',
            resolved: 'Mission marked as Completed / Aid Delivered',
          };
          return {
            ...req,
            status: newStatus,
            updates: [
              ...req.updates,
              {
                id: `up-${Date.now()}`,
                author: authorName,
                text: statusLabels[newStatus] || `Status updated to ${newStatus}`,
                timestamp: 'Just now',
              },
            ],
          };
        }
        return req;
      })
    );
    toast.success(`Request status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
  };

  // Add comment / timeline update
  const addUpdateToRequest = (requestId, text, authorName) => {
    if (!text.trim()) return;
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          return {
            ...req,
            updates: [
              ...req.updates,
              {
                id: `up-${Date.now()}`,
                author: authorName || 'Responder',
                text,
                timestamp: 'Just now',
              },
            ],
          };
        }
        return req;
      })
    );
    toast.success('Update logged to request timeline.');
  };

  // Dismiss a broadcast alert
  const dismissBroadcast = (broadcastId) => {
    setBroadcasts((prev) => prev.filter((b) => b.id !== broadcastId));
    toast('Broadcast alert dismissed', { icon: 'ℹ️' });
  };

  // Broadcast a new emergency advisory (Coordinator role)
  const createBroadcast = (title, message, severity = 'critical') => {
    const newBroadcast = {
      id: `alert-${Date.now()}`,
      severity,
      title,
      message,
      timestamp: 'Just now',
    };
    setBroadcasts((prev) => [newBroadcast, ...prev]);
    toast.success('Emergency Broadcast published across the network!');
  };

  // Reset demo data helper for testing
  const resetDemoData = () => {
    localStorage.removeItem('crisisconnect_requests');
    localStorage.removeItem('crisisconnect_broadcasts');
    setRequests(INITIAL_REQUESTS);
    setBroadcasts(INITIAL_BROADCASTS);
    toast.success('Demo data restored to default scenario.');
  };

  return (
    <CrisisContext.Provider
      value={{
        crisisInfo,
        broadcasts,
        shelters,
        requests,
        addRequest,
        triggerSOS,
        claimRequest,
        updateRequestStatus,
        addUpdateToRequest,
        dismissBroadcast,
        createBroadcast,
        resetDemoData,
      }}
    >
      {children}
    </CrisisContext.Provider>
  );
}

export function useCrisis() {
  const context = useContext(CrisisContext);
  if (!context) {
    throw new Error('useCrisis must be used within a CrisisProvider');
  }
  return context;
}
