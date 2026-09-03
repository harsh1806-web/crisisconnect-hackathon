import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  BackHandler,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

// Set notification handler so notifications pop up even if app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Vite Dev Server on local Wi-Fi host
const APP_URL = 'http://10.110.80.99:5173';

export default function App() {
  const webViewRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState(null);

  useEffect(() => {
    // 1. Request Native System Permissions on Launch
    const requestNativePermissions = async () => {
      try {
        // Native iOS/Android Location Dialog
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const currentLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setCoords({
            lat: currentLoc.coords.latitude,
            lng: currentLoc.coords.longitude,
          });

          // Continuously track location updates
          Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 2000,
              distanceInterval: 5,
            },
            (newLoc) => {
              setCoords({
                lat: newLoc.coords.latitude,
                lng: newLoc.coords.longitude,
              });
              // Inject updated coordinates directly into WebView
              if (webViewRef.current) {
                const script = `
                  window.__NATIVE_GPS__ = { lat: ${newLoc.coords.latitude}, lng: ${newLoc.coords.longitude} };
                  if (typeof window.onNativeGpsUpdate === 'function') {
                    window.onNativeGpsUpdate(${newLoc.coords.latitude}, ${newLoc.coords.longitude});
                  }
                  true;
                `;
                webViewRef.current.injectJavaScript(script);
              }
            }
          );
        } else {
          Alert.alert(
            'Location Access Required',
            'CrisisConnect requires GPS permissions to locate you during emergency rescue operations.',
            [{ text: 'OK' }]
          );
        }

        // Native iOS/Android Notification Permission Dialog
        const { status: notifStatus } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });

        if (notifStatus === 'granted') {
          try {
            const token = await Notifications.getExpoPushTokenAsync();
            setExpoPushToken(token.data);
          } catch (e) {
            console.log('Push token generation error:', e);
          }
        }
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
      ${
        expoPushToken
          ? `window.__NATIVE_PUSH_TOKEN__ = '${expoPushToken}';`
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
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          automaticallyAdjustContentInsets={false}
          allowsBackForwardNavigationGestures={true}
          pullToRefreshEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'EMERGENCY_SOS' || data.type === 'DISASTER_BROADCAST') {
                Notifications.scheduleNotificationAsync({
                  content: {
                    title: data.title || '🚨 EMERGENCY DISASTER ALERT',
                    body: data.message || 'Immediate response required in your sector.',
                    sound: true,
                    vibrate: [0, 500, 250, 500],
                  },
                  trigger: null,
                });
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
  },
  webWrapper: {
    flex: 1,
    backgroundColor: '#020617',
  },
  webView: {
    flex: 1,
    backgroundColor: '#020617',
  },
});
