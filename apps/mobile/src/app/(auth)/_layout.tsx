import { Redirect, Stack, usePathname } from 'expo-router';

import { isProfileIncomplete, useAuthStore } from '@/store/authStore';

/**
 * Guard del stack de autenticación:
 * - Si ya hay sesión activa con perfil completo, redirige a su sección.
 * - Si el perfil está incompleto (nuevo usuario), lo guía a complete-profile.
 */
export default function AuthLayout() {
  const { session, role, profile } = useAuthStore();
  const pathname = usePathname();

  if (session && role === 'client') {
    const incomplete = isProfileIncomplete(profile);
    if (incomplete) {
      if (!pathname.includes('complete-profile')) {
        return <Redirect href="/(auth)/complete-profile" />;
      }
    } else {
      return <Redirect href="/(client)/(tabs)" />;
    }
  }

  if (session && role === 'driver') {
    return <Redirect href="/(driver)/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
