/**
 * CrisisConnect - System Constants
 * Shared domain values for authentication, requests, resources, and database collections.
 */

// User Roles
export const USER_ROLES = {
  VICTIM: 'VICTIM',
  VOLUNTEER: 'VOLUNTEER',
  ORGANIZATION: 'ORGANIZATION', // NGOs, Hospitals, Relief Camps
  ADMIN: 'ADMIN',
};

// Emergency Request Categories
export const REQUEST_CATEGORIES = {
  MEDICAL: 'MEDICAL',
  RESCUE: 'RESCUE',
  FOOD_WATER: 'FOOD_WATER',
  SHELTER: 'SHELTER',
  CLOTHING: 'CLOTHING',
  OTHER: 'OTHER',
};

// Urgency / Priority Levels
export const URGENCY_LEVELS = {
  CRITICAL: 'CRITICAL', // Immediate life threat
  HIGH: 'HIGH',         // Needs attention within 1-2 hours
  MEDIUM: 'MEDIUM',     // Needs attention within 6-12 hours
  LOW: 'LOW',           // General assistance needed
};

// Request Lifecycle Statuses
export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
};

// Relief Resource Types
export const RESOURCE_TYPES = {
  AMBULANCE: 'AMBULANCE',
  FIRST_AID_KIT: 'FIRST_AID_KIT',
  FOOD_PACKETS: 'FOOD_PACKETS',
  DRINKING_WATER: 'DRINKING_WATER',
  BLANKETS: 'BLANKETS',
  TEMPORARY_SHELTER: 'TEMPORARY_SHELTER',
  OXYGEN_CYLINDER: 'OXYGEN_CYLINDER',
  OTHER: 'OTHER',
};

// Resource Availability Status
export const RESOURCE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  LOW_STOCK: 'LOW_STOCK',
  DEPLETED: 'DEPLETED',
};

// Common Blood Groups
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// Firestore Collection Names (coordinating with Moksha's DB schema)
export const COLLECTIONS = {
  USERS: 'users',
  REQUESTS: 'requests',
  RESOURCES: 'resources',
  DEVICE_TOKENS: 'device_tokens',
  ACTIVITY_LOGS: 'activity_logs',
};

// Category Display Labels & Icons for UI
export const CATEGORY_LABELS = {
  [REQUEST_CATEGORIES.MEDICAL]: 'Medical & First Aid',
  [REQUEST_CATEGORIES.RESCUE]: 'Emergency Rescue',
  [REQUEST_CATEGORIES.FOOD_WATER]: 'Food & Drinking Water',
  [REQUEST_CATEGORIES.SHELTER]: 'Shelter & Evacuation',
  [REQUEST_CATEGORIES.CLOTHING]: 'Clothing & Blankets',
  [REQUEST_CATEGORIES.OTHER]: 'Other Assistance',
};
