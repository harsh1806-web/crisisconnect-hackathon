import { URGENCY_LEVELS, REQUEST_STATUS } from './constants.js';

/**
 * Calculates the great-circle distance between two geographic coordinates
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1 (in degrees)
 * @param {number} lon1 - Longitude of point 1 (in degrees)
 * @param {number} lat2 - Latitude of point 2 (in degrees)
 * @param {number} lon2 - Longitude of point 2 (in degrees)
 * @param {string} unit - 'km' (default) or 'miles'
 * @returns {number} Distance in requested unit rounded to 2 decimal places
 */
export function calculateDistance(lat1, lon1, lat2, lon2, unit = 'km') {
  if (
    lat1 === undefined || lon1 === undefined ||
    lat2 === undefined || lon2 === undefined ||
    lat1 === null || lon1 === null ||
    lat2 === null || lon2 === null
  ) {
    return null;
  }

  const toRad = (value) => (value * Math.PI) / 180;
  const R = unit === 'miles' ? 3958.8 : 6371; // Earth's radius in miles or km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Formats a Firestore Timestamp or standard JS Date into a human-readable relative string (e.g., "5 mins ago")
 *
 * @param {Date|Object|number|string} timestamp - Timestamp to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';

  let date;
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return 'Recently';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Returns Tailwind CSS badge classes corresponding to an Urgency level
 *
 * @param {string} urgency - 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
 * @returns {string} Tailwind classes
 */
export function getUrgencyBadgeClass(urgency) {
  switch (urgency) {
    case URGENCY_LEVELS.CRITICAL:
      return 'bg-red-500 text-white animate-pulse font-bold';
    case URGENCY_LEVELS.HIGH:
      return 'bg-orange-500 text-white font-semibold';
    case URGENCY_LEVELS.MEDIUM:
      return 'bg-amber-400 text-gray-900 font-medium';
    case URGENCY_LEVELS.LOW:
      return 'bg-blue-100 text-blue-800 font-medium';
    default:
      return 'bg-gray-200 text-gray-700';
  }
}

/**
 * Returns Tailwind CSS badge classes corresponding to a Request status
 *
 * @param {string} status - 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'
 * @returns {string} Tailwind classes
 */
export function getStatusBadgeClass(status) {
  switch (status) {
    case REQUEST_STATUS.PENDING:
      return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    case REQUEST_STATUS.IN_PROGRESS:
      return 'bg-blue-100 text-blue-800 border border-blue-300';
    case REQUEST_STATUS.RESOLVED:
      return 'bg-green-100 text-green-800 border border-green-300';
    case REQUEST_STATUS.CANCELLED:
      return 'bg-gray-100 text-gray-600 border border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
}

/**
 * Simple phone number validator (supports 10+ digits / country codes)
 *
 * @param {string} phone
 * @returns {boolean}
 */
export function validatePhoneNumber(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-()+]/g, '');
  return /^\d{10,15}$/.test(cleaned);
}

/**
 * Email validation helper
 *
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Formats GPS coordinates for display
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {string}
 */
export function formatCoordinates(lat, lng) {
  if (lat === undefined || lng === undefined || lat === null || lng === null) {
    return 'Location not available';
  }
  return `${Number(lat).toFixed(4)}°, ${Number(lng).toFixed(4)}°`;
}
