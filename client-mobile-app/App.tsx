import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';

// Live production URL for the client web app
const APP_URL = 'https://beautydoctors.gr/';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Safety timeout: ensure loading overlay hides after max 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Handle hardware Android Back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backAction = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true; // prevent app from exiting
        }
        return false; // let system handle (exit app)
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }
  }, [canGoBack]);

  // Inject flag into browser window so frontend knows it's running in client mobile app
  const injectedJavaScript = `
    (function() {
      window.isClientMobileApp = true;
      try {
        localStorage.setItem('is_client_mobile_app', 'true');
      } catch (e) {}
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>
            Unable to connect to the server. Please check your internet connection.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setHasError(false);
              webViewRef.current?.reload();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: APP_URL }}
          style={styles.webView}
          userAgent="BeautyDoctorMobileApp/1.0.0 (ClientMobileApp; Android/iOS)"
          injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          originWhitelist={['*']}
          mixedContentMode="always"
          javaScriptCanOpenWindowsAutomatically={true}
          allowsInlineMediaPlayback={true}
          scalesPageToFit={true}
          allowsBackForwardNavigationGestures={true}
          pullToRefreshEnabled={true}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={(request) => {
            // Handle tel:, mailto:, and whatsapp: links externally
            if (
              request.url.startsWith('tel:') ||
              request.url.startsWith('mailto:') ||
              request.url.startsWith('whatsapp:')
            ) {
              Linking.openURL(request.url).catch(() => {});
              return false;
            }
            return true;
          }}
          onLoadEnd={() => setIsInitialLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            // Only show connection error screen for main frame network failures
            if (
              nativeEvent.code === -2 || // ERROR_HOST_LOOKUP
              nativeEvent.code === -6 || // ERROR_CONNECT
              nativeEvent.code === -8    // ERROR_TIMEOUT
            ) {
              setHasError(true);
            }
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            if (nativeEvent.statusCode >= 502) {
              setHasError(true);
            }
          }}
        />
      )}

      {isInitialLoading && !hasError && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
