import { supabase, isSupabaseConfigured } from './supabase.js';
import {
  REQUEST_STATUS,
  URGENCY_LEVELS,
  REQUEST_CATEGORIES,
} from '../utils/constants.js';
import { calculateDistance } from '../utils/helpers.js';

// Local in-memory store for fallback/offline operation
let localRequestsStore = [];

/**
 * Creates a new emergency crisis request in Supabase
 *
 * @param {Object} requestData - { title, description, category, urgency, location, peopleCount, contactPhone, notes }
 * @param {Object} currentUser - Current logged-in user or anonymous victim
 * @returns {Promise<Object>} Created request document with generated ID
 */
export async function createCrisisRequest(requestData, currentUser = null) {
  const trackingCode = `CC-${Math.floor(100000 + Math.random() * 900000)}`;
  const lat = requestData.location?.lat || requestData.lat || 19.0760;
  const lng = requestData.location?.lng || requestData.lng || 72.8777;

  const payload = {
    id: `req_${Date.now()}`,
    tracking_token: trackingCode,
    trackingCode,
    title: requestData.title?.trim() || 'Emergency Assistance Needed',
    description: requestData.description?.trim() || '',
    category: requestData.category || REQUEST_CATEGORIES.OTHER,
    urgency: requestData.urgency || URGENCY_LEVELS.HIGH,
    status: REQUEST_STATUS.PENDING,
    verification_status: 'UNVERIFIED',
    people_count: Number(requestData.peopleCount) || 1,
    peopleCount: Number(requestData.peopleCount) || 1,
    contact_name: requestData.contactName || currentUser?.name || 'Citizen Victim',
    contactName: requestData.contactName || currentUser?.name || 'Citizen Victim',
    contact_phone: requestData.contactPhone || requestData.mobileNo || currentUser?.phone || '',
    contactPhone: requestData.contactPhone || requestData.mobileNo || currentUser?.phone || '',
    latitude: lat,
    longitude: lng,
    lat,
    lng,
    location_name: requestData.location?.address || requestData.locationName || 'Emergency GPS Location',
    locationName: requestData.location?.address || requestData.locationName || 'Emergency GPS Location',
    vulnerabilities: requestData.vulnerabilities || [],
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    timeline: [
      {
        status: REQUEST_STATUS.PENDING,
        timestamp: new Date().toISOString(),
        note: 'Emergency request registered in system.',
      },
    ],
  };

  localRequestsStore.unshift(payload);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('emergency_requests')
        .insert({
          tracking_token: trackingCode,
          title: payload.title,
          description: payload.description,
          category: payload.category,
          urgency: payload.urgency,
          status: payload.status,
          verification_status: payload.verification_status,
          contact_name: payload.contact_name,
          contact_phone: payload.contact_phone,
          people_count: payload.people_count,
          latitude: lat,
          longitude: lng,
          location_name: payload.location_name,
          vulnerabilities: payload.vulnerabilities,
        })
        .select()
        .single();

      if (!error && data) {
        payload.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase createEmergencyRequest fallback:', err.message);
    }
  }

  return payload;
}

/**
 * Subscribes to real-time updates for crisis requests via Supabase Realtime channel
 *
 * @param {Function} onUpdate - Callback receiving array of requests
 * @returns {Function} Unsubscribe function
 */
