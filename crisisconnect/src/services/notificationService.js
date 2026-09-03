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
 * Triggers an immediate device notification with siren audio and toast
 */
export function triggerDeviceNotification(title, options = {}) {
  // 1. Play Emergency Siren Audio
  playEmergencyAlertSound();

  // 2. Display React Hot Toast
  toast.error(`${title} - ${options.body || 'Emergency assistance response needed.'}`, {
    duration: 6000,
    position: 'top-right',
  });

  // 3. Trigger Browser Native Push Notification if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options.body || 'CrisisConnect Emergency Alert',
        icon: '/favicon.svg',
        tag: 'crisisconnect-alert',
        requireInteraction: true,
      });
    } catch (err) {
      console.warn('Native notification failed:', err);
    }
  }
}

/**
 * Listens for new incoming emergency requests across the network using Supabase Realtime
 */
export function listenForIncomingAlerts() {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel('realtime:emergency_alerts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'emergency_requests' },
      (payload) => {
        const newReq = payload.new;
        if (newReq) {
          triggerDeviceNotification(`🚨 NEW EMERGENCY: ${newReq.category}`, {
            body: `${newReq.title} at ${newReq.location_name || 'Nearby Area'}`,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
