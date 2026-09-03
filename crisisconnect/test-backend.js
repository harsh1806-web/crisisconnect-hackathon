/* global process */
/**
 * CrisisConnect - Automated Backend Test Suite
 * Run with: node test-backend.js
 */

import * as constants from './src/utils/constants.js';
import * as helpers from './src/utils/helpers.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('🧪 CRISISCONNECT BACKEND TEST SUITE');
console.log('========================================\n');

// 1. Constants Tests
console.log('📦 1. Testing Domain Constants & Enums:');
assert(constants.USER_ROLES.VICTIM === 'VICTIM', 'USER_ROLES contains VICTIM');
assert(constants.USER_ROLES.VOLUNTEER === 'VOLUNTEER', 'USER_ROLES contains VOLUNTEER');
assert(constants.BLOOD_GROUPS.includes('O+') && constants.BLOOD_GROUPS.includes('AB-'), 'BLOOD_GROUPS contains O+ and AB-');
assert(constants.URGENCY_LEVELS.CRITICAL === 'CRITICAL', 'URGENCY_LEVELS contains CRITICAL');
assert(constants.REQUEST_STATUS.PENDING === 'PENDING', 'REQUEST_STATUS contains PENDING');
assert(constants.COLLECTIONS.USERS === 'users', 'COLLECTIONS has users');
assert(constants.COLLECTIONS.REQUESTS === 'requests', 'COLLECTIONS has requests');
assert(constants.COLLECTIONS.DEVICE_TOKENS === 'device_tokens', 'COLLECTIONS has device_tokens');

// 2. Helper & Math Tests
console.log('\n📐 2. Testing Utilities & Geolocation Math:');

// Haversine formula tests
const samePointDist = helpers.calculateDistance(19.0760, 72.8777, 19.0760, 72.8777);
assert(samePointDist === 0, `Distance between identical points is 0 km (got ${samePointDist})`);

const mumbaiToPune = helpers.calculateDistance(19.0760, 72.8777, 18.5204, 73.8567);
assert(mumbaiToPune > 115 && mumbaiToPune < 125, `Distance Mumbai -> Pune is ~120 km (got ${mumbaiToPune} km)`);

const nullDist = helpers.calculateDistance(null, null, 18.5204, 73.8567);
assert(nullDist === null, 'calculateDistance returns null for invalid inputs');

// Phone Validation tests
assert(helpers.validatePhoneNumber('+91 9876543210') === true, 'Validates Indian mobile format');
assert(helpers.validatePhoneNumber('9876543210') === true, 'Validates 10-digit mobile number');
assert(helpers.validatePhoneNumber('123') === false, 'Rejects too-short phone numbers');
assert(helpers.validatePhoneNumber('') === false, 'Rejects empty phone number');

// Email Validation tests
assert(helpers.validateEmail('responder@crisisconnect.org') === true, 'Validates valid email format');
assert(helpers.validateEmail('invalid-email') === false, 'Rejects invalid email');

// Relative time tests
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
assert(helpers.formatRelativeTime(fiveMinutesAgo) === '5m ago', 'Relative time returns 5m ago');

const justNow = new Date(Date.now() - 10 * 1000);
assert(helpers.formatRelativeTime(justNow) === 'Just now', 'Relative time returns Just now');

// Badges test
assert(helpers.getUrgencyBadgeClass('CRITICAL').includes('bg-red-500'), 'CRITICAL urgency uses red badge');
assert(helpers.getStatusBadgeClass('PENDING').includes('bg-yellow-100'), 'PENDING status uses yellow badge');

// 3. Service Exports Test
console.log('\n🔌 3. Verifying Backend Service Exports:');

async function testServiceExports() {
  try {
    const authService = await import('./src/services/authService.js');
    assert(typeof authService.registerWithEmail === 'function', 'authService exports registerWithEmail');
    assert(typeof authService.loginWithEmail === 'function', 'authService exports loginWithEmail');
    assert(typeof authService.loginWithGoogle === 'function', 'authService exports loginWithGoogle');
    assert(typeof authService.updateUserLocation === 'function', 'authService exports updateUserLocation');
    assert(typeof authService.getUserProfile === 'function', 'authService exports getUserProfile');

    const reqService = await import('./src/services/requestService.js');
    assert(typeof reqService.createCrisisRequest === 'function', 'requestService exports createCrisisRequest');
    assert(typeof reqService.subscribeToRequests === 'function', 'requestService exports subscribeToRequests');
    assert(typeof reqService.updateRequestStatus === 'function', 'requestService exports updateRequestStatus');
    assert(typeof reqService.assignVolunteerToRequest === 'function', 'requestService exports assignVolunteerToRequest');
    assert(typeof reqService.getNearbyRequests === 'function', 'requestService exports getNearbyRequests');

    const notifService = await import('./src/services/notificationService.js');
    assert(typeof notifService.getOrCreateDeviceToken === 'function', 'notificationService exports getOrCreateDeviceToken');
    assert(typeof notifService.registerDeviceToken === 'function', 'notificationService exports registerDeviceToken');
    assert(typeof notifService.triggerDeviceNotification === 'function', 'notificationService exports triggerDeviceNotification');
    assert(typeof notifService.listenForIncomingAlerts === 'function', 'notificationService exports listenForIncomingAlerts');

    console.log('\n========================================');
    console.log(`📊 RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Error importing services:', err);
    process.exit(1);
  }
}

testServiceExports();
