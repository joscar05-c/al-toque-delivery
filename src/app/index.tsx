import { Redirect } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useAuthStore } from '@/store/authStore';

/**
 * Punto de entrada: decide a qué sección de la app va el usuario
 * según su sesión y su rol (public.users -> roles.name).
 */
export default function Index() {
  const { session, role, profile, signOut } = useAuthStore();

  // Sin sesión -> stack de autenticación (login con teléfono).
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Con sesión -> sección según rol.
  if (role === 'client') {
    return <Redirect href="/(client)" />;
  }
  if (role === 'driver') {
    return <Redirect href="/(driver)" />;
  }

  // La app móvil solo soporta clientes y repartidores.
  // (restaurant_owner / admin se gestionan desde el panel web).
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white px-8">
      <Text className="text-center text-lg font-semibold text-slate-800">
        Rol no soportado
      </Text>
      <Text className="text-center text-sm text-slate-500">
        {profile?.roles?.name
          ? `Tu cuenta tiene el rol "${profile.roles.name}", que no tiene acceso a esta aplicación.`
          : 'No pudimos obtener el rol de tu cuenta. Inténtalo de nuevo.'}
      </Text>
      <Pressable
        onPress={signOut}
        className="mt-2 rounded-xl bg-primary px-6 py-3 active:opacity-80"
      >
        <Text className="font-semibold text-white">Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}
