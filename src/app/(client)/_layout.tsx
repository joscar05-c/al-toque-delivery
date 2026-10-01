import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

/**
 * Guard de la sección de cliente: solo usuarios autenticados
 * cuyo rol en public.users sea 'client'.
 * Dentro, un Stack: los tabs abajo y las pantallas de detalle apiladas encima.
 */
export default function ClientLayout() {
  const { session, role } = useAuthStore();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }
  if (role !== 'client') {
    // El index raíz lo enviará a su sección correspondiente.
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="restaurant/[id]" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="new-address" options={{ presentation: 'modal' }} />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="order/[id]" />
    </Stack>
  );
}
