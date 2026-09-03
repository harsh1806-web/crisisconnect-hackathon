import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { COLLECTIONS, RESOURCE_STATUS, RESOURCE_TYPES } from '../utils/constants.js';

/**
 * Creates a new relief resource entry (e.g. food packets, ambulance, shelters)
 *
 * @param {Object} resourceData - { name, type, quantity, unit, location, contactPerson, contactPhone, notes }
 * @param {Object} currentUser
 * @returns {Promise<Object>}
 */
export async function createResource(resourceData, currentUser = null) {
  const resourcesRef = collection(db, COLLECTIONS.RESOURCES);

  const payload = {
    name: resourceData.name?.trim() || 'Relief Supply',
    type: resourceData.type || RESOURCE_TYPES.OTHER,
    quantity: Number(resourceData.quantity) || 0,
    unit: resourceData.unit || 'units',
    status: Number(resourceData.quantity) > 0 ? RESOURCE_STATUS.AVAILABLE : RESOURCE_STATUS.DEPLETED,
    contactPerson: resourceData.contactPerson || currentUser?.displayName || '',
    contactPhone: resourceData.contactPhone || currentUser?.phone || '',
    location: {
      address: resourceData.location?.address || '',
      lat: resourceData.location?.lat ? Number(resourceData.location.lat) : null,
      lng: resourceData.location?.lng ? Number(resourceData.location.lng) : null,
    },
    createdBy: currentUser?.uid || 'anonymous',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(resourcesRef, payload);
  return { id: docRef.id, ...payload };
}

/**
 * Subscribes to available relief resources in real-time
 *
 * @param {Function} callback
 * @param {string|null} typeFilter
 * @returns {Function} Unsubscribe function
 */
export function subscribeToResources(callback, typeFilter = null) {
  let q = collection(db, COLLECTIONS.RESOURCES);
  const conditions = [];

  if (typeFilter) {
    conditions.push(where('type', '==', typeFilter));
  }

  conditions.push(orderBy('createdAt', 'desc'));

  const finalQuery = query(q, ...conditions);

  return onSnapshot(
    finalQuery,
    (snapshot) => {
      const resources = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(resources);
    },
    (error) => {
      console.error('Error listening to resources:', error);
      callback([]);
    }
  );
}

/**
 * Updates stock quantity of a relief resource
 *
 * @param {string} resourceId
 * @param {number} newQuantity
 */
export async function updateResourceQuantity(resourceId, newQuantity) {
  const resRef = doc(db, COLLECTIONS.RESOURCES, resourceId);
  const qty = Number(newQuantity);
  const status = qty <= 0 ? RESOURCE_STATUS.DEPLETED : qty < 10 ? RESOURCE_STATUS.LOW_STOCK : RESOURCE_STATUS.AVAILABLE;

  return await updateDoc(resRef, {
    quantity: qty,
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a relief resource record
 *
 * @param {string} resourceId
 */
export async function deleteResource(resourceId) {
  const resRef = doc(db, COLLECTIONS.RESOURCES, resourceId);
  return await deleteDoc(resRef);
}
