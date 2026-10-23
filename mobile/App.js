/**
 * Единое мобильное приложение Multi-Tenant Barber SaaS (iOS / Android)
 * React Native Expo + WebView Hybrid Container
 *
 * Архитектура:
 * 1. Стартовый экран Role Selection (app.html): «Я Клиент», «Владелец барбершопа», «Я Мастер»
 * 2. Сохранение сессии Владельца / Мастера в AsyncStorage (авто-пропуск экрана 3 кнопок)
 * 3. Обработка Universal Links (iOS), Android App Links и отложенных диплинков (Deferred Deep Linking)
 * 4. Push-уведомления FCM со звуком о новых записях
 */

import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, BackHandler, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';

const BASE_WEB_URL = 'https://b-b6.github.io/b-b6';
const SESSION_STORAGE_KEY = 'barber_saas_active_session_v1';
const DEFERRED_DEEPLINK_KEY = 'barber_saas_deferred_deeplink_v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const webViewRef = useRef(null);
  const [initialUrl, setInitialUrl] = useState(`${BASE_WEB_URL}/app.html`);

  useEffect(() => {
    bootstrapNavigation();

    const sub = Linking.addEventListener('url', ({ url }) => {
      handleIncomingDeepLink(url);
    });

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => {
      sub.remove();
      backSub.remove();
    };
  }, []);

  async function bootstrapNavigation() {
    try {
      // 1. Check if app was launched via Universal Link / App Link (book?id={barbershop_id})
      const launchUrl = await Linking.getInitialURL();
      if (launchUrl) {
        const parsed = Linking.parse(launchUrl);
        const shopId = parsed.queryParams?.id || parsed.queryParams?.shop;
        const solo = parsed.queryParams?.solo === '1';
        if (shopId) {
          setInitialUrl(`${BASE_WEB_URL}/index.html?id=${encodeURIComponent(shopId)}${solo ? '&solo=1' : ''}`);
          return;
        }
      }

      // 2. Check Deferred Deep Link stored before/during install
      const deferredRaw = await AsyncStorage.getItem(DEFERRED_DEEPLINK_KEY);
      if (deferredRaw) {
        await AsyncStorage.removeItem(DEFERRED_DEEPLINK_KEY);
        const deferred = JSON.parse(deferredRaw);
        if (deferred && deferred.tenantId) {
          setInitialUrl(
            `${BASE_WEB_URL}/index.html?id=${encodeURIComponent(deferred.tenantId)}${deferred.solo ? '&solo=1' : ''}`
          );
          return;
        }
      }

      // 3. Check persistent Owner / Master session (skip 3-button screen automatically)
      const sessionRaw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session && session.tenantId && session.role === 'owner') {
          setInitialUrl(`${BASE_WEB_URL}/admin.html?id=${encodeURIComponent(session.tenantId)}`);
          return;
        }
        if (session && session.tenantId && session.role === 'master') {
          setInitialUrl(`${BASE_WEB_URL}/barber.html?id=${encodeURIComponent(session.tenantId)}`);
          return;
        }
      }
    } catch (e) {
      console.warn('Bootstrap error:', e);
    }
  }

  function handleIncomingDeepLink(url) {
    try {
      const parsed = Linking.parse(url);
      const shopId = parsed.queryParams?.id || parsed.queryParams?.shop;
      const solo = parsed.queryParams?.solo === '1';
      if (shopId) {
        setInitialUrl(`${BASE_WEB_URL}/index.html?id=${encodeURIComponent(shopId)}${solo ? '&solo=1' : ''}`);
      }
    } catch (e) {}
  }

  async function onWebViewMessage(event) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'SAVE_SESSION' && msg.payload) {
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(msg.payload));
      } else if (msg.type === 'CLEAR_SESSION') {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      } else if (msg.type === 'REGISTER_PUSH' && msg.tenantId) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          webViewRef.current?.injectJavaScript(`
            window.dispatchEvent(new CustomEvent('nativePushToken', { detail: ${JSON.stringify(tokenData.data)} }));
            true;
          `);
        }
      } else if (msg.type === 'LOCAL_NOTIFICATION') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: msg.title || '✂️ Новая запись!',
            body: msg.body || '',
            sound: 'default',
          },
          trigger: null,
        });
      }
    } catch (e) {}
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06141B" />
      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        onMessage={onWebViewMessage}
        allowsBackForwardNavigationGestures={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06141B',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#06141B',
  },
});
