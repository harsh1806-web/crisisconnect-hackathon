import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  BackHandler,
  Platform,
  Alert,
  Vibration,
  LogBox,
  StatusBar as RNStatusBar,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { WebView } from 'react-native-webview';

// Configure system notification presentation for Android & iOS (safely for Expo Go)
try {
  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  console.warn('Notification setup note:', e);
}

// Suppress non-fatal development warning banners in Expo Go
LogBox.ignoreAllLogs(true);

// Vite Dev Server on local Wi-Fi host
const APP_URL = 'http://10.110.80.99:5173';

export default function App() {
  const webViewRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // 1. Request Native System Permissions on Launch
    const requestNativePermissions = async () => {
      try {
        // Native Notification Permission & High-Priority Android Channel
        try {
          await Notifications.requestPermissionsAsync();
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('emergency-disaster-alerts', {
              name: 'Emergency Disaster Alerts',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 500, 250, 500],
              lightColor: '#FF0000',
              lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
              sound: 'default',
            });
          }
        } catch (notifErr) {
          console.warn('Native notification setup note:', notifErr);
        }

        // Native Location Dialog
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus !== 'granted') {
          Alert.alert(
            'GPS Permission Required',
            'CrisisConnect requires Location permission to display your live coordinates on the disaster map and coordinate rescues.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Check if Android device location toggle is enabled
        const hasServices = await Location.hasServicesEnabledAsync();
        if (!hasServices && Platform.OS === 'android') {
          try {
            await Location.enableNetworkProviderAsync();
          } catch (e) {
            Alert.alert(
              'Location Services Disabled',
              'Please turn ON Location / GPS in your phone settings so CrisisConnect can pinpoint your position.',
              [{ text: 'OK' }]
            );
          }
        }

        const injectGpsToWeb = (lat, lng) => {
          if (webViewRef.current) {
            const script = `
              window.__NATIVE_GPS__ = { lat: ${lat}, lng: ${lng} };
              if (typeof window.onNativeGpsUpdate === 'function') {
                window.onNativeGpsUpdate(${lat}, ${lng});
              }
              if (navigator && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition = function(success) {
                  success({
                    coords: {
                      latitude: ${lat},
                      longitude: ${lng},
                      accuracy: 15,
                    },
                    timestamp: Date.now()
                  });
                };
              }
              true;
            `;
            webViewRef.current.injectJavaScript(script);
          }
        };

        // Instant cached position fallback
        try {
          const lastLoc = await Location.getLastKnownPositionAsync();
          if (lastLoc) {
            setCoords({ lat: lastLoc.coords.latitude, lng: lastLoc.coords.longitude });
            injectGpsToWeb(lastLoc.coords.latitude, lastLoc.coords.longitude);
          }
        } catch (e) {}

        // High/Balanced accuracy position lock
        let currentLoc = null;
        try {
          currentLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch (e) {
          try {
            currentLoc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Lowest,
            });
          } catch (e2) {}
        }

        if (currentLoc) {
          setCoords({
            lat: currentLoc.coords.latitude,
            lng: currentLoc.coords.longitude,
          });
          injectGpsToWeb(currentLoc.coords.latitude, currentLoc.coords.longitude);
        }

        // Continuously track location updates as device moves
        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 10,
          },
          (newLoc) => {
            setCoords({
              lat: newLoc.coords.latitude,
              lng: newLoc.coords.longitude,
            });
            injectGpsToWeb(newLoc.coords.latitude, newLoc.coords.longitude);
          }
        );
      } catch (err) {
        console.warn('Native permissions error:', err);
      }
    };

    requestNativePermissions();

    // Android Hardware Back button handling
    if (Platform.OS === 'android') {
      const backAction = () => {
        if (webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );
      return () => backHandler.remove();
    }
  }, []);

  // Injection script to sync native GPS into WebView
  const injectedCode = `
    (function() {
      ${
        coords
          ? `window.__NATIVE_GPS__ = { lat: ${coords.lat}, lng: ${coords.lng} };`
          : ''
      }
      true;
    })();
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.webWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri: APP_URL }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          databaseEnabled={true}
          cacheEnabled={true}
          cacheMode="LOAD_DEFAULT"
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          incognito={false}
          saveFormDataDisabled={false}
          geolocationEnabled={true}
          injectedJavaScript={injectedCode}
          scalesPageToFit={false}
          contentMode="mobile"
          scrollEnabled={true}
          nestedScrollEnabled={true}
          overScrollMode="always"
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          allowsBackForwardNavigationGestures={true}
          pullToRefreshEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ef4444" />
              <Text style={styles.loadingText}>Connecting to CrisisConnect Network...</Text>
              <Text style={styles.loadingSubtext}>{APP_URL}</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            console.warn('WebView error:', syntheticEvent.nativeEvent);
            setHasError(true);
          }}
          onHttpError={(syntheticEvent) => {
            console.warn('WebView HTTP error:', syntheticEvent.nativeEvent.statusCode);
            if (syntheticEvent.nativeEvent.statusCode >= 400) setHasError(true);
          }}
          onLoadEnd={() => setHasError(false)}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (
                data.type === 'EMERGENCY_SOS' ||
                data.type === 'DISASTER_BROADCAST' ||
                data.type === 'AUTHORITY_DISPATCH'
              ) {
                Vibration.vibrate([0, 500, 250, 500]);

                // Native Heads-Up Banner / Lockscreen Notification Pop-up
                try {
                  if (Notifications && typeof Notifications.scheduleNotificationAsync === 'function') {
                    Notifications.scheduleNotificationAsync({
                      content: {
                        title: data.title || '🚨 EMERGENCY DISASTER ALERT',
                        body: data.message || 'Immediate response required in your sector.',
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority?.MAX || 'max',
                      },
                      trigger: null,
                    }).catch(() => {});
                  }
                } catch (notifErr) {}

                Alert.alert(
                  data.title || '🚨 EMERGENCY DISASTER ALERT',
                  data.message || 'Immediate response required in your sector.',
                  [{ text: 'Acknowledge', style: 'default' }]
                );
              }
            } catch (e) {}
          }}
        />

        {hasError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorIcon}>🚨</Text>
            <Text style={styles.errorTitle}>Connection Interrupted</Text>
            <Text style={styles.errorSubtitle}>
              Unable to reach the CrisisConnect server at {APP_URL}. Please ensure your phone is connected to the same Wi-Fi network.
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setHasError(false);
                webViewRef.current?.reload();
              }}
            >
              <Text style={styles.retryBtnText}>🔄 Tap to Reload</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0,
  },
  webWrapper: {
    flex: 1,
    backgroundColor: '#020617',
    paddingBottom: Platform.OS === 'ios' ? 24 : 0,
  },
  webView: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 10,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    zIndex: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    shadowColor: '#ef4444',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
