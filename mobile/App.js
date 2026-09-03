import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  BackHandler,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

// Vite Dev Server on local Wi-Fi host
const APP_URL = 'http://10.110.80.99:5173';

export default function App() {
  const webViewRef = useRef(null);

  useEffect(() => {
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
