import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from './firebase';
import { COLLECTIONS } from '../utils/constants';

const LOCAL_STORAGE_DEVICE_TOKEN = 'crisisconnect_device_token';

/**
 * Request browser notification permission
 * @returns {Promise<string>} 'granted' | 'denied' | 'default'
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Generates or retrieves a persistent device token for the current client
 * @returns {string} Unique device token
 */
export function getOrCreateDeviceToken() {
  if (typeof window === 'undefined') return 'server_mock_token';

  let token = localStorage.getItem(LOCAL_STORAGE_DEVICE_TOKEN);
  if (!token) {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const timeStamp = Date.now().toString(36);
    token = `dev_${timeStamp}_${randomHex}`;
    localStorage.setItem(LOCAL_STORAGE_DEVICE_TOKEN, token);
  }
  return token;
}

/**
 * Registers the device token in Firestore database
 *
 * @param {string} userId - Auth user ID or 'anonymous'
 * @param {Object} metadata - { email, name, location, bloodGroup }
 * @returns {Promise<string>} Registered token
 */
export async function registerDeviceToken(userId, metadata = {}) {
  const token = getOrCreateDeviceToken();

  try {
    const tokenDocRef = doc(db, COLLECTIONS.DEVICE_TOKENS, token);
    await setDoc(
      tokenDocRef,
      {
        token,
        userId: userId || 'anonymous',
        userName: metadata.name || metadata.displayName || '',
        userEmail: metadata.email || '',
        userPhone: metadata.mobileNo || metadata.phone || '',
        bloodGroup: metadata.bloodGroup || '',
        location: metadata.location || null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        lastActiveAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not store device token in Firestore:', err.message);
  }

  return token;
}

/**
 * Plays an emergency beep audio alert using the Web Audio API
 */
export function playEmergencyAlertSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Beep 1 (High frequency alarm)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.2);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Beep 2 (Second urgent pulse)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(980, now + 0.25);
    osc2.frequency.exponentialRampToValueAtTime(520, now + 0.45);

    gain2.gain.setValueAtTime(0.35, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 0.45);
  } catch (e) {
    console.warn('Web Audio playback failed:', e);
  }
}

/**
 * Broadcasts a local browser push notification and audio alert
 *
 * @param {string} title
 * @param {Object} options - { body, icon, urgency }
 */
export function triggerDeviceNotification(title, options = {}) {
  // 1. Play alert sound
  playEmergencyAlertSound();

  // 2. In-app interactive toast
  toast.error(
    `🚨 ${title}\n${options.body || ''}`,
    {
      duration: 6000,
      position: 'top-right',
      style: {
        background: '#991b1b',
        color: '#fff',
        fontWeight: '600',
        padding: '16px',
        borderRadius: '10px',
        border: '2px solid #ef4444',
      },
    }
  );

  // 3. Desktop Native Notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`🚨 CrisisConnect: ${title}`, {
        body: options.body || 'Immediate attention requested in your area.',
        icon: '/favicon.svg',
        vibrate: [200, 100, 200, 100, 200],
        tag: options.id || 'emergency-alert',
      });
    } catch (e) {
      console.warn('Desktop notification failed:', e);
    }
  }
}

/**
 * Real-time listener for incoming emergency alerts across the network.
 * Automatically notifies all connected devices when someone posts or updates an alert.
 *
 * @param {Function} onAlertReceived - Optional callback receiving the emergency payload
 * @returns {Function} Unsubscribe function
 */
export function listenForIncomingAlerts(onAlertReceived) {
  let isInitialLoad = true;
  const q = query(
    collection(db, COLLECTIONS.REQUESTS),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      // First snapshot loads existing records; don't spam alerts for historical records
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const alertData = { id: change.doc.id, ...change.doc.data() };
          triggerDeviceNotification(
            `NEW EMERGENCY: ${alertData.title}`,
            {
              body: `${alertData.category} • Urgency: ${alertData.urgency}\n${alertData.description || 'Assistance requested immediately.'}`,
              id: alertData.id,
              urgency: alertData.urgency,
            }
          );
          if (onAlertReceived) onAlertReceived(alertData, 'added');
        } else if (change.type === 'modified') {
          const alertData = { id: change.doc.id, ...change.doc.data() };
          if (alertData.status === 'RESOLVED') {
            toast.success(`✅ Emergency Resolved: ${alertData.title}`);
          } else {
            triggerDeviceNotification(
              `EMERGENCY UPDATED: ${alertData.title}`,
              {
                body: `Status changed to ${alertData.status}`,
                id: alertData.id,
              }
            );
          }
          if (onAlertReceived) onAlertReceived(alertData, 'modified');
        }
      });
    },
    (err) => {
      console.error('Error listening for incoming emergency alerts:', err);
    }
  );

  return unsubscribe;
}
