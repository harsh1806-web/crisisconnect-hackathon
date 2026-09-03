import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  INITIAL_CRISIS_INFO,
  INITIAL_BROADCASTS,
  INITIAL_REQUESTS,
  INITIAL_SHELTERS,
  REGISTERED_NGOS,
} from '../data/mockData';
import toast from 'react-hot-toast';
import {
  createCrisisRequest,
  subscribeToRequests,
  updateRequestStatus as serviceUpdateRequestStatus,
  verifyCrisisRequest as serviceVerifyCrisisRequest,
} from '../services/requestService.js';
import { triggerDeviceNotification } from '../services/notificationService.js';

const CrisisContext = createContext(null);

export function CrisisProvider({ children }) {
  const [baseCrisisInfo] = useState(INITIAL_CRISIS_INFO);
  const [shelters] = useState(INITIAL_SHELTERS);
  const [ngos] = useState(REGISTERED_NGOS);

  const [broadcasts, setBroadcasts] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_broadcasts_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_BROADCASTS;
      }
    }
    return INITIAL_BROADCASTS;
  });

  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_requests_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_REQUESTS;
      }
    }
    return INITIAL_REQUESTS;
  });

  useEffect(() => {
    localStorage.setItem('crisisconnect_requests_v2', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('crisisconnect_broadcasts_v2', JSON.stringify(broadcasts));
  }, [broadcasts]);

  // Connect to Live Firestore requests if available
  useEffect(() => {
    try {
      const unsubscribe = subscribeToRequests((liveRequests) => {
        if (liveRequests && liveRequests.length > 0) {
          setRequests((prev) => {
            const liveMap = new Map(liveRequests.map((r) => [r.id, r]));
            const merged = [...liveRequests];
            for (const req of prev) {
              if (!liveMap.has(req.id)) {
                merged.push(req);
              }
            }
            return merged;
          });
        }
      });
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    } catch {
      // Fallback silently if offline or demo credentials
    }
  }, []);

  // Derived statistics for Authorities & Dashboard
  const crisisInfo = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.verificationStatus === 'pending').length;
    const verified = requests.filter(
      (r) => r.verificationStatus === 'verified' && r.status !== 'resolved'
    ).length;
    const assigned = requests.filter(
      (r) => r.status === 'assigned' || r.status === 'in_progress'
    ).length;
    const resolved = requests.filter((r) => r.status === 'resolved').length;

    return {
      ...baseCrisisInfo,
      stats: {
        totalRequests: total,
        pendingVerification: pending,
        verifiedActive: verified,
        assignedMissions: assigned,
        rescuesCompleted: 60 + resolved,
      },
    };
  }, [baseCrisisInfo, requests]);

  // 1. Citizen Action: Create Emergency Request
  const addRequest = (requestData) => {
    const codeNum = Math.floor(100 + Math.random() * 900);
    const trackingCode = `CRISIS-${codeNum}`;

    const newReq = {
      id: `req-${Date.now()}`,
      trackingCode,
      title: requestData.title || 'Immediate Emergency Assistance',
      category: requestData.category || 'Rescue',
      urgency: requestData.urgency || 'high',
      verificationStatus: 'pending',
      status: 'pending_verification',
      description: requestData.description || '',
      locationName: requestData.locationName || 'GPS Location Tagged',
      lat: requestData.lat || 13.0827 + (Math.random() - 0.5) * 0.02,
      lng: requestData.lng || 80.2707 + (Math.random() - 0.5) * 0.02,
      peopleCount: Number(requestData.peopleCount) || 1,
      vulnerabilities: requestData.vulnerabilities || [],
      contactName: requestData.contactName || 'Citizen in Need',
      contactPhone: requestData.contactPhone || '+1-555-0100',
      createdAt: new Date().toISOString(),
      assignedNGO: null,
      updates: [
        {
          id: `up-${Date.now()}`,
          author: 'Emergency System',
          text: `Request logged under Reference ${trackingCode}. Dispatched to Authority Queue for verification.`,
          timestamp: 'Just now',
        },
      ],
    };

    setRequests((prev) => [newReq, ...prev]);
    toast.success(`Request ${trackingCode} submitted! Authorities alerted.`);

    // Persist to backend Firestore and broadcast notification
    try {
      createCrisisRequest({
        title: newReq.title,
        description: newReq.description,
        category: (newReq.category || 'OTHER').toUpperCase(),
        urgency: (newReq.urgency || 'MEDIUM').toUpperCase(),
        mobileNo: newReq.contactPhone,
        peopleCount: newReq.peopleCount,
        location: {
          lat: newReq.lat,
          lng: newReq.lng,
          address: newReq.locationName,
        },
      }).catch(() => {});
      triggerDeviceNotification(`🚨 NEW EMERGENCY: ${newReq.category}`, {
        body: `${newReq.title} at ${newReq.locationName}`,
      });
    } catch {
      // Offline fallback
    }

    return newReq;
  };

  // 2. Citizen Action: SOS Trigger
  const triggerSOS = (coords, customDetails = {}) => {
    const lat = coords?.lat || 13.0835 + (Math.random() - 0.5) * 0.015;
    const lng = coords?.lng || 80.2725 + (Math.random() - 0.5) * 0.015;
    const trackingCode = `SOS-${Math.floor(100 + Math.random() * 900)}`;

    const sosReq = {
      id: `sos-${Date.now()}`,
      trackingCode,
      title: '🚨 CRITICAL LIFE-THREATENING SOS BEACON',
      category: 'Rescue',
      urgency: 'critical',
      verificationStatus: 'verified', // SOS is auto-verified priority
      status: 'verified',
      description:
        customDetails.description ||
        'Citizen triggered immediate red emergency panic beacon. Immediate evacuation / life hazard reported.',
      locationName: customDetails.locationName || `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
      peopleCount: customDetails.peopleCount || 1,
      vulnerabilities: ['Immediate Distress', 'Life Hazard'],
      contactName: customDetails.contactName || 'Emergency Victim',
      contactPhone: customDetails.contactPhone || '+1-555-URGENT',
      createdAt: new Date().toISOString(),
      isSOS: true,
      assignedNGO: null,
      updates: [
        {
          id: `up-${Date.now()}`,
          author: 'Emergency EOC Relay',
          text: 'Critical SOS beacon transmitted on priority channel to Response Authorities.',
          timestamp: 'Just now',
        },
      ],
    };

    setRequests((prev) => [sosReq, ...prev]);

    // Persist to backend Firestore and broadcast audio siren
    try {
      createCrisisRequest({
        title: sosReq.title,
        description: sosReq.description,
        category: 'RESCUE',
        urgency: 'CRITICAL',
        mobileNo: sosReq.contactPhone,
        peopleCount: sosReq.peopleCount,
        location: {
          lat: sosReq.lat,
          lng: sosReq.lng,
          address: sosReq.locationName,
        },
      }).catch(() => {});
      triggerDeviceNotification('🚨 CRITICAL SOS BEACON BROADCASTED', {
        body: `Immediate rescue required at ${sosReq.locationName}`,
      });
    } catch {
      // Offline fallback
    }

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Audio context may be restricted
    }

    toast.error('🚨 Critical SOS Dispatched to Emergency Operations Command!', {
      duration: 5000,
    });
    return sosReq;
  };

  // 3. Authority Action: Verify Request
  const verifyRequest = (requestId, authorityName = 'Authority EOC') => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            verificationStatus: 'verified',
            status: 'verified',
            updates: [
              ...r.updates,
              {
                id: `up-${Date.now()}`,
                author: authorityName,
                text: 'Incident details verified by Disaster Management Authority. Ready for NGO / Squad assignment.',
                timestamp: 'Just now',
              },
            ],
          };
        }
        return r;
      })
    );
    toast.success('Incident verified & cleared for NGO deployment!');

    // Persist verification to Firestore
    try {
      serviceVerifyCrisisRequest(requestId, { name: authorityName, role: 'ORGANIZATION' }).catch(() => {});
    } catch {
      // Offline fallback
    }
  };

  // 4. Authority Action: Reject Request
  const rejectRequest = (requestId, reason, authorityName = 'Authority EOC') => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            verificationStatus: 'rejected',
            status: 'rejected',
            rejectionReason: reason || 'Information could not be validated / duplicate alert.',
            updates: [
              ...r.updates,
              {
                id: `up-${Date.now()}`,
                author: authorityName,
                text: `Request rejected by Authority: ${reason || 'Duplicate or invalid incident report.'}`,
                timestamp: 'Just now',
              },
            ],
          };
        }
        return r;
      })
    );
    toast.error('Request marked as Rejected.');
  };

  // 5. Authority Action: Assign Volunteer / NGO
  const assignNGO = (requestId, ngoData, authorityName = 'Authority EOC') => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'assigned',
            assignedNGO: ngoData,
            updates: [
              ...r.updates,
              {
                id: `up-${Date.now()}`,
                author: authorityName,
                text: `Disaster Authority officially assigned mission to ${ngoData.name}. Unit contact: ${ngoData.phone}`,
                timestamp: 'Just now',
              },
            ],
          };
        }
        return r;
      })
    );
    toast.success(`Mission assigned to ${ngoData.name}!`);
  };

  // 6. Authority Action: Update Status (e.g. En Route / Resolved)
  const updateRequestStatus = (requestId, newStatus, authorName = 'Authority EOC') => {
    const statusLabels = {
      verified: 'Verified by Response Authorities',
      assigned: 'Volunteer / NGO Unit Dispatched',
      in_progress: 'Rescue Team En Route to Site',
      resolved: 'Mission Completed — Citizens Safely Rescued / Relieved',
    };

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: newStatus,
            updates: [
              ...r.updates,
              {
                id: `up-${Date.now()}`,
                author: authorName,
                text: statusLabels[newStatus] || `Status updated to ${newStatus}`,
                timestamp: 'Just now',
              },
            ],
          };
        }
        return r;
      })
    );
    toast.success(`Status updated: ${newStatus.replace('_', ' ').toUpperCase()}`);

    // Persist status change to Firestore
    try {
      serviceUpdateRequestStatus(requestId, newStatus.toUpperCase()).catch(() => {});
    } catch {
      // Offline fallback
    }
  };

  // Add real-time comment / update
  const addUpdateToRequest = (requestId, text, authorName) => {
    if (!text.trim()) return;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            updates: [
              ...r.updates,
              {
                id: `up-${Date.now()}`,
                author: authorName || 'Responder',
                text,
                timestamp: 'Just now',
              },
            ],
          };
        }
        return r;
      })
    );
    toast.success('Live update logged to timeline.');
  };

  const resetDemoData = () => {
    localStorage.removeItem('crisisconnect_requests_v2');
    localStorage.removeItem('crisisconnect_broadcasts_v2');
    setRequests(INITIAL_REQUESTS);
    setBroadcasts(INITIAL_BROADCASTS);
    toast.success('Restored default demo scenario.');
  };

  return (
    <CrisisContext.Provider
      value={{
        crisisInfo,
        broadcasts,
        shelters,
        requests,
        ngos,
        addRequest,
        triggerSOS,
        verifyRequest,
        rejectRequest,
        assignNGO,
        updateRequestStatus,
        addUpdateToRequest,
        resetDemoData,
      }}
    >
      {children}
    </CrisisContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCrisis() {
  const context = useContext(CrisisContext);
  if (!context) {
    throw new Error('useCrisis must be used within a CrisisProvider');
  }
  return context;
}
