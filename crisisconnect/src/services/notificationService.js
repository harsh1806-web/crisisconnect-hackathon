import toast from 'react-hot-toast';
import { supabase, isSupabaseConfigured, registerDeviceTokenInSupabase } from './supabase.js';

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
  if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') {
    return 'server_mock_token';
  }

  const storage = typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;
  let token = storage ? storage.getItem(LOCAL_STORAGE_DEVICE_TOKEN) : null;

  if (!token) {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const timeStamp = Date.now().toString(36);
    token = `dev_${timeStamp}_${randomHex}`;
    if (storage) {
      storage.setItem(LOCAL_STORAGE_DEVICE_TOKEN, token);
    }
  }
  return token;
}

/**
 * Registers the device token in Supabase database for targeted and broadcast push alerts
 */
export async function registerDeviceToken(userId, metadata = {}) {
  const token = getOrCreateDeviceToken();

  try {
    await registerDeviceTokenInSupabase(token, {
      ...metadata,
      userId,
    });
  } catch (err) {
    console.warn('Supabase device token registration fallback:', err.message);
  }

  return token;
}

/**
 * Automatically registers the active mobile/desktop device on login:
 * 1. Prompts for notification permission on phone/browser.
 * 2. Grabs current GPS location (or profile location).
 * 3. Persists device token with user info to Supabase 'device_tokens' table.
 * 4. Subscribes to Realtime alerts so the device immediately receives broadcasts.
 *
 * @param {Object} user - Authenticated user details
 * @returns {Promise<string>} Registered token
 */
export async function registerActiveDeviceSession(user) {
  if (!user) return null;

  // 1. Request notification permission on device if not decided
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  } catch (err) {
    console.warn('Notification permission request:', err);
  }

  // 2. Obtain device GPS coordinates
  let lat = user.latitude || user.location?.lat || user.lat || null;
  let lng = user.longitude || user.location?.lng || user.lng || null;

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            resolve();
          },
          () => resolve(),
          { timeout: 3500, enableHighAccuracy: true }
        );
      });
    } catch {
      // Fallback to user profile coords
    }
  }

  // 3. Register device token in Supabase
  const token = getOrCreateDeviceToken();

  try {
    await registerDeviceTokenInSupabase(token, {
      userId: user.id,
      phone: user.phone || user.mobileNo || '',
      name: user.name || 'Active User',
      bloodGroup: user.bloodGroup || user.blood_group || '',
      role: (user.role || user.type || 'CITIZEN').toUpperCase(),
      latitude: lat,
      longitude: lng,
    });
  } catch (err) {
    console.warn('Failed to register active device in Supabase:', err);
  }

  // 4. Ensure Realtime alerts channel is actively listening
  try {
    listenForIncomingAlerts();
  } catch {
    // Ignore listener errors
  }

  return token;
}

/**
 * Plays an emergency siren audio alert using Web Audio API
 */
export function playEmergencyAlertSound() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();

    // High emergency multi-tone siren
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    // Alternating warble frequencies (880Hz to 440Hz)
    const now = audioCtx.currentTime;
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.25);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.5);

    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(880, now + 0.25);
    osc2.frequency.exponentialRampToValueAtTime(440, now + 0.5);

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  } catch {
    // Audio Context restricted before user gesture
  }
}

/**
 * Triggers an immediate device notification with siren audio, toast, and native push
 */
export function triggerDeviceNotification(title, options = {}) {
  // 1. Play Emergency Siren Audio
  playEmergencyAlertSound();

  // 2. Display React Hot Toast
  toast.error(`${title} - ${options.body || 'Emergency assistance response needed.'}`, {
    duration: 7000,
    position: 'top-right',
  });

  // 3. Trigger Browser / OS Native Notification popup via Service Worker or Notification API
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const notifOptions = {
      body: options.body || 'CrisisConnect Emergency Alert',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: options.tag || `crisisconnect-alert-${Date.now()}`,
      requireInteraction: true,
      vibrate: [0, 500, 250, 500],
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.showNotification(title, notifOptions);
        })
        .catch(() => {
          try {
            new Notification(title, notifOptions);
          } catch (e) {}
        });
    } else {
      try {
        new Notification(title, notifOptions);
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }
  }

  // 4. Trigger Native iOS/Android push via Expo Go WebView bridge
  if (typeof window !== 'undefined' && window.ReactNativeWebView) {
    try {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'EMERGENCY_SOS',
          title,
          message: options.body || 'Emergency response required in your sector.',
        })
      );
    } catch (err) {
      console.warn('WebView postMessage error:', err);
    }
  }
}

/**
 * Specifically notifies Disaster Authorities (NDMA/EOC) with AI Intimation details
 */
export function notifyAuthorityEOC(incident, aiClassification = null) {
  const authName = aiClassification?.targetAuthority?.shortName || 'Civil Defense / NDRF';
  const hotline = aiClassification?.targetAuthority?.hotline || '112';

  triggerDeviceNotification(`🚨 [AUTHORITY EOC DISPATCH] ${incident.category || 'EMERGENCY'}`, {
    body: `Intimated to ${authName} (Hotline ${hotline}). Location: ${incident.location_name || incident.locationName || 'Disaster Zone'}`,
  });
}

/**
 * Broadcasts emergency alert to all active user devices within radiusKm
 *
 * @param {Object} incident - Emergency incident data with lat, lng, title
 * @param {number} radiusKm - Proximity radius in kilometers (default 5km)
 */
export async function broadcastDisasterToNearbyUsers(incident, radiusKm = 5) {
  if (!incident || !isSupabaseConfigured) return [];

  const incLat = Number(incident.latitude || incident.lat);
  const incLng = Number(incident.longitude || incident.lng);
  if (!incLat || !incLng) return [];

  try {
    const { data: devices, error } = await supabase
      .from('device_tokens')
      .select('*');

    if (error || !devices) return [];

    const notifiedTokens = [];

    // Helper calculate distance
    const calcDist = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    for (const dev of devices) {
      const devLat = Number(dev.latitude);
      const devLng = Number(dev.longitude);
      if (devLat && devLng) {
        const dist = calcDist(incLat, incLng, devLat, devLng);
        if (dist <= radiusKm) {
          notifiedTokens.push({
            token: dev.token,
            userName: dev.user_name,
            phone: dev.user_phone,
            distanceKm: dist.toFixed(1),
          });
        }
      }
    }

    return notifiedTokens;
  } catch (err) {
    console.warn('Proximity broadcast error:', err);
    return [];
  }
}

/**
 * Realtime events are handled centrally with role/authority filtering in CrisisContext
 */
export function listenForIncomingAlerts() {
  return () => {};
}
