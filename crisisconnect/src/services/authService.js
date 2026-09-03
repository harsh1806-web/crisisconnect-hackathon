import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase.js';
import { COLLECTIONS, USER_ROLES } from '../utils/constants.js';
import { registerDeviceToken } from './notificationService.js';

/**
 * Creates a new user with Email/Password and stores their full profile in Firestore:
 * name, mobileNo, email, age, bloodGroup, location, deviceToken, role.
 *
 * @param {string} email
 * @param {string} password
 * @param {Object} profileData - { name, displayName, mobileNo, phone, age, bloodGroup, location, role }
 * @returns {Promise<Object>} user object and profile
 */
export async function registerWithEmail(email, password, profileData = {}) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const fullName = profileData.name || profileData.displayName || user.email.split('@')[0];
  const mobile = profileData.mobileNo || profileData.phone || '';
  const age = profileData.age ? Number(profileData.age) : null;
  const bloodGroup = profileData.bloodGroup || '';
  const location = profileData.location || { lat: null, lng: null, address: '' };

  // Update display name in Firebase Auth
  if (fullName) {
    await updateProfile(user, { displayName: fullName });
  }

  // Generate & register device token
  const deviceToken = await registerDeviceToken(user.uid, {
    name: fullName,
    email: user.email,
    mobileNo: mobile,
    bloodGroup,
    location,
  });

  // Create user profile in Firestore
  const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
  const userProfile = {
    uid: user.uid,
    name: fullName,
    displayName: fullName,
    email: user.email,
    mobileNo: mobile,
    phone: mobile,
    age,
    bloodGroup,
    role: profileData.role || USER_ROLES.VICTIM,
    location: {
      lat: location.lat || null,
      lng: location.lng || null,
      address: location.address || '',
      updatedAt: new Date().toISOString(),
    },
    deviceToken,
    isAvailable: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userDocRef, userProfile);

  return { user, profile: userProfile };
}

/**
 * Sign in existing user with email and password,
 * updating current location and device token.
 *
 * @param {string} email
 * @param {string} password
 * @param {Object} currentLocation - Optional { lat, lng, address }
 * @returns {Promise<Object>} Firebase user credential
 */
export async function loginWithEmail(email, password, currentLocation = null) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Register device token for this device
  const deviceToken = await registerDeviceToken(user.uid, {
    email: user.email,
    location: currentLocation,
  });

  // Update user document with current location and device token
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
    const updates = {
      deviceToken,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (currentLocation && (currentLocation.lat || currentLocation.address)) {
      updates.location = {
        lat: currentLocation.lat || null,
        lng: currentLocation.lng || null,
        address: currentLocation.address || '',
        updatedAt: new Date().toISOString(),
      };
    }
    await updateDoc(userDocRef, updates);
  } catch (err) {
    console.warn('Could not update user login metadata:', err.message);
  }

  return credential;
}

/**
 * Sign in / Sign up with Google OAuth popup.
 *
 * @param {string} defaultRole
 * @param {Object} currentLocation
 * @returns {Promise<Object>} { user, profile }
 */
export async function loginWithGoogle(defaultRole = USER_ROLES.VICTIM, currentLocation = null) {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const deviceToken = await registerDeviceToken(user.uid, {
    name: user.displayName,
    email: user.email,
    location: currentLocation,
  });

  const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
  const docSnap = await getDoc(userDocRef);

  let profile;
  if (!docSnap.exists()) {
    profile = {
      uid: user.uid,
      name: user.displayName || 'Anonymous User',
      displayName: user.displayName || 'Anonymous User',
      email: user.email,
      mobileNo: user.phoneNumber || '',
      phone: user.phoneNumber || '',
      age: null,
      bloodGroup: '',
      photoURL: user.photoURL || '',
      role: defaultRole,
      location: currentLocation || { lat: null, lng: null, address: '' },
      deviceToken,
      isAvailable: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userDocRef, profile);
  } else {
    profile = docSnap.data();
    // Update token & location
    const updates = { deviceToken, updatedAt: serverTimestamp() };
    if (currentLocation) updates.location = currentLocation;
    await updateDoc(userDocRef, updates);
  }

  return { user, profile };
}

/**
 * Updates user live GPS coordinates in Firestore
 *
 * @param {string} uid
 * @param {Object} location - { lat, lng, address }
 */
export async function updateUserLocation(uid, location) {
  if (!uid || !location) return;
  const userDocRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userDocRef, {
    location: {
      lat: location.lat || null,
      lng: location.lng || null,
      address: location.address || '',
      updatedAt: new Date().toISOString(),
    },
    updatedAt: serverTimestamp(),
  });
}

/**
 * Log out current authenticated user
 */
export async function logoutUser() {
  return await signOut(auth);
}

/**
 * Send password reset email
 *
 * @param {string} email
 */
export async function resetPassword(email) {
  return await sendPasswordResetEmail(auth, email);
}

/**
 * Fetch user profile from Firestore by UID
 *
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const userDocRef = doc(db, COLLECTIONS.USERS, uid);
  const docSnap = await getDoc(userDocRef);
  return docSnap.exists() ? docSnap.data() : null;
}

/**
 * Updates a user profile in Firestore
 *
 * @param {string} uid
 * @param {Object} updates
 */
export async function updateUserProfile(uid, updates = {}) {
  if (!uid) throw new Error('User ID is required to update profile');
  const userDocRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userDocRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}
