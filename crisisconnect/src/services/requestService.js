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
} from 'firebase/firestore';
import { db } from './firebase';
import {
  COLLECTIONS,
  REQUEST_STATUS,
  URGENCY_LEVELS,
  REQUEST_CATEGORIES,
} from '../utils/constants';
import { calculateDistance } from '../utils/helpers';

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
