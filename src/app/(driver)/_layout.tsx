import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

/**
 * Guard de la sección de repartidor: solo usuarios autenticados
 * cuyo rol en public.users sea 'driver'.
 * Misma estructura que (client): Stack con tabs + futuras pantallas de detalle.
 */
export default function DriverLayout() {
  const { session, role } = useAuthStore();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }
  if (role !== 'driver') {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="order/[id]" />
    </Stack>
  );
}
