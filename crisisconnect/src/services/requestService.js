import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase.js';
import {
  COLLECTIONS,
  REQUEST_STATUS,
  URGENCY_LEVELS,
  REQUEST_CATEGORIES,
} from '../utils/constants.js';
import { calculateDistance } from '../utils/helpers.js';

/**
 * Creates a new emergency crisis request
 *
 * @param {Object} requestData - { title, description, category, urgency, location, peopleCount, contactPhone, notes }
 * @param {Object} currentUser - Current logged-in user or anonymous victim
 * @returns {Promise<Object>} Created request document with generated ID
 */
export async function createCrisisRequest(requestData, currentUser = null) {
  const requestsRef = collection(db, COLLECTIONS.REQUESTS);

  const payload = {
    title: requestData.title?.trim() || 'Emergency Assistance Needed',
    description: requestData.description?.trim() || '',
    category: requestData.category || REQUEST_CATEGORIES.OTHER,
    urgency: requestData.urgency || URGENCY_LEVELS.HIGH,
    status: REQUEST_STATUS.PENDING,
    peopleCount: Number(requestData.peopleCount) || 1,
    contactPhone: requestData.mobileNo || requestData.contactPhone || currentUser?.mobileNo || currentUser?.phone || '',
    mobileNo: requestData.mobileNo || requestData.contactPhone || currentUser?.mobileNo || currentUser?.phone || '',
    bloodGroupRequired: requestData.bloodGroupRequired || requestData.bloodGroup || null,
    location: {
      address: requestData.location?.address || 'Unknown location',
      lat: requestData.location?.lat ? Number(requestData.location.lat) : null,
      lng: requestData.location?.lng ? Number(requestData.location.lng) : null,
    },
    createdBy: currentUser?.uid || 'anonymous',
    requesterName: requestData.requesterName || currentUser?.displayName || currentUser?.name || 'Anonymous Requester',
    requesterBloodGroup: currentUser?.bloodGroup || null,
    requesterAge: currentUser?.age || null,
    assignedTo: null, // { uid, name, phone, assignedAt }
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(requestsRef, payload);
  return { id: docRef.id, ...payload };
}

/**
 * Subscribes to all crisis requests in real-time with optional filtering
 *
 * @param {Function} callback - Callback function receiving requests array
 * @param {Object} filters - Optional { status, category, urgency }
 * @returns {Function} Unsubscribe function
 */
export function subscribeToRequests(callback, filters = {}) {
  let q = collection(db, COLLECTIONS.REQUESTS);
  const conditions = [];

  if (filters.status) {
    conditions.push(where('status', '==', filters.status));
  }
  if (filters.category) {
    conditions.push(where('category', '==', filters.category));
  }
  if (filters.urgency) {
    conditions.push(where('urgency', '==', filters.urgency));
  }

  // Order by creation time
  conditions.push(orderBy('createdAt', 'desc'));

  const finalQuery = query(q, ...conditions);

  return onSnapshot(
    finalQuery,
    (snapshot) => {
      const requests = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(requests);
    },
    (error) => {
      console.error('Error listening to crisis requests:', error);
      callback([]);
    }
  );
}

/**
 * Subscribes to requests created by a specific user (e.g. for Victim dashboard)
 *
 * @param {string} userId
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUserRequests(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTIONS.REQUESTS),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(requests);
  });
}

/**
 * Subscribes to requests assigned to a specific volunteer
 *
 * @param {string} volunteerId
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAssignedRequests(volunteerId, callback) {
  if (!volunteerId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTIONS.REQUESTS),
    where('assignedTo.uid', '==', volunteerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(requests);
  });
}

/**
 * Updates status of a crisis request (PENDING -> IN_PROGRESS -> RESOLVED / CANCELLED)
 *
 * @param {string} requestId
 * @param {string} newStatus
 * @param {Object} updatedBy - Optional updater info
 */
export async function updateRequestStatus(requestId, newStatus, updatedBy = {}) {
  const reqRef = doc(db, COLLECTIONS.REQUESTS, requestId);
  const updateData = {
    status: newStatus,
    updatedAt: serverTimestamp(),
    lastUpdatedBy: updatedBy,
  };

  if (newStatus === REQUEST_STATUS.RESOLVED) {
    updateData.resolvedAt = serverTimestamp();
  }

  return await updateDoc(reqRef, updateData);
}

/**
 * Assigns a volunteer to a request and marks it as IN_PROGRESS
 *
 * @param {string} requestId
 * @param {Object} volunteerUser - { uid, displayName, phone }
 */
export async function assignVolunteerToRequest(requestId, volunteerUser) {
  const reqRef = doc(db, COLLECTIONS.REQUESTS, requestId);
  return await updateDoc(reqRef, {
    status: REQUEST_STATUS.IN_PROGRESS,
    assignedTo: {
      uid: volunteerUser.uid,
      name: volunteerUser.displayName || 'Volunteer',
      phone: volunteerUser.phone || '',
      assignedAt: new Date().toISOString(),
    },
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a crisis request
 *
 * @param {string} requestId
 */
export async function deleteCrisisRequest(requestId) {
  const reqRef = doc(db, COLLECTIONS.REQUESTS, requestId);
  return await deleteDoc(reqRef);
}

/**
 * Fetches and sorts requests by proximity to a given coordinate
 *
 * @param {number} userLat
 * @param {number} userLng
 * @param {number} maxDistanceKm - default 50km
 * @returns {Promise<Array>} Sorted requests with calculated distance
 */
export async function getNearbyRequests(userLat, userLng, maxDistanceKm = 50) {
  const q = query(
    collection(db, COLLECTIONS.REQUESTS),
    where('status', 'in', [REQUEST_STATUS.PENDING, REQUEST_STATUS.IN_PROGRESS])
  );

  const snapshot = await getDocs(q);
  const requests = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    let distance = null;

    if (userLat && userLng && data.location?.lat && data.location?.lng) {
      distance = calculateDistance(
        userLat,
        userLng,
        data.location.lat,
        data.location.lng
      );
    }

    if (distance === null || distance <= maxDistanceKm) {
      requests.push({
        id: doc.id,
        ...data,
        distance, // km from user
      });
    }
  });

  // Sort by distance (closest first), fallback by urgency
  const urgencyWeight = {
    [URGENCY_LEVELS.CRITICAL]: 4,
    [URGENCY_LEVELS.HIGH]: 3,
    [URGENCY_LEVELS.MEDIUM]: 2,
    [URGENCY_LEVELS.LOW]: 1,
  };

  return requests.sort((a, b) => {
    if (a.distance !== null && b.distance !== null) {
      return a.distance - b.distance;
    }
    return (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0);
  });
}

/**
 * Verification Mechanism: Validates a crisis request to prevent fake/outdated emergencies.
 * Allows volunteers, authorized responders, or NGOs to verify an emergency as genuine.
 *
 * @param {string} requestId
 * @param {Object} verifierUser - { uid, name, role }
 */
export async function verifyCrisisRequest(requestId, verifierUser) {
  const reqRef = doc(db, COLLECTIONS.REQUESTS, requestId);

  return await updateDoc(reqRef, {
    isVerified: true,
    status: REQUEST_STATUS.VERIFIED,
    verifiedAt: serverTimestamp(),
    verifiedBy: arrayUnion({
      uid: verifierUser?.uid || 'anonymous',
      name: verifierUser?.displayName || verifierUser?.name || 'Authorized Responder',
      role: verifierUser?.role || 'VOLUNTEER',
      timestamp: new Date().toISOString(),
    }),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Duplicate Prevention: Scans for active emergencies of the same category within
 * a close geographical radius (e.g. 500m) reported within the last 2 hours.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {string} category
 * @param {number} maxDistanceKm - Default 0.5km (500 meters)
 * @returns {Promise<Array>} List of potential duplicate requests
 */
export async function checkForPotentialDuplicates(lat, lng, category, maxDistanceKm = 0.5, preloadedRequests = null) {
  if (!lat || !lng) return [];

  let candidateList = [];
  if (Array.isArray(preloadedRequests)) {
    candidateList = preloadedRequests;
  } else {
    try {
      const q = query(
        collection(db, COLLECTIONS.REQUESTS),
        where('category', '==', category),
        where('status', 'in', [REQUEST_STATUS.PENDING, REQUEST_STATUS.VERIFIED, REQUEST_STATUS.IN_PROGRESS])
      );
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        candidateList.push({ id: doc.id, ...doc.data() });
      });
    } catch {
      return [];
    }
  }

  const duplicates = [];
  candidateList.forEach((data) => {
    if (data.category === category && data.location?.lat && data.location?.lng) {
      const dist = calculateDistance(lat, lng, data.location.lat, data.location.lng);
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
 *
 * @param {Object|Date} createdAt
 * @param {number} maxHours - default 24
 * @returns {boolean}
 */
export function isRequestOutdated(createdAt, maxHours = 24) {
  if (!createdAt) return false;
  let createdDate;
  if (createdAt.toDate && typeof createdAt.toDate === 'function') {
    createdDate = createdAt.toDate();
  } else if (createdAt instanceof Date) {
    createdDate = createdAt;
  } else if (createdAt.seconds) {
    createdDate = new Date(createdAt.seconds * 1000);
  } else {
    createdDate = new Date(createdAt);
  }

  const hoursDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff >= maxHours;
}

/**
 * Marks a request as OUTDATED to prevent volunteers from wasting time on dead calls
 *
 * @param {string} requestId
 */
export async function markRequestOutdated(requestId) {
  const reqRef = doc(db, COLLECTIONS.REQUESTS, requestId);
  return await updateDoc(reqRef, {
    status: REQUEST_STATUS.OUTDATED,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Location-Based Matching: Finds and ranks available volunteers within a given radius.
 *
 * @param {number} requestLat
 * @param {number} requestLng
 * @param {number} maxDistanceKm - Default 15km
 * @returns {Promise<Array>} Ranked nearby volunteers
 */
export async function matchNearbyVolunteers(requestLat, requestLng, maxDistanceKm = 15, preloadedVolunteers = null) {
  if (!requestLat || !requestLng) return [];

  let candidateVolunteers = [];
  if (Array.isArray(preloadedVolunteers)) {
    candidateVolunteers = preloadedVolunteers;
  } else {
    try {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('role', 'in', ['VOLUNTEER', 'ORGANIZATION']),
        where('isAvailable', '==', true)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        candidateVolunteers.push({ id: doc.id, ...doc.data() });
      });
    } catch {
      return [];
    }
  }

  const matchedVolunteers = [];
  candidateVolunteers.forEach((user) => {
    if (user.location?.lat && user.location?.lng) {
      const distance = calculateDistance(requestLat, requestLng, user.location.lat, user.location.lng);
      if (distance !== null && distance <= maxDistanceKm) {
        matchedVolunteers.push({
          id: user.id || user.uid,
          uid: user.uid || user.id,
          name: user.name || user.displayName,
          phone: user.mobileNo || user.phone,
          bloodGroup: user.bloodGroup,
          role: user.role,
          distance: Number(distance.toFixed(2)),
        });
      }
    }
  });

  return matchedVolunteers.sort((a, b) => a.distance - b.distance);
}

