import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '@/store/authStore';

/**
 * Layout raíz:
 * 1. Inicializa el store de auth (restaura la sesión cifrada y consulta el rol).
 * 2. Muestra un splash mientras se resuelve el estado inicial.
 * 3. Monta los tres grupos de rutas; cada grupo tiene su propio guard.
 */
export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(driver)" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
