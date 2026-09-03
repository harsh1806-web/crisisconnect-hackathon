import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import {
  INITIAL_CRISIS_INFO,
  INITIAL_BROADCASTS,
  INITIAL_SHELTERS,
  REGISTERED_NGOS,
  INITIAL_NGO_DONATIONS,
  INITIAL_CITIZEN_VOLUNTEER_TASKS,
} from '../data/mockData';
import toast from 'react-hot-toast';
import {
  createCrisisRequest,
  updateRequestStatus as serviceUpdateRequestStatus,
  verifyCrisisRequest as serviceVerifyCrisisRequest,
} from '../services/requestService.js';
import {
  triggerDeviceNotification,
  broadcastDisasterToNearbyUsers,
  notifyAuthorityEOC,
} from '../services/notificationService.js';
import { supabase } from '../services/supabase.js';
import { classifyDisaster } from '../services/aiDisasterClassifier.js';

const CrisisContext = createContext(null);

export function CrisisProvider({ children }) {
  const { session } = useAuth();
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const [baseCrisisInfo] = useState(INITIAL_CRISIS_INFO);
  const [shelters] = useState(INITIAL_SHELTERS);
  const [ngos] = useState(REGISTERED_NGOS);

  // NGO Donations & Supplies State
  const [donations, setDonations] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_donations_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_NGO_DONATIONS;
      }
    }
    return INITIAL_NGO_DONATIONS;
  });

  // Citizen Volunteering Tasks State
  const [volunteerTasks, setVolunteerTasks] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_voltasks_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return INITIAL_CITIZEN_VOLUNTEER_TASKS;
      }
    }
    return INITIAL_CITIZEN_VOLUNTEER_TASKS;
  });

  useEffect(() => {
    if (volunteerTasks && volunteerTasks.length > 0) {
      localStorage.setItem('crisisconnect_voltasks_v1', JSON.stringify(volunteerTasks));
    }
  }, [volunteerTasks]);

  const [broadcasts, setBroadcasts] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_broadcasts_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return INITIAL_BROADCASTS;
      }
    }
    return INITIAL_BROADCASTS;
  });

  // Volunteer Karma Points System (for redeeming brand vouchers)
  const [karmaPoints, setKarmaPoints] = useState(() => {
    try {
      const saved = localStorage.getItem('crisisconnect_karma_pts');
      return saved !== null ? Number(saved) : 250;
    } catch {
      return 250;
    }
  });

  const updateKarmaPoints = (newPts) => {
    setKarmaPoints(newPts);
    try {
      localStorage.setItem('crisisconnect_karma_pts', String(newPts));
    } catch {}
  };

  // Real-time Emergency Requests - initialized strictly from live database, no demo data
  const [requests, setRequests] = useState([]);

  // Fetch live emergencies directly from Supabase on mount
  useEffect(() => {
    // Clear any previous demo cache from localStorage
    localStorage.removeItem('crisisconnect_requests_v3');

    const fetchSupabaseRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('emergency_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped = data.map((r) => {
            const aiResult = classifyDisaster({
              title: r.title,
              description: r.description,
              category: r.category,
              urgency: r.urgency,
              peopleCount: r.people_count,
            });

            return {
              id: r.id,
              trackingCode: r.tracking_token || r.id,
              title: r.title || `${r.category || 'Emergency'} Assistance`,
              category: r.category || 'General',
              urgency: (r.urgency || 'HIGH').toLowerCase(),
              verificationStatus: (r.verification_status || 'PENDING').toLowerCase(),
              status: (r.status || 'PENDING').toLowerCase(),
              description: r.description || '',
              locationName: r.location_name || '',
              lat: Number(r.latitude) || 19.0760,
              lng: Number(r.longitude) || 72.8777,
              peopleCount: r.people_count || 1,
              vulnerabilities: r.vulnerabilities || [],
              contactName: r.contact_name || r.user_name || 'Citizen',
              contactPhone: r.contact_phone || r.user_phone || '',
              createdAt: r.created_at || new Date().toISOString(),
              aiClassification: aiResult,
              targetAuthority: aiResult.targetAuthority,
            };
          });
          setRequests(mapped);
        }
      } catch (err) {
        console.warn('Error loading Supabase requests:', err);
      }
    };

    fetchSupabaseRequests();

    // Listen for Realtime inserts/updates
    const channel = supabase
      .channel('realtime:live_crisis_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const r = payload.new;
            const aiResult = classifyDisaster({
              title: r.title,
              description: r.description,
              category: r.category,
              urgency: r.urgency,
              peopleCount: r.people_count,
            });

            const newReq = {
              id: r.id,
              trackingCode: r.tracking_token || r.id,
              title: r.title || `${r.category || 'Emergency'} Assistance`,
              category: r.category || 'General',
              urgency: (r.urgency || 'HIGH').toLowerCase(),
              verificationStatus: (r.verification_status || 'PENDING').toLowerCase(),
              status: (r.status || 'PENDING').toLowerCase(),
              description: r.description || '',
              locationName: r.location_name || '',
              lat: Number(r.latitude) || 19.0760,
              lng: Number(r.longitude) || 72.8777,
              peopleCount: r.people_count || 1,
              vulnerabilities: r.vulnerabilities || [],
              contactName: r.contact_name || r.user_name || 'Citizen',
              contactPhone: r.contact_phone || r.user_phone || '',
              createdAt: r.created_at || new Date().toISOString(),
              aiClassification: aiResult,
              targetAuthority: aiResult.targetAuthority,
            };
            setRequests((prev) => [newReq, ...prev.filter((item) => item.id !== newReq.id)]);
            
            // Targeted Notification Routing based on Active Device Session
            const activeUser = sessionRef.current;
            if (activeUser) {
              if (activeUser.type === 'authority') {
                // Determine if this authority matches the AI target authority
                const targetAgency = aiResult.targetAuthority?.agencyType;
                const myAgency =
                  activeUser.agencyType ||
                  (activeUser.badgeId?.toLowerCase().startsWith('police')
                    ? 'police'
                    : activeUser.badgeId?.toLowerCase().startsWith('fire')
                    ? 'fire'
                    : activeUser.badgeId?.toLowerCase().startsWith('hosp')
                    ? 'hospital'
                    : activeUser.badgeId?.toLowerCase().startsWith('ndrf')
                    ? 'ndrf'
                    : activeUser.badgeId?.toLowerCase().startsWith('usar')
                    ? 'usar'
                    : 'all');

                const isGeneralCoordinator =
                  activeUser.badgeId === 'ADMIN-1' || activeUser.badgeId === 'USAR-112';

                // ONLY the designated department gets notified!
                if (myAgency === targetAgency || myAgency === 'all' || isGeneralCoordinator) {
                  triggerDeviceNotification(
                    `🚨 [${(aiResult.targetAuthority?.shortName || 'AUTHORITY').toUpperCase()} DISPATCH]`,
                    {
                      body: `${newReq.category}: ${newReq.title} at ${newReq.locationName}. Reporter: ${newReq.contactName} (${newReq.contactPhone})`,
                    }
                  );
                }
              } else if (activeUser.type === 'citizen') {
                // Check if this citizen is the author who posted this request
                const isAuthor =
                  (activeUser.phone && newReq.contactPhone && activeUser.phone === newReq.contactPhone) ||
                  (activeUser.name && newReq.contactName && activeUser.name.toLowerCase() === newReq.contactName.toLowerCase());

                if (!isAuthor) {
                  // Check proximity (within 5km radius)
                  const userLat = activeUser.location?.lat || window.__NATIVE_GPS__?.lat;
                  const userLng = activeUser.location?.lng || window.__NATIVE_GPS__?.lng;

                  if (userLat && userLng && newReq.lat && newReq.lng) {
                    const R = 6371;
                    const dLat = (newReq.lat - userLat) * (Math.PI / 180);
                    const dLon = (newReq.lng - userLng) * (Math.PI / 180);
                    const a =
                      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(userLat * (Math.PI / 180)) *
                        Math.cos(newReq.lat * (Math.PI / 180)) *
                        Math.sin(dLon / 2) *
                        Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const distKm = R * c;

                    if (distKm <= 5) {
                      triggerDeviceNotification(`⚠️ NEARBY EMERGENCY (${distKm.toFixed(1)}km away)`, {
                        body: `${newReq.title} at ${newReq.locationName}. Stay safe!`,
                      });
                    }
                  } else {
                    triggerDeviceNotification(`⚠️ NEARBY EMERGENCY ALERT`, {
                      body: `${newReq.title} reported at ${newReq.locationName}.`,
                    });
                  }
                }
              }
            }

            // Sync with backend device tokens without double-triggering locally
            broadcastDisasterToNearbyUsers(newReq, 5);
          } else if (payload.eventType === 'UPDATE') {
            const r = payload.new;
            setRequests((prev) =>
              prev.map((item) =>
                item.id === r.id
                  ? {
                      ...item,
                      status: (r.status || item.status).toLowerCase(),
                      verificationStatus: (r.verification_status || item.verificationStatus).toLowerCase(),
                    }
                  : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setRequests((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    const completed = requests.filter((r) => r.status === 'resolved').length;

    return {
      ...baseCrisisInfo,
      stats: {
        ...baseCrisisInfo.stats,
        activeRequests: total,
        pendingVerification: pending,
        verifiedActive: verified,
        ngosDeployed: assigned,
        rescuesCompleted: completed,
      },
    };
  }, [baseCrisisInfo, requests]);

  // Citizen Action: Create Emergency Request with AI Classification
  const addRequest = (requestData) => {
    const codeNum = Math.floor(100 + Math.random() * 900);
    const trackingCode = `CRISIS-${codeNum}`;

    // 1. Run AI Disaster Classification & Authority Routing
    const aiResult = classifyDisaster({
      title: requestData.title,
      description: requestData.description,
      category: requestData.category,
      urgency: requestData.urgency,
      peopleCount: requestData.peopleCount,
    });

    const aiVulnerabilities = [
      ...(requestData.vulnerabilities || []),
      `TARGET_AUTH:${aiResult.targetAuthority.shortName}`,
      `HOTLINE:${aiResult.targetAuthority.hotline}`,
      `DISASTER_TYPE:${aiResult.disasterType}`,
      `AI_CONFIDENCE:${aiResult.confidence}`,
    ];

    const newReq = {
      id: `req-${Date.now()}`,
      trackingCode,
      title: requestData.title || 'Immediate Emergency Assistance',
      category: requestData.category || 'Rescue',
      urgency: aiResult.urgencyLevel.toLowerCase(),
      verificationStatus: 'pending',
      status: 'pending_verification',
      description: requestData.description || '',
      locationName: requestData.locationName || 'GPS Location Tagged',
      lat: requestData.lat || 19.0760,
      lng: requestData.lng || 72.8777,
      peopleCount: Number(requestData.peopleCount) || 1,
      vulnerabilities: aiVulnerabilities,
      aiClassification: aiResult,
      targetAuthority: aiResult.targetAuthority,
      contactName: requestData.contactName || 'Citizen in Need',
      contactPhone: requestData.contactPhone || '+91 99999 00000',
      createdAt: new Date().toISOString(),
      assignedNGO: null,
      updates: [
        {
          id: `up-init-${Date.now()}`,
          author: 'Emergency System',
          text: `Request logged under Reference ${trackingCode}. Dispatched to Authority Queue for verification.`,
          timestamp: 'Just now',
        },
        {
          id: `up-ai-${Date.now()}`,
          author: '🤖 AI Dispatch Router',
          text: aiResult.intimation.dispatchMessage,
          timestamp: 'Just now',
        },
      ],
    };

    setRequests((prev) => [newReq, ...prev]);
    toast.success(`Request ${trackingCode} submitted! Intimated to ${aiResult.targetAuthority.shortName}.`);

    // Persist to Supabase and broadcast notifications
    try {
      createCrisisRequest({
        title: newReq.title,
        description: `${newReq.description}\n\n🤖 [AI DISASTER ROUTING & INTIMATION]\n• Target Authority: ${aiResult.targetAuthority.name}\n• Classification: ${aiResult.disasterType}\n• Hotline: ${aiResult.targetAuthority.hotline}\n• Response SLA: ${aiResult.targetAuthority.slaMinutes} mins\n• Required Gear: ${aiResult.targetAuthority.requiredEquipment.join(', ')}`,
        category: (newReq.category || 'OTHER').toUpperCase(),
        urgency: aiResult.urgencyLevel,
        contactName: newReq.contactName,
        contactPhone: newReq.contactPhone,
        peopleCount: newReq.peopleCount,
        location: {
          lat: newReq.lat,
          lng: newReq.lng,
          address: newReq.locationName,
        },
        vulnerabilities: newReq.vulnerabilities,
      }).then((saved) => {
        if (saved?.id) {
          setRequests((prev) =>
            prev.map((r) => (r.id === newReq.id ? { ...r, id: saved.id, trackingCode: saved.trackingCode || r.trackingCode } : r))
          );
        }
      }).catch(() => {});
      
      // Notifications: Authority EOC & Nearby Citizens
      notifyAuthorityEOC(newReq, aiResult);
      broadcastDisasterToNearbyUsers(newReq, 5);
      
      triggerDeviceNotification(`🚨 NEW EMERGENCY: ${newReq.category}`, {
        body: `${newReq.title} at ${newReq.locationName}`,
      });
    } catch {
      // Offline fallback
    }

    return newReq;
  };

  // Citizen Action: SOS Trigger
  const triggerSOS = (coords, customDetails = {}) => {
    const lat = coords?.lat || 19.0760 + (Math.random() - 0.5) * 0.015;
    const lng = coords?.lng || 72.8777 + (Math.random() - 0.5) * 0.015;
    const trackingCode = `SOS-${Math.floor(100 + Math.random() * 900)}`;

    const aiResult = classifyDisaster({
      title: '🚨 CRITICAL LIFE-THREATENING SOS BEACON',
      description: customDetails.description || 'Citizen triggered immediate red emergency panic beacon. Immediate evacuation / life hazard reported.',
      category: 'RESCUE',
      urgency: 'CRITICAL',
      peopleCount: customDetails.peopleCount || 1,
    });

    const sosReq = {
      id: `sos-${Date.now()}`,
      trackingCode,
      title: '🚨 CRITICAL LIFE-THREATENING SOS BEACON',
      category: 'Rescue',
      urgency: 'critical',
      verificationStatus: 'verified',
      status: 'verified',
      description:
        customDetails.description ||
        'Citizen triggered immediate red emergency panic beacon. Immediate evacuation / life hazard reported.',
      locationName: customDetails.locationName || `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
      peopleCount: customDetails.peopleCount || 1,
      vulnerabilities: ['Immediate Distress', 'Life Hazard', `TARGET_AUTH:${aiResult.targetAuthority.shortName}`, `HOTLINE:${aiResult.targetAuthority.hotline}`],
      aiClassification: aiResult,
      targetAuthority: aiResult.targetAuthority,
      contactName: customDetails.contactName || 'Emergency Victim',
      contactPhone: customDetails.contactPhone || '+91 99999 00000',
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
        {
          id: `up-ai-${Date.now()}`,
          author: '🤖 AI Dispatch Router',
          text: aiResult.intimation.dispatchMessage,
          timestamp: 'Just now',
        },
      ],
    };

    setRequests((prev) => [sosReq, ...prev]);

    // Persist to Supabase and broadcast audio siren
    try {
      createCrisisRequest({
        title: sosReq.title,
        description: `${sosReq.description}\n\n🤖 [AI DISASTER ROUTING]\n• Target Authority: ${aiResult.targetAuthority.name}\n• Hotline: ${aiResult.targetAuthority.hotline}`,
        category: 'RESCUE',
        urgency: 'CRITICAL',
        contactName: sosReq.contactName,
        contactPhone: sosReq.contactPhone,
        peopleCount: sosReq.peopleCount,
        location: {
          lat: sosReq.lat,
          lng: sosReq.lng,
          address: sosReq.locationName,
        },
        vulnerabilities: sosReq.vulnerabilities,
      }).then((saved) => {
        if (saved?.id) {
          setRequests((prev) =>
            prev.map((r) => (r.id === sosReq.id ? { ...r, id: saved.id, trackingCode: saved.trackingCode || r.trackingCode } : r))
          );
        }
      }).catch(() => {});
      
      notifyAuthorityEOC(sosReq, aiResult);
      broadcastDisasterToNearbyUsers(sosReq, 5);
      
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
      // Audio context might be restricted
    }

    toast.error('🚨 Critical SOS Dispatched to Disaster Authorities!', {
      duration: 5000,
    });
    return sosReq;
  };

  // Citizen Action: Sign up for local community volunteer task
  const signUpForVolunteerTask = (taskId, citizenName = 'Local Volunteer') => {
    setVolunteerTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            volunteersSignedUp: t.volunteersSignedUp + 1,
            userRegistered: true,
          };
        }
        return t;
      })
    );
    // Award citizen with +100 Karma Points
    updateKarmaPoints(karmaPoints + 100);
    toast.success(`🎉 ${citizenName} registered! +100 Karma Points added to your profile!`);
  };

  // Authority Action: Mobilize and publish new volunteer requirement to citizens & Supabase
  const publishAuthorityVolunteerTask = async (newTask) => {
    setVolunteerTasks((prev) => [newTask, ...prev]);

    // Persist to Supabase emergency_requests as VOLUNTEER_MOBILIZATION broadcast
    try {
      await createCrisisRequest({
        title: `📢 VOLUNTEER CALL: ${newTask.title}`,
        description: `${newTask.description}\n\n• Sector: ${newTask.sector}\n• Assembly Point: ${newTask.location}\n• Volunteers Needed: ${newTask.volunteersNeeded}\n• Shift: ${newTask.timeRequired}\n• Lead: ${newTask.coordinator} (${newTask.coordinatorPhone})\n• Requirements: ${newTask.requirements}`,
        category: 'VOLUNTEER_MOBILIZATION',
        urgency: 'HIGH',
        contactName: newTask.coordinator,
        contactPhone: newTask.coordinatorPhone,
        peopleCount: newTask.volunteersNeeded,
        location: {
          lat: 19.0760,
          lng: 72.8777,
          address: newTask.location,
        },
        vulnerabilities: [`SECTOR:${newTask.sector}`, `TASK_ID:${newTask.id}`],
      });
    } catch (err) {
      console.warn('Supabase volunteer task persist note:', err);
    }
    return newTask;
  };

  // NGO Action: Record Incoming Donation / Supply Drop
  const recordDonation = (newDonation) => {
    const entry = {
      id: `don-${Date.now()}`,
      donor: newDonation.donor || 'Community Benefactor',
      amount: Number(newDonation.amount) || 0,
      type: newDonation.type || 'Supplies',
      items: newDonation.items || 'Relief Goods',
      timestamp: 'Just now',
    };

    setDonations((prev) => ({
      ...prev,
      totalFundsRaised: prev.totalFundsRaised + (entry.type === 'Monetary Fund' ? entry.amount : 0),
      recentDonations: [entry, ...prev.recentDonations],
    }));

    toast.success(`Donation of ${entry.items} successfully logged!`);
  };

  // NGO Action: Deploy Squad / Update Mission Progress
  const updateNGOMission = (requestId, squadNote, authorName = 'NGO Squad Lead') => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'in_progress',
            updates: [
              ...r.updates,
              {
                id: `up-${Date.now()}`,
                author: authorName,
                text: squadNote,
                timestamp: 'Just now',
              },
            ],
          };
        }
        return r;
      })
    );
    toast.success('Field Squad deployment update dispatched!');
  };

  // Authority Actions
  const verifyRequest = (requestId, authorityName = 'Authority EOC', auditData = {}) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const newUpdates = [...(r.updates || [])];
          if (auditData.notes) {
            newUpdates.push({
              id: `up-note-${Date.now()}`,
              author: `📢 ${authorityName} Official Instruction`,
              text: auditData.notes,
              timestamp: 'Just now',
              isOfficial: true,
            });
          }
          newUpdates.push({
            id: `up-verif-${Date.now()}`,
            author: authorityName,
            text: `Incident authenticated (Trust Score: ${auditData.trustScore || 95}% Genuine). Cleared for ${auditData.assignedUnit || 'Rescue Operations'}. ETA ~${auditData.etaMinutes || 12} mins.`,
            timestamp: 'Just now',
            isOfficial: true,
          });

          return {
            ...r,
            verificationStatus: 'verified',
            status: 'verified',
            authenticityTrustScore: auditData.trustScore || 95,
            verificationOfficer: authorityName,
            verificationAudit: auditData,
            officialInstructions: auditData.notes || r.officialInstructions,
            etaMinutes: auditData.etaMinutes || r.etaMinutes,
            updates: newUpdates,
          };
        }
        return r;
      })
    );
    toast.success('Incident authenticated & cleared for rescue deployment!');

    // Persist verification to Firestore
    try {
      serviceVerifyCrisisRequest(requestId, { name: authorityName, role: 'ORGANIZATION' }).catch(() => {});
    } catch {
      // Offline fallback
    }
  };

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
    localStorage.removeItem('crisisconnect_requests_v3');
    localStorage.removeItem('crisisconnect_broadcasts_v3');
    localStorage.removeItem('crisisconnect_donations_v1');
    localStorage.removeItem('crisisconnect_voltasks_v1');
    setRequests([]);
    setBroadcasts([]);
    setDonations({ totalFundsRaised: 0, totalFundsDeployed: 0, supplies: [], recentDonations: [] });
    setVolunteerTasks([]);
    toast.success('Cleared all local emergency cache.');
  };

  return (
    <CrisisContext.Provider
      value={{
        crisisInfo,
        broadcasts,
        shelters,
        requests,
        ngos,
        donations,
        volunteerTasks,
        karmaPoints,
        updateKarmaPoints,
        publishAuthorityVolunteerTask,
        addRequest,
        triggerSOS,
        signUpForVolunteerTask,
        recordDonation,
        updateNGOMission,
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