export function subscribeToRequests(onUpdate) {
  if (isSupabaseConfigured) {
    // Initial fetch from Supabase
    supabase
      .from('emergency_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const formatted = data.map((r) => ({
            id: r.id,
            trackingCode: r.tracking_token,
            title: r.title,
            description: r.description,
            category: r.category,
            urgency: r.urgency,
            status: r.status,
            verificationStatus: r.verification_status,
            locationName: r.location_name,
            lat: r.latitude,
            lng: r.longitude,
            location: { lat: r.latitude, lng: r.longitude, address: r.location_name },
            contactName: r.contact_name,
            contactPhone: r.contact_phone,
            peopleCount: r.people_count,
            vulnerabilities: r.vulnerabilities || [],
            createdAt: r.created_at,
          }));
          onUpdate(formatted);
        } else {
          onUpdate(localRequestsStore);
        }
      })
      .catch(() => {
        onUpdate(localRequestsStore);
      });

    // Supabase Realtime listener
    const channel = supabase
      .channel('realtime:emergency_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_requests' },
        () => {
          // Re-fetch on any change
          supabase
            .from('emergency_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) {
                const formatted = data.map((r) => ({
                  id: r.id,
                  trackingCode: r.tracking_token,
                  title: r.title,
                  description: r.description,
                  category: r.category,
                  urgency: r.urgency,
                  status: r.status,
                  verificationStatus: r.verification_status,
                  locationName: r.location_name,
                  lat: r.latitude,
                  lng: r.longitude,
                  location: { lat: r.latitude, lng: r.longitude, address: r.location_name },
                  contactName: r.contact_name,
                  contactPhone: r.contact_phone,
                  peopleCount: r.people_count,
                  vulnerabilities: r.vulnerabilities || [],
                  createdAt: r.created_at,
                }));
                onUpdate(formatted);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Fallback to local memory listener
  onUpdate(localRequestsStore);
  return () => {};
}

/**
 * Updates the status of an emergency request in Supabase
 *
 * @param {string} requestId
 * @param {string} newStatus - PENDING | VERIFIED | ASSIGNED | IN_PROGRESS | RESOLVED
 * @param {string} note - Status change commentary
 */
export async function updateRequestStatus(requestId, newStatus, note = '') {
  // Update local memory
  localRequestsStore = localRequestsStore.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: newStatus,
          timeline: [
            ...(r.timeline || []),
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
              note: note || `Status updated to ${newStatus}`,
            },
          ],
        }
      : r
  );

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('emergency_requests')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Supabase updateRequestStatus fallback:', err.message);
    }
  }

  return true;
}

/**
 * Verification Mechanism: Validates a crisis request in Supabase to prevent fake/outdated emergencies.
 *
 * @param {string} requestId
 * @param {Object} verifierUser - { uid, name, role }
 */
export async function verifyCrisisRequest(requestId, verifierUser) {
  const verifierName = verifierUser?.displayName || verifierUser?.name || 'Authorized Responder';

  // Update local memory
  localRequestsStore = localRequestsStore.map((r) =>
    r.id === requestId
      ? {
          ...r,
          isVerified: true,
          status: REQUEST_STATUS.VERIFIED,
          verificationStatus: 'verified',
          verifiedAt: new Date().toISOString(),
          verifiedBy: verifierName,
        }
      : r
  );

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('emergency_requests')
        .update({
          status: REQUEST_STATUS.VERIFIED,
          verification_status: 'VERIFIED',
          verified_by: verifierName,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Supabase verifyCrisisRequest fallback:', err.message);
    }
  }

  return true;
}

/**
 * Assigns an NGO or Volunteer to a Request
 */
export async function assignVolunteerToRequest(requestId, volunteerData) {
  const volunteerName = volunteerData.name || 'Assigned NGO Unit';

  localRequestsStore = localRequestsStore.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: REQUEST_STATUS.ASSIGNED,
          assignedNGO: volunteerData,
        }
      : r
  );

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('emergency_requests')
        .update({
          status: REQUEST_STATUS.ASSIGNED,
          assigned_ngo: volunteerName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Supabase assignVolunteer fallback:', err.message);
    }
  }

  return true;
}

/**
 * Duplicate Prevention: Scans for active emergencies of the same category within
 * a close geographical radius (e.g. 500m).
 *
 * @param {number} lat
 * @param {number} lng
 * @param {string} category
 * @param {number} maxDistanceKm - Default 0.5km (500 meters)
 * @param {Array} preloadedRequests - Optional memory array
 * @returns {Promise<Array>} List of potential duplicate requests
 */
