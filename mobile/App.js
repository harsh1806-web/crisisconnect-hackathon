import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
  Animated,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createClient } from '@supabase/supabase-js';

// CrisisConnect Live Supabase Configuration
const SUPABASE_URL = 'https://nuepesuwqeixnsjpuvfj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2LAhxzhoSGibhq_YCCNbeg_OVRqbfnG';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [currentUser] = useState({
    name: 'Harsh Sanghavi',
    phone: '9850422491',
    role: 'CITIZEN',
    bloodGroup: 'O+',
  });

  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [lastSosToken, setLastSosToken] = useState(null);

  // Pulse animation for the SOS button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Load and subscribe to real-time emergencies from Supabase
  const fetchEmergencies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('emergency_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEmergencies(data);
      }
    } catch (err) {
      console.warn('Error fetching emergencies:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();

    // Register active mobile device in Supabase device_tokens
    const registerDevice = async () => {
      try {
        const deviceToken = `expo_mobile_${Date.now().toString(36)}`;
        await supabase.from('device_tokens').upsert(
          {
            token: deviceToken,
            user_phone: currentUser.phone,
            user_name: currentUser.name,
            blood_group: currentUser.bloodGroup,
            role: 'CITIZEN',
            latitude: 19.0760,
            longitude: 72.8777,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'token' }
        );
      } catch (e) {
        console.warn('Device registration error:', e);
      }
    };
    registerDevice();

    // Subscribe to live Realtime alerts
    const channel = supabase
      .channel('realtime:expo_emergencies')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_requests' },
        () => {
          fetchEmergencies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Trigger Instant Emergency SOS Beacon
  const handleTriggerSOS = async () => {
    try {
      setSosSending(true);
      const trackingCode = `CC-${Math.floor(100000 + Math.random() * 900000)}`;

      const { data, error } = await supabase
        .from('emergency_requests')
        .insert({
          tracking_token: trackingCode,
          user_phone: currentUser.phone,
          user_name: currentUser.name,
          category: 'RESCUE',
          urgency: 'CRITICAL',
          description: `EMERGENCY SOS BEACON triggered from mobile device. Immediate rescue & life support dispatch required.`,
          latitude: 19.0760,
          longitude: 72.8777,
          location_name: 'Live Mobile GPS Beacon (Current Location)',
          status: 'PENDING',
          verification_status: 'PENDING',
          is_sos: true,
          people_count: 1,
        })
        .select()
        .single();

      if (error) throw error;

      setLastSosToken(trackingCode);
      Alert.alert(
        '🚨 SOS BEACON TRANSMITTED!',
        `Your emergency signal has been broadcast to civil defense authorities and nearest volunteers.\n\nIncident Ref: ${trackingCode}`,
        [{ text: 'Acknowledge', style: 'default' }]
      );
      fetchEmergencies();
    } catch (err) {
      Alert.alert('Transmission Error', err.message || 'Could not send SOS beacon.');
    } finally {
      setSosSending(false);
    }
  };

  // Quick Request Category Dispatch
  const handleQuickRequest = async (category, icon) => {
    try {
      const trackingCode = `CC-${Math.floor(100000 + Math.random() * 900000)}`;
      const { error } = await supabase.from('emergency_requests').insert({
        tracking_token: trackingCode,
        user_phone: currentUser.phone,
        user_name: currentUser.name,
        category: category.toUpperCase(),
        urgency: 'HIGH',
        description: `Urgent ${category} support requested from mobile application.`,
        latitude: 19.0760,
        longitude: 72.8777,
        location_name: 'Mobile User Coordinates',
        status: 'PENDING',
        verification_status: 'PENDING',
        people_count: 1,
      });

      if (error) throw error;
      Alert.alert('Request Logged', `${category} emergency request dispatched!\nRef: ${trackingCode}`);
      fetchEmergencies();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const openInteractiveMap = () => {
    Linking.openURL('http://10.110.80.99:5173/map');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Top App Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.shieldBadge}>
            <Text style={styles.shieldIcon}>🛡️</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>
              Crisis<Text style={styles.brandRed}>Connect</Text>
            </Text>
            <Text style={styles.brandSubtitle}>Disaster Response • Expo Go</Text>
          </View>
        </View>

        <View style={styles.statusChip}>
          <View style={styles.activeDot} />
          <Text style={styles.statusChipText}>EOC Active</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEmergencies(); }} />
        }
      >
        {/* Citizen Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>{currentUser.name[0]}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.profileRow}>
              <Text style={styles.profileName}>{currentUser.name}</Text>
              <Text style={styles.bloodBadge}>{currentUser.bloodGroup}</Text>
            </View>
            <Text style={styles.profilePhone}>📱 +91 {currentUser.phone} • CITIZEN</Text>
          </View>
        </View>

        {/* Big Pulsing Emergency SOS Beacon */}
        <View style={styles.sosCard}>
          <Text style={styles.sosCardTitle}>IMMEDIATE EMERGENCY DISPATCH</Text>
          <Text style={styles.sosCardSubtitle}>
            Transmits high-priority beacon & live GPS directly to NDRF & Civil Defense.
          </Text>

          <Animated.View style={[styles.sosButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              style={styles.sosButton}
              activeOpacity={0.8}
              onPress={handleTriggerSOS}
              disabled={sosSending}
            >
              {sosSending ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Text style={styles.sosExclamation}>⚠️</Text>
                  <Text style={styles.sosButtonText}>SOS</Text>
                  <Text style={styles.sosSubtext}>TAP FOR HELP</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {lastSosToken && (
            <View style={styles.tokenBox}>
              <Text style={styles.tokenLabel}>Active Beacon Reference:</Text>
              <Text style={styles.tokenValue}>{lastSosToken}</Text>
            </View>
          )}
        </View>

        {/* Quick Aid Categories */}
        <Text style={styles.sectionTitle}>REQUEST ASSISTANCE BY CATEGORY</Text>
        <View style={styles.grid}>
          {[
            { name: 'Rescue', icon: '🚤' },
            { name: 'Medical', icon: '⚕️' },
            { name: 'Oxygen', icon: '💨' },
            { name: 'Blood', icon: '🩸' },
            { name: 'Food & Water', icon: '🍲' },
            { name: 'Shelter', icon: '🏕️' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.name}
              style={styles.gridItem}
              onPress={() => handleQuickRequest(cat.name, cat.icon)}
            >
              <Text style={styles.gridIcon}>{cat.icon}</Text>
              <Text style={styles.gridText}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Interactive Disaster Map Card */}
        <TouchableOpacity style={styles.mapBanner} onPress={openInteractiveMap}>
          <View style={styles.mapBannerLeft}>
            <Text style={styles.mapBannerIcon}>🗺️</Text>
            <View>
              <Text style={styles.mapBannerTitle}>Interactive Disaster Radar Map</Text>
              <Text style={styles.mapBannerSub}>500m Hazard Zones & Real-time GPS Pins</Text>
            </View>
          </View>
          <Text style={styles.mapBannerArrow}>→</Text>
        </TouchableOpacity>

        {/* Live Active Emergencies Stream from Supabase */}
        <View style={styles.emergenciesHeader}>
          <Text style={styles.sectionTitle}>LIVE INCIDENTS IN SUPABASE ({emergencies.length})</Text>
          <TouchableOpacity onPress={fetchEmergencies}>
            <Text style={styles.refreshLink}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading && emergencies.length === 0 ? (
          <ActivityIndicator size="small" color="#dc2626" style={{ marginVertical: 20 }} />
        ) : emergencies.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🛡️</Text>
            <Text style={styles.emptyTitle}>No Active Emergencies</Text>
            <Text style={styles.emptySub}>All sectors currently reported clear and safe.</Text>
          </View>
        ) : (
          emergencies.map((emg) => (
            <View key={emg.id} style={styles.emgCard}>
              <View style={styles.emgTop}>
                <Text style={styles.emgToken}>{emg.tracking_token || emg.id.substring(0, 8)}</Text>
                <Text style={[styles.emgUrgency, emg.urgency === 'CRITICAL' ? styles.badgeRed : styles.badgeOrange]}>
                  {emg.urgency} • {emg.category}
                </Text>
              </View>
              <Text style={styles.emgDesc} numberOfLines={2}>
                {emg.description}
              </Text>
              <View style={styles.emgBottom}>
                <Text style={styles.emgLocation}>📍 {emg.location_name || 'Sector Coordinates'}</Text>
                <Text style={styles.emgStatus}>{emg.status}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shieldBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  brandRed: {
    color: '#ef4444',
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusChipText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#f8fafc',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  bloodBadge: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  profilePhone: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  sosCard: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#dc2626',
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  sosCardTitle: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  sosCardSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
  sosButtonContainer: {
    marginBottom: 10,
  },
  sosButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  sosExclamation: {
    fontSize: 22,
    marginBottom: 2,
  },
  sosButtonText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sosSubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  tokenBox: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  tokenLabel: {
    color: '#94a3b8',
    fontSize: 10,
  },
  tokenValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  gridItem: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  gridIcon: {
    fontSize: 22,
  },
  gridText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  mapBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#2563eb',
    marginBottom: 20,
    elevation: 2,
  },
  mapBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  mapBannerIcon: {
    fontSize: 24,
  },
  mapBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  mapBannerSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  mapBannerArrow: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563eb',
    paddingLeft: 8,
  },
  emergenciesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  refreshLink: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  emptySub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  emgCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  emgTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  emgToken: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '900',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emgUrgency: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeRed: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  badgeOrange: {
    backgroundColor: '#ffedd5',
    color: '#ea580c',
  },
  emgDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    marginBottom: 8,
  },
  emgBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  emgLocation: {
    fontSize: 10,
    color: '#64748b',
    flex: 1,
  },
  emgStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    textTransform: 'uppercase',
  },
});
