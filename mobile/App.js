import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  BackHandler,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

// Vite Dev Server running on local Wi-Fi host
const APP_URL = 'http://10.110.80.99:5173';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(APP_URL);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backAction = () => {
        if (canGoBack && webViewRef.current) {
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
  }, [canGoBack]);

  const handleReload = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleGoHome = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.location.href = '${APP_URL}/'; true;`);
    }
  };

  const handleGoMap = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.location.href = '${APP_URL}/map'; true;`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Sleek Native Mobile Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.brandContainer} onPress={handleGoHome}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandIcon}>🛡️</Text>
          </View>
          <View>
            <Text style={styles.brandText}>
              Crisis<Text style={styles.brandHighlight}>Connect</Text>
            </Text>
            <Text style={styles.brandSub}>Full EOC Command Center</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.navButton} onPress={handleGoMap}>
            <Text style={styles.navButtonText}>🗺️ Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
            <Text style={styles.reloadIcon}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Full CrisisConnect Mobile Platform */}
      <View style={styles.webWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri: APP_URL }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          geolocationEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
            setCurrentUrl(navState.url);
          }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#dc2626" />
              <Text style={styles.loadingText}>Connecting to Disaster Response Network...</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    height: 48,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIcon: {
    fontSize: 14,
  },
  brandText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
  brandHighlight: {
    color: '#ef4444',
  },
  brandSub: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  reloadButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  reloadIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  webWrapper: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
});
