import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { RoleName } from '@delivery/shared';

interface ProfileData {
  name: string;
  phone: string | null;
  email: string | null;
  roles: { name: RoleName } | null;
}

const ROLE_LABELS: Record<RoleName, string> = {
  client: 'Cliente',
  driver: 'Repartidor',
  restaurant_owner: 'Dueño de restaurante',
  admin: 'Administrador',
};

/** Perfil compartido por cliente y repartidor. */
export function ProfileScreen() {
  const session = useAuthStore((state) => state.session);
  const signOutStore = useAuthStore((state) => state.signOut);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const userId = session?.user.id;
    if (!userId) return;

    supabase
      .from('users')
      .select('name, phone, email, roles(name)')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          Alert.alert('Perfil no disponible', error.message);
          return;
        }
        setProfile(data as ProfileData);
      }, (requestError: unknown) => {
        if (!cancelled) {
          Alert.alert(
            'Perfil no disponible',
            requestError instanceof Error ? requestError.message : 'Inténtalo de nuevo.',
          );
        }
      })
      .then(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  const signOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await signOutStore();
    } catch (error) {
      setIsSigningOut(false);
      Alert.alert(
        'No se pudo cerrar sesión',
        error instanceof Error ? error.message : 'Inténtalo de nuevo.',
      );
    }
    // onAuthStateChanged limpia Zustand y los layouts abren Login.
  };

  const name = profile?.name ?? 'Usuario';
  const role = profile?.roles?.name;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
    >
      <View className="items-center rounded-3xl bg-white px-5 py-7">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <Text className="text-4xl font-bold text-primary">
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="mt-4 text-xl font-bold text-slate-900">{name}</Text>
        {role && (
          <View className="mt-2 rounded-full bg-primary/10 px-4 py-1.5">
            <Text className="text-sm font-semibold text-primary">
              {ROLE_LABELS[role]}
            </Text>
          </View>
        )}
      </View>

      <View className="mt-5 gap-3 rounded-3xl bg-white p-5">
        {isLoading ? (
          <View className="py-6">
            <ActivityIndicator color="#208AEF" />
          </View>
        ) : (
          <>
            <ProfileRow
              icon="person-outline"
              label="Nombre"
              value={profile?.name ?? '—'}
            />
            <ProfileRow
              icon="call-outline"
              label="Teléfono"
              value={profile?.phone ?? 'Sin teléfono'}
            />
            <ProfileRow
              icon="mail-outline"
              label="Correo"
              value={profile?.email ?? 'Sin correo'}
            />
            <ProfileRow
              icon="shield-checkmark-outline"
              label="Rol"
              value={role ? ROLE_LABELS[role] : 'Sin rol'}
              isLast
            />
          </>
        )}
      </View>

      <Pressable
        onPress={signOut}
        disabled={isSigningOut}
        className={`mt-6 flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
          isSigningOut ? 'bg-red-400' : 'bg-red-600 active:opacity-80'
        }`}
      >
        {isSigningOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text className="text-base font-bold text-white">Cerrar Sesión</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

function ProfileRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 pb-3 ${
        isLast ? '' : 'border-b border-slate-100'
      }`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <Ionicons name={icon} size={18} color="#64748B" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-xs text-slate-400">{label}</Text>
        <Text className="text-sm font-semibold text-slate-800">{value}</Text>
      </View>
    </View>
  );
}
