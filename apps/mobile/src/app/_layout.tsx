import '../global.css';
import '@/lib/backgroundLocation';

import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import {
  configurePushNotifications,
  registerDeviceTokenForUser,
} from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

configurePushNotifications();

/**
 * Layout raíz:
 * 1. Inicializa el store de auth (restaura la sesión cifrada y consulta el rol)
 *    y el estado de onboarding desde AsyncStorage.
 * 2. Muestra un splash mientras se resuelve el estado inicial.
 * 3. Monta los grupos de rutas; cada grupo tiene su propio guard.
 * 4. Registra el token FCM y gestiona el deep-linking al tocar una notificación push.
 */
export default function RootLayout() {
  const router = useRouter();
  const initialize = useAuthStore((state) => state.initialize);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const userId = useAuthStore((state) => state.session?.user.id);
  const role = useAuthStore((state) => state.role);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  const initializeOnboarding = useOnboardingStore(
    (state) => state.initializeOnboarding,
  );
  const isOnboardingLoading = useOnboardingStore((state) => state.isLoading);

  useEffect(() => {
    void initializeOnboarding();
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize, initializeOnboarding]);

  // Registra token al restaurar sesión o al iniciar sesión.
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    void registerDeviceTokenForUser(userId).catch((error: unknown) => {
      if (!cancelled) console.warn('[push] No se pudo registrar token:', error);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Navegación automática cuando el usuario toca una notificación push (incluyendo cold-start).
  useEffect(() => {
    if (Platform.OS === 'web' || !userId) return;

    let isMounted = true;
    const handledResponseIds = new Set<string>();

    const handleNotificationResponse = (
      response: Notifications.NotificationResponse | null,
    ) => {
      if (!isMounted || !response) return;

      const responseId = response.notification.request.identifier;
      if (responseId && handledResponseIds.has(responseId)) return;
      if (responseId) handledResponseIds.add(responseId);

      const rawData = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      if (!rawData) return;

      const notificationId =
        typeof rawData.notificationId === 'string'
          ? rawData.notificationId
          : null;
      if (notificationId) {
        void supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId);
      }

      const target =
        typeof rawData.target === 'string' ? rawData.target : null;
      const orderId =
        typeof rawData.orderId === 'string'
          ? rawData.orderId
          : typeof rawData.referenceId === 'string'
            ? rawData.referenceId
            : null;

      if (target === 'driver_home') {
        void refreshProfile().finally(() => {
          router.replace('/(driver)/(tabs)');
        });
        return;
      }

      if (target === 'driver_application') {
        router.push('/(client)/(tabs)/profile');
        return;
      }

      if (orderId) {
        if (target === 'driver_order' || role === 'driver') {
          router.push({
            pathname: '/(driver)/order/[id]',
            params: { id: orderId },
          });
        } else {
          router.push({
            pathname: '/(client)/order/[id]',
            params: { id: orderId },
          });
        }
      }
    };

    void Notifications.getLastNotificationResponseAsync()
      .then((initialResponse) => {
        if (initialResponse) {
          handleNotificationResponse(initialResponse);
        }
      })
      .catch(() => {});

    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [refreshProfile, role, router, userId]);

  if (isAuthLoading || isOnboardingLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F29F30" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(driver)" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
