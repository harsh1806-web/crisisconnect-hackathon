/* global global, process */
import { citizenDB } from './src/services/db.js';
import {
  checkForPotentialDuplicates,
  isRequestOutdated,
  matchNearbyVolunteers,
  createCrisisRequest,
  subscribeToRequests,
  updateRequestStatus,
  verifyCrisisRequest,
  assignVolunteerToRequest,
  getNearbyRequests,
} from './src/services/requestService.js';
import {
  registerWithEmail,
  loginWithEmail,
  getUserProfile,
  updateUserLocation,
} from './src/services/authService.js';
import {
  getOrCreateDeviceToken,
  registerDeviceToken,
  triggerDeviceNotification,
} from './src/services/notificationService.js';
import {
  supabase,
  registerCitizenInSupabase,
  loginCitizenInSupabase,
  registerDeviceTokenInSupabase,
  createEmergencyRequestInSupabase,
  subscribeToSupabaseEmergencies,
} from './src/services/supabase.js';
import { sampleRequests } from './src/database/sampleRequests.js';

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

async function runTests() {
  console.log("\n=======================================================");
  console.log("🗄️ CRISISCONNECT SUPABASE DATABASE REQUESTS VERIFICATION");
  console.log("=======================================================\n");

  // 1. Citizen Database (services/db.js)
  console.log("📦 1. Testing Citizen Database CRUD Operations:");
  try {
    if (typeof global.localStorage === 'undefined') {
      const storage = {};
      global.localStorage = {
        getItem: (k) => storage[k] || null,
        setItem: (k, v) => { storage[k] = String(v); },
        removeItem: (k) => { delete storage[k]; },
        clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
      };
    }

    const initialList = citizenDB.getAll();
    assert(Array.isArray(initialList) && initialList.length > 0, "citizenDB.getAll() retrieves seed records");

    const testPhone = "+91 99887 76655";
    const regResult = citizenDB.register({
      name: "Aarav Mehta",
      phone: testPhone,
      email: "aarav.mehta@example.com",
      address: "Andheri West, Mumbai",
      bloodGroup: "B+",
      allergies: "None",
      emergencyContactName: "Pooja Mehta",
      emergencyContactPhone: "+91 99887 76654"
    });

    assert(regResult.success === true, "citizenDB.register() creates new citizen record");
    assert(regResult.citizen.name === "Aarav Mehta", "Stored citizen name matches input");
    assert(regResult.citizen.bloodGroup === "B+", "Stored citizen blood group matches input");

    const foundByPhone = citizenDB.findByPhone(testPhone);
    assert(foundByPhone && foundByPhone.name === "Aarav Mehta", "citizenDB.findByPhone() locates record by mobile number");

    const foundById = citizenDB.findById(regResult.citizen.id);
    assert(foundById && foundById.id === regResult.citizen.id, "citizenDB.findById() locates record by unique ID");

    // Test Update on duplicate phone
    const updateResult = citizenDB.register({
      name: "Aarav Mehta Updated",
      phone: testPhone,
      email: "aarav.new@example.com",
      bloodGroup: "B+",
    });
    assert(updateResult.isUpdate === true, "citizenDB.register() correctly handles existing phone as update");
    assert(updateResult.citizen.name === "Aarav Mehta Updated", "Updated citizen name persisted");

  } catch (err) {
    assert(false, `Citizen DB tests encountered error: ${err.message}`);
  }

  // 2. Request Service Database Logic (requestService.js)
  console.log("\n📡 2. Testing Crisis Request Service Database Functions:");
  try {
    assert(typeof createCrisisRequest === 'function', "createCrisisRequest is exported and callable");
    assert(typeof subscribeToRequests === 'function', "subscribeToRequests is exported and callable");
    assert(typeof updateRequestStatus === 'function', "updateRequestStatus is exported and callable");
    assert(typeof verifyCrisisRequest === 'function', "verifyCrisisRequest (Verification Mechanism) is exported");
    assert(typeof assignVolunteerToRequest === 'function', "assignVolunteerToRequest is exported");
    assert(typeof getNearbyRequests === 'function', "getNearbyRequests is exported");

    // Test Duplicate Detection Algorithm
    const baseLat = 19.0760;
    const baseLng = 72.8777;
    const sameSpotLat = 19.0761; // ~11 meters away
    const sameSpotLng = 72.8777;
    const farSpotLat = 19.2000;  // ~14 km away
    const farSpotLng = 72.8777;

    const mockExistingRequests = [
      { id: 'req-1', location: { lat: baseLat, lng: baseLng }, category: 'OXYGEN', status: 'PENDING' }
    ];

    const isDuplicateNearby = await checkForPotentialDuplicates(sameSpotLat, sameSpotLng, 'OXYGEN', 0.5, mockExistingRequests);
    assert(isDuplicateNearby.length > 0, "checkForPotentialDuplicates() detects emergency within 500m radius (Duplicate Prevention)");

    const isDuplicateFar = await checkForPotentialDuplicates(farSpotLat, farSpotLng, 'OXYGEN', 0.5, mockExistingRequests);
    assert(isDuplicateFar.length === 0, "checkForPotentialDuplicates() allows emergency outside 500m radius");

    // Test Outdated Request Detection
    const freshTimestamp = new Date().toISOString();
    const oldTimestamp = new Date(Date.now() - 36 * 3600 * 1000).toISOString(); // 36 hours ago

    assert(isRequestOutdated(freshTimestamp, 24) === false, "isRequestOutdated() returns false for recent emergency");
    assert(isRequestOutdated(oldTimestamp, 24) === true, "isRequestOutdated() returns true for >24h stale emergency (Outdated Detection)");

    // Test Volunteer Proximity Matching
    const mockVolunteers = [
      { id: 'vol-1', name: 'Close Volunteer', location: { lat: 19.0780, lng: 72.8780 }, isAvailable: true }, // ~200m
      { id: 'vol-2', name: 'Far Volunteer', location: { lat: 19.2500, lng: 72.8800 }, isAvailable: true }    // ~19km
    ];

    const matched = await matchNearbyVolunteers(baseLat, baseLng, 5.0, mockVolunteers);
    assert(matched.length === 1 && matched[0].id === 'vol-1', "matchNearbyVolunteers() matches only responders within radius (5km)");

  } catch (err) {
    assert(false, `Request Service tests encountered error: ${err.message}`);
  }

  // 3. Device Tokens & Push Notification Service
  console.log("\n🔔 3. Testing Device Token & Notification Registration:");
  try {
    const token = getOrCreateDeviceToken();
    assert(typeof token === 'string' && token.length > 0, "getOrCreateDeviceToken() generates valid device token: " + token);
    assert(typeof registerDeviceToken === 'function', "registerDeviceToken() is exported");
    assert(typeof triggerDeviceNotification === 'function', "triggerDeviceNotification() is exported");
  } catch (err) {
    assert(false, `Notification tests encountered error: ${err.message}`);
  }

  // 4. Auth & User Profile Service
  console.log("\n👤 4. Testing User Profile & Auth Service Database Functions:");
  try {
    assert(typeof registerWithEmail === 'function', "registerWithEmail() is exported");
    assert(typeof loginWithEmail === 'function', "loginWithEmail() is exported");
    assert(typeof getUserProfile === 'function', "getUserProfile() is exported");
    assert(typeof updateUserLocation === 'function', "updateUserLocation() is exported");
  } catch (err) {
    assert(false, `Auth Service tests encountered error: ${err.message}`);
  }

  // 5. Supabase Database Client & Services (services/supabase.js)
  console.log("\n⚡ 5. Testing Supabase Database Client & Services:");
  try {
    assert(Boolean(supabase), "Supabase client is initialized");
    assert(typeof registerCitizenInSupabase === 'function', "registerCitizenInSupabase is exported");
    assert(typeof loginCitizenInSupabase === 'function', "loginCitizenInSupabase is exported");
    assert(typeof registerDeviceTokenInSupabase === 'function', "registerDeviceTokenInSupabase is exported");
    assert(typeof createEmergencyRequestInSupabase === 'function', "createEmergencyRequestInSupabase is exported");
    assert(typeof subscribeToSupabaseEmergencies === 'function', "subscribeToSupabaseEmergencies is exported");
  } catch (err) {
    assert(false, `Supabase tests encountered error: ${err.message}`);
  }

  // 6. Sample Emergencies Database Integrity (database/sampleRequests.js)
  console.log("\n📊 6. Testing Sample Requests Database Integrity:");
  try {
    assert(Array.isArray(sampleRequests) && sampleRequests.length > 0, "sampleRequests is non-empty array");
    const allHaveRequiredFields = sampleRequests.every(req => 
      req.id && req.category && req.status && req.location && req.location.latitude && req.location.longitude
    );
    assert(allHaveRequiredFields, "All sample emergencies contain valid ID, category, status, and geo coordinates");
  } catch (err) {
    assert(false, `Sample Requests tests encountered error: ${err.message}`);
  }

  console.log("\n=======================================================");
  console.log(`📊 SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("=======================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
