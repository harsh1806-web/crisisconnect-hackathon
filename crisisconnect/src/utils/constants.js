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

// Emergency Request Categories (aligned with Hackathon Problem Statement)
export const REQUEST_CATEGORIES = {
  BLOOD: 'BLOOD',
  FOOD: 'FOOD',
  MEDICINES: 'MEDICINES',
  OXYGEN: 'OXYGEN',
  SHELTER: 'SHELTER',
  TRANSPORTATION: 'TRANSPORTATION',
  RESCUE: 'RESCUE',
  MEDICAL: 'MEDICAL',
  OTHER: 'OTHER',
};

// Urgency / Priority Levels
export const URGENCY_LEVELS = {
  CRITICAL: 'CRITICAL', // Immediate life threat
  HIGH: 'HIGH',         // Needs attention within 1-2 hours
  MEDIUM: 'MEDIUM',     // Needs attention within 6-12 hours
  LOW: 'LOW',           // General assistance needed
};

// Request Lifecycle Statuses (with Verification & Outdated tracking)
export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  OUTDATED: 'OUTDATED',
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
  MEDICINES: 'MEDICINES',
  BLOOD_UNITS: 'BLOOD_UNITS',
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
  [REQUEST_CATEGORIES.BLOOD]: '🩸 Blood Assistance',
  [REQUEST_CATEGORIES.FOOD]: '🍲 Food & Drinking Water',
  [REQUEST_CATEGORIES.MEDICINES]: '💊 Essential Medicines',
  [REQUEST_CATEGORIES.OXYGEN]: '🫧 Oxygen Cylinders',
  [REQUEST_CATEGORIES.SHELTER]: '⛺ Emergency Shelter',
  [REQUEST_CATEGORIES.TRANSPORTATION]: '🚑 Ambulance & Transportation',
  [REQUEST_CATEGORIES.RESCUE]: '🚨 Emergency Rescue',
  [REQUEST_CATEGORIES.MEDICAL]: '🩺 General Medical',
  [REQUEST_CATEGORIES.OTHER]: '📦 Other Assistance',
};
