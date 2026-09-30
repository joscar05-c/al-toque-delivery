import { Pressable, Text, View } from 'react-native';

import { useAuthStore } from '@/store/authStore';

/** Tab del cliente: datos del perfil y cierre de sesión. */
export default function ClientProfileScreen() {
  const { profile, signOut } = useAuthStore();

  return (
    <View className="flex-1 bg-white px-8 pt-10">
      <View className="items-center gap-1">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Text className="text-3xl font-bold text-primary">
            {profile?.name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text className="mt-2 text-xl font-bold text-slate-900">
          {profile?.name ?? 'Cliente'}
        </Text>
        <Text className="text-sm text-slate-500">
          {profile?.phone ?? profile?.email ?? ''}
        </Text>
      </View>

      <Pressable
        onPress={signOut}
        className="mt-10 items-center rounded-xl border border-red-200 bg-red-50 py-4 active:opacity-70"
      >
        <Text className="text-base font-semibold text-red-600">
          Cerrar sesión
        </Text>
      </Pressable>
    </View>
  );
}