export async function checkForPotentialDuplicates(lat, lng, category, maxDistanceKm = 0.5, preloadedRequests = null) {
  if (!lat || !lng) return [];

  let candidateList = [];
  if (Array.isArray(preloadedRequests)) {
    candidateList = preloadedRequests;
  } else if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('emergency_requests')
        .select('*')
        .eq('category', category)
        .in('status', [REQUEST_STATUS.PENDING, REQUEST_STATUS.VERIFIED, REQUEST_STATUS.IN_PROGRESS]);

      if (data) {
        candidateList = data.map((r) => ({
          id: r.id,
          category: r.category,
          location: { lat: r.latitude, lng: r.longitude },
        }));
      }
    } catch {
      candidateList = localRequestsStore;
    }
  } else {
    candidateList = localRequestsStore;
  }

  const duplicates = [];
  candidateList.forEach((data) => {
    const rLat = data.location?.lat || data.latitude || data.lat;
    const rLng = data.location?.lng || data.longitude || data.lng;

    if (data.category === category && rLat && rLng) {
      const dist = calculateDistance(lat, lng, rLat, rLng);
      if (dist !== null && dist <= maxDistanceKm) {
        duplicates.push({
          ...data,
          distance: dist,
        });
      }
    }
  });

  return duplicates;
}

/**
 * Outdated Check: Flags requests older than maxHours (default 24h) without resolution.
 */
export function isRequestOutdated(createdAt, maxHours = 24) {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  const hoursDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff >= maxHours;
}

/**
 * Marks a request as OUTDATED to prevent volunteers from wasting time on dead calls
 */
export async function markRequestOutdated(requestId) {
  return await updateRequestStatus(requestId, REQUEST_STATUS.OUTDATED, 'Marked outdated by system (>24h)');
}

/**
 * Location-Based Matching: Finds and ranks available volunteers within a given radius.
 */
export async function matchNearbyVolunteers(requestLat, requestLng, maxDistanceKm = 15, preloadedVolunteers = null) {
  if (!requestLat || !requestLng) return [];

  let candidateVolunteers = [];
  if (Array.isArray(preloadedVolunteers)) {
    candidateVolunteers = preloadedVolunteers;
  } else if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('citizens')
        .select('*')
        .not('latitude', 'is', null);

      if (data) {
        candidateVolunteers = data.map((u) => ({
          id: u.id,
          uid: u.id,
          name: u.name,
          phone: u.phone,
          bloodGroup: u.blood_group,
          location: { lat: u.latitude, lng: u.longitude },
        }));
      }
    } catch {
      candidateVolunteers = [];
    }
  }

  const matchedVolunteers = [];
  candidateVolunteers.forEach((user) => {
    const uLat = user.location?.lat || user.latitude || user.lat;
    const uLng = user.location?.lng || user.longitude || user.lng;

    if (uLat && uLng) {
      const distance = calculateDistance(requestLat, requestLng, uLat, uLng);
      if (distance !== null && distance <= maxDistanceKm) {
        matchedVolunteers.push({
          id: user.id || user.uid,
          uid: user.uid || user.id,
          name: user.name,
          phone: user.mobileNo || user.phone,
          bloodGroup: user.bloodGroup,
          distance: Number(distance.toFixed(2)),
        });
      }
    }
  });

  return matchedVolunteers.sort((a, b) => a.distance - b.distance);
}

/**
 * Retrieves requests ordered by distance from given coordinates
 */
export async function getNearbyRequests(userLat, userLng, maxRadiusKm = 50) {
  let allRequests = localRequestsStore;

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.from('emergency_requests').select('*');
      if (data) {
        allRequests = data.map((r) => ({
          id: r.id,
          trackingCode: r.tracking_token,
          title: r.title,
          category: r.category,
          urgency: r.urgency,
          status: r.status,
          location: { lat: r.latitude, lng: r.longitude, address: r.location_name },
          lat: r.latitude,
          lng: r.longitude,
        }));
      }
    } catch {
      allRequests = localRequestsStore;
    }
  }

  return allRequests
    .map((req) => {
      const rLat = req.location?.lat || req.lat;
      const rLng = req.location?.lng || req.lng;
      const distance = calculateDistance(userLat, userLng, rLat, rLng);
      return { ...req, distance };
    })
    .filter((req) => req.distance === null || req.distance <= maxRadiusKm)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}
