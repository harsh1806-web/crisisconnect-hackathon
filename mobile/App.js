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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

// Suppress non-fatal development warning banners in Expo Go
LogBox.ignoreAllLogs(true);

// Vite Dev Server on local Wi-Fi host
const APP_URL = 'http://10.110.80.99:5173';

export default function App() {
  const webViewRef = useRef(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    // 1. Request Native System Permissions on Launch
    const requestNativePermissions = async () => {
      try {
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
          pullToRefreshEnabled={false}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'EMERGENCY_SOS' || data.type === 'DISASTER_BROADCAST') {
                Vibration.vibrate([0, 500, 250, 500]);
                Alert.alert(
                  data.title || '🚨 EMERGENCY DISASTER ALERT',
                  data.message || 'Immediate response required in your sector.',
                  [{ text: 'VIEW ALERT' }]
                );
              }
            } catch (e) {}
          }}
        />
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
});
