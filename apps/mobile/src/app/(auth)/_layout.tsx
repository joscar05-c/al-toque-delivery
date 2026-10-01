import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

/**
 * Guard del stack de autenticación: si ya hay sesión activa,
 * el usuario no debe estar aquí y se le redirige a su sección.
 */
export default function AuthLayout() {
  const { session, role } = useAuthStore();

  if (session && role === 'client') {
    return <Redirect href="/(client)/(tabs)" />;
  }
  if (session && role === 'driver') {
    return <Redirect href="/(driver)/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
