import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { registerDeviceTokenForUser } from '@/lib/notifications';

/**
 * Layout raíz:
 * 1. Inicializa el store de auth (restaura la sesión cifrada y consulta el rol)
 *    y el estado de onboarding desde AsyncStorage.
 * 2. Muestra un splash mientras se resuelve el estado inicial.
 * 3. Monta los grupos de rutas; cada grupo tiene su propio guard.
 */
export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const userId = useAuthStore((state) => state.session?.user.id);

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
