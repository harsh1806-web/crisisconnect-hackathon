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
  const [shelters] = useState([]);
  const [ngos] = useState(REGISTERED_NGOS);

  // NGO Donations & Supplies State - Starts 100% clean
  const [donations, setDonations] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_donations_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return { totalFundsRaised: 0, totalFundsDeployed: 0, supplies: [], recentDonations: [] };
  });

  useEffect(() => {
    localStorage.setItem('crisisconnect_donations_v2', JSON.stringify(donations));
  }, [donations]);

  // Citizen Volunteering Tasks State - Starts 100% clean
  const [volunteerTasks, setVolunteerTasks] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_voltasks_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('crisisconnect_voltasks_v2', JSON.stringify(volunteerTasks));
  }, [volunteerTasks]);

  // Live Broadcasts State - Starts 100% clean
  const [broadcasts, setBroadcasts] = useState(() => {
    const saved = localStorage.getItem('crisisconnect_broadcasts_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('crisisconnect_broadcasts_v4', JSON.stringify(broadcasts));
  }, [broadcasts]);

  // Volunteer Karma Points System - Starts at 0
  const [karmaPoints, setKarmaPoints] = useState(() => {
    try {
      const saved = localStorage.getItem('crisisconnect_karma_pts_v2');
      return saved !== null ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  const updateKarmaPoints = (newPtsOrFn) => {
    setKarmaPoints((prev) => {
      const nextPts = typeof newPtsOrFn === 'function' ? newPtsOrFn(prev) : Number(newPtsOrFn) || 0;
      const safePts = Math.max(0, nextPts);
      try {
        localStorage.setItem('crisisconnect_karma_pts_v2', String(safePts));
      } catch {}
      return safePts;
    });
  };

  // Real-time Emergency Requests - initialized strictly from live database, no demo data
  const [requests, setRequests] = useState([]);

    // 1-Hour Auto-Expiry Engine: Resolved alerts automatically disappear after 1 hour (3600000 ms)
  useEffect(() => {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const sweepExpiredResolved = () => {
      const now = Date.now();
      setRequests((prev) => {
        const remaining = prev.filter((r) => {
          if ((r.status || '').toLowerCase() === 'resolved') {
            const resolvedTime = r.resolvedAt
              ? new Date(r.resolvedAt).getTime()
              : (r.updatedAt ? new Date(r.updatedAt).getTime() : null);
            if (resolvedTime && (now - resolvedTime >= ONE_HOUR_MS)) {
              return false; // Disappears after 1 hour!
            }
          }
          return true;
        });
        return remaining.length === prev.length ? prev : remaining;
      });
    };

    sweepExpiredResolved();
    const sweeperInterval = setInterval(sweepExpiredResolved, 15000);
    return () => clearInterval(sweeperInterval);
  }, []);

  // Fetch live emergencies directly from Supabase on mount
  // Fetch live emergencies directly from Supabase on mount and sync in real time
  useEffect(() => {
    localStorage.removeItem('crisisconnect_requests_v3');
    localStorage.removeItem('crisisconnect_broadcasts_v3');
    localStorage.removeItem('crisisconnect_donations_v1');
    localStorage.removeItem('crisisconnect_voltasks_v1');
    localStorage.removeItem('crisisconnect_karma_pts');

    const knownIdsRef = new Set();
    let isInitialLoad = true;

    // Centralized notification dispatcher matching user role and authority department
    const dispatchTargetedAlert = (r, aiResult) => {
      const activeUser = sessionRef.current;
      if (!activeUser) return;

      if (activeUser.type === 'authority') {
        const targetAgency = aiResult?.targetAuthority?.agencyType;
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
            : activeUser.badgeId?.toLowerCase().startsWith('relief')
            ? 'relief'
            : 'all');

        const isGeneralCoordinator =
          activeUser.badgeId === 'ADMIN-1' || activeUser.badgeId === 'USAR-112' || myAgency === 'all';

        // Authority only receives alerts for their department unless general coordinator
        if (myAgency === targetAgency || isGeneralCoordinator) {
          triggerDeviceNotification(
            `🚨 [${(aiResult?.targetAuthority?.shortName || activeUser.department || 'AUTHORITY').toUpperCase()} DISPATCH]`,
            {
              body: `${r.category || 'Emergency'}: ${r.title} at ${r.location_name || r.locationName || 'Sector'}. Priority: ${(r.urgency || 'HIGH').toUpperCase()}`,
            }
          );
        }
      } else if (activeUser.type === 'citizen') {
        // Citizens receive alert for critical disasters, SOS beacons, and local hazards
        const isCritical =
          (r.urgency || '').toLowerCase() === 'critical' ||
          (r.category || '').toUpperCase() === 'RESCUE' ||
          (r.title || '').toUpperCase().includes('SOS') ||
          (r.title || '').toUpperCase().includes('CRITICAL');

        if (isCritical) {
          triggerDeviceNotification('🚨 CRITICAL EMERGENCY ALERT IN YOUR SECTOR', {
            body: `${r.category || 'Rescue'}: ${r.title} at ${r.location_name || r.locationName || 'Disaster Area'}. Avoid hazard zone.`,
          });
        }
      }
    };

    const fetchSupabaseRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('emergency_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Detect brand new requests during background polling and fire notifications
          if (!isInitialLoad) {
            data.forEach((r) => {
              if (!knownIdsRef.has(r.id)) {
                knownIdsRef.add(r.id);
                const aiResult = classifyDisaster({
                  title: r.title,
                  description: r.description,
                  category: r.category,
                  urgency: r.urgency,
                  peopleCount: r.people_count,
                });
                dispatchTargetedAlert(r, aiResult);
              }
            });
          } else {
            data.forEach((r) => knownIdsRef.add(r.id));
            isInitialLoad = false;
          }

          setRequests((prev) => {
            return data.map((r) => {
              const existing = prev.find(
                (p) => p.id === r.id || p.trackingCode === r.tracking_token || p.id === r.tracking_token
              );
              const aiResult = classifyDisaster({
                title: r.title,
                description: r.description,
                category: r.category,
                urgency: r.urgency,
                peopleCount: r.people_count,
              });

              const currentVerificationStatus = (r.verification_status || existing?.verificationStatus || 'PENDING').toLowerCase();
              const currentStatus = (r.status || existing?.status || 'PENDING').toLowerCase();

              return {
                id: r.id,
                trackingCode: r.tracking_token || r.id,
                title: r.title || `${r.category || 'Emergency'} Assistance`,
                category: r.category || 'General',
                urgency: (r.urgency || 'HIGH').toLowerCase(),
                verificationStatus: currentVerificationStatus,
                status: currentStatus,
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
                verificationOfficer: r.verified_by || existing?.verificationOfficer,
                verifiedAt: r.verified_at || existing?.verifiedAt,
                officialInstructions: existing?.officialInstructions,
                assignedNGO: existing?.assignedNGO,
                updates: existing?.updates || [
                  {
                    id: `up-init-${r.id}`,
                    author: 'Emergency System',
                    text: `Request logged under Reference ${r.tracking_token || r.id}.`,
                    timestamp: 'Just now',
                  },
                ],
              };
            });
          });
        }
      } catch (err) {
        console.warn('Error loading Supabase requests:', err);
      }
    };

    fetchSupabaseRequests();

    // 4-Second Polling Backup to guarantee cross-device sync even if WebSockets are slow/reconnecting
    const pollingInterval = setInterval(fetchSupabaseRequests, 4000);

    // Listen for Realtime inserts/updates
    const channel = supabase
      .channel('realtime:live_crisis_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const r = payload.new;
            knownIdsRef.add(r.id);

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
              updates: [
                {
                  id: `up-init-${Date.now()}`,
                  author: 'Emergency System',
                  text: `Request logged under Reference ${r.tracking_token || r.id}.`,
                  timestamp: 'Just now',
                },
              ],
            };
            setRequests((prev) => [newReq, ...prev.filter((item) => item.id !== newReq.id && item.trackingCode !== newReq.trackingCode)]);

            // Dispatch targeted alert
            dispatchTargetedAlert(newReq, aiResult);
            broadcastDisasterToNearbyUsers(newReq, 5);
          } else if (payload.eventType === 'UPDATE') {
            const r = payload.new;
            setRequests((prev) =>
              prev.map((item) => {
                if (item.id === r.id || item.trackingCode === r.tracking_token || item.id === r.tracking_token) {
                  const updatedVerificationStatus = (r.verification_status || item.verificationStatus || 'PENDING').toLowerCase();
                  const updatedStatus = (r.status || item.status || 'PENDING').toLowerCase();
                  const justVerified = updatedVerificationStatus === 'verified' && item.verificationStatus !== 'verified';

                  const newUpdates = [...(item.updates || [])];
                  if (justVerified) {
                    newUpdates.push({
                      id: `up-verif-${Date.now()}`,
                      author: r.verified_by || 'Disaster Authority Command',
                      text: 'Incident authenticated and verified by response command.',
                      timestamp: 'Just now',
                      isOfficial: true,
                    });

                    // Notify citizen if this was their alert
                    const activeUser = sessionRef.current;
                    const cleanUserPhone = String(activeUser?.phone || '').replace(/\D/g, '').slice(-10);
                    const cleanReqPhone = String(item.contactPhone || '').replace(/\D/g, '').slice(-10);
                    const isMyRequest =
                      (cleanUserPhone && cleanUserPhone === cleanReqPhone) ||
                      (activeUser?.name && item.contactName && activeUser.name.toLowerCase() === item.contactName.toLowerCase());

                    if (isMyRequest) {
                      triggerDeviceNotification('✅ EMERGENCY REQUEST VERIFIED', {
                        body: 'Your distress alert has been officially verified by Disaster Management Authorities. Rescue deployment authorized.',
                      });
                      toast.success('🎉 Your emergency request has been VERIFIED by Authorities!');
                    }
                  }

                  return {
                    ...item,
                    status: updatedStatus,
                    verificationStatus: updatedVerificationStatus,
                    verificationOfficer: r.verified_by || item.verificationOfficer,
                    verifiedAt: r.verified_at || item.verifiedAt,
                    updates: newUpdates,
                  };
                }
                return item;
              })
            );
          } else if (payload.eventType === 'DELETE') {
            setRequests((prev) => prev.filter((item) => item.id !== payload.old.id && item.trackingCode !== payload.old.tracking_token));
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollingInterval);
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
  const signUpForVolunteerTask = (taskId, citizenName = 'Local Volunteer', citizenPhone = '') => {
    const signupId = `vol-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    setVolunteerTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newRoster = [
            ...(t.roster || []),
            {
              id: signupId,
              citizenName: citizenName,
              citizenPhone: citizenPhone || (sessionRef.current?.phone || '+91 98201 55667'),
              signedUpAt: 'Just now',
              attendanceStatus: 'PENDING',
              pointsAwarded: 0,
            },
          ];
          return {
            ...t,
            volunteersSignedUp: (t.volunteersSignedUp || 0) + 1,
            userRegistered: true,
            userAttendanceStatus: 'PENDING',
            roster: newRoster,
          };
        }
        return t;
      })
    );

    // CRITICAL: Notice we do NOT add +100 points immediately!
    // Points are only awarded once the Authority / NGO verifies on-site attendance!
    toast.success(
      `🎉 ${citizenName} registered! Points will be credited once Authority verifies your on-site attendance.`,
      { duration: 4500 }
    );
  };

  // Authority & NGO Action: Verify attendance or mark No-Show / Did Not Come
  const updateVolunteerAttendance = (taskId, volunteerId, status, officerName = 'Authority Field Lead') => {
    let affectedVolunteer = null;
    let pointsDifference = 0;

    setVolunteerTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedRoster = (t.roster || []).map((vol) => {
            const cleanVolId = String(volunteerId || '').replace(/\D/g, '').slice(-10);
            const cleanVolPhone = String(vol.citizenPhone || '').replace(/\D/g, '').slice(-10);
            const isMatch =
              vol.id === volunteerId ||
              vol.citizenName === volunteerId ||
              (cleanVolId && cleanVolPhone && cleanVolId === cleanVolPhone);

            if (isMatch) {
              affectedVolunteer = vol;
              const prevPoints = vol.pointsAwarded || 0;
              const newPoints = status === 'ATTENDED' ? 100 : 0;
              pointsDifference = newPoints - prevPoints;

              return {
                ...vol,
                attendanceStatus: status, // 'ATTENDED' | 'NO_SHOW'
                pointsAwarded: newPoints,
                verifiedBy: officerName,
                verifiedAt: new Date().toISOString(),
              };
            }
            return vol;
          });

          // Check if current user is this volunteer
          const cleanUserPhone = String(sessionRef.current?.phone || '').replace(/\D/g, '').slice(-10);
          const cleanAffPhone = String(affectedVolunteer?.citizenPhone || '').replace(/\D/g, '').slice(-10);
          const isUser =
            (sessionRef.current?.name &&
              affectedVolunteer?.citizenName &&
              sessionRef.current.name.toLowerCase() === affectedVolunteer.citizenName.toLowerCase()) ||
            Boolean(cleanUserPhone && cleanAffPhone && cleanUserPhone === cleanAffPhone) ||
            t.userRegistered;

          return {
            ...t,
            roster: updatedRoster,
            userAttendanceStatus: isUser ? status : t.userAttendanceStatus,
          };
        }
        return t;
      })
    );

    if (pointsDifference !== 0) {
      updateKarmaPoints(Math.max(0, karmaPoints + pointsDifference));
    }

    if (status === 'ATTENDED') {
      toast.success(`✅ Attendance verified for ${affectedVolunteer?.citizenName || 'Volunteer'}. +100 Karma Points added to wallet!`);
    } else if (status === 'NO_SHOW') {
      toast.error(`❌ Marked ${affectedVolunteer?.citizenName || 'Volunteer'} as "Did Not Come" (No-Show). 0 Points added.`);
    }
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
        if (r.id === requestId || r.trackingCode === requestId) {
          return {
            ...r,
            status: 'in_progress',
            updates: [
              ...(r.updates || []),
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

    try {
      serviceUpdateRequestStatus(requestId, 'IN_PROGRESS', squadNote).catch(() => {});
    } catch {}
  };

  // Authority Actions
  const verifyRequest = (requestId, authorityName = 'Authority EOC', auditData = {}) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId || r.trackingCode === requestId) {
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

    // Persist verification to Supabase
    try {
      serviceVerifyCrisisRequest(requestId, { name: authorityName, role: 'ORGANIZATION' }, auditData).catch(() => {});
    } catch {
      // Offline fallback
    }
  };

  const rejectRequest = (requestId, reason, authorityName = 'Authority EOC') => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId || r.trackingCode === requestId) {
          return {
            ...r,
            verificationStatus: 'rejected',
            status: 'rejected',
            rejectionReason: reason || 'Information could not be validated / duplicate alert.',
            updates: [
              ...(r.updates || []),
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

    try {
      serviceUpdateRequestStatus(requestId, 'REJECTED', reason).catch(() => {});
    } catch {}
  };

  const assignNGO = (requestId, ngoData, authorityName = 'Authority EOC') => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId || r.trackingCode === requestId) {
          return {
            ...r,
            status: 'assigned',
            assignedNGO: ngoData,
            updates: [
              ...(r.updates || []),
              {
                id: `up-${Date.now()}`,
                author: authorityName,
                text: `Assigned to ${ngoData.name} for immediate field dispatch.`,
                timestamp: 'Just now',
              },
            ],
          };
        }
        return r;
      })
    );
    toast.success(`Assigned to ${ngoData.name}`);

    try {
      serviceUpdateRequestStatus(requestId, 'ASSIGNED', `Assigned to ${ngoData.name}`).catch(() => {});
    } catch {}
  };

  // Authority Action: Send a live status notification / message to the citizen
  const sendAuthorityNotification = (requestId, message, authorityName = 'Authority EOC') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId || r.trackingCode === requestId) {
          return {
            ...r,
            authorityLiveStatus: message,
            authorityLiveStatusAt: now.toISOString(),
            updates: [
              ...(r.updates || []),
              {
                id: `up-notif-${Date.now()}`,
                author: `🚔 ${authorityName}`,
                text: message,
                timestamp: timeStr,
                isOfficial: true,
                isLiveNotification: true,
              },
            ],
          };
        }
        return r;
      })
    );

    // Device notification for citizen
    triggerDeviceNotification(`🚔 Authority Update: ${message}`, {
      body: `From ${authorityName} at ${timeStr}`,
      tag: `authority-notif-${requestId}`,
    });

    toast.success(`📨 Notification sent to citizen: "${message}"`);

    // Persist to Supabase
    try {
      serviceUpdateRequestStatus(requestId, 'IN_PROGRESS', `[AUTHORITY NOTIFICATION] ${message} — ${authorityName} at ${timeStr}`).catch(() => {});
    } catch {}
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
        if (r.id === requestId || r.trackingCode === requestId) {
          return {
            ...r,
            status: newStatus.toLowerCase(),
            updates: [
              ...(r.updates || []),
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

    // Persist status change to Supabase
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
        if (r.id === requestId || r.trackingCode === requestId) {
          return {
            ...r,
            updates: [
              ...(r.updates || []),
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
    localStorage.removeItem('crisisconnect_broadcasts_v4');
    localStorage.removeItem('crisisconnect_donations_v1');
    localStorage.removeItem('crisisconnect_donations_v2');
    localStorage.removeItem('crisisconnect_voltasks_v1');
    localStorage.removeItem('crisisconnect_voltasks_v2');
    localStorage.removeItem('crisisconnect_karma_pts');
    localStorage.removeItem('crisisconnect_karma_pts_v2');
    localStorage.removeItem('crisisconnect_redeemed_vouchers');
    setRequests([]);
    setBroadcasts([]);
    setDonations({ totalFundsRaised: 0, totalFundsDeployed: 0, supplies: [], recentDonations: [] });
    setVolunteerTasks([]);
    setKarmaPoints(0);
    toast.success('All demo data cleared. Clean slate ready for testing!');
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
        updateVolunteerAttendance,
        recordDonation,
        updateNGOMission,
        verifyRequest,
        rejectRequest,
        assignNGO,
        updateRequestStatus,
        addUpdateToRequest,
        sendAuthorityNotification,
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
