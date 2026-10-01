import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchUserAddresses } from '@/lib/addresses';
import { useAuthStore } from '@/store/authStore';
import { useCheckoutStore } from '@/store/checkoutStore';
import type { Address, Enums } from '@/types/database.types';

type AddressType = Enums<'addresses_type_enum'>;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_ICONS: Record<AddressType, IconName> = {
  home: 'home',
  work: 'briefcase',
  other: 'location',
};

const TYPE_LABELS: Record<AddressType, string> = {
  home: 'Casa',
  work: 'Trabajo',
  other: 'Otro',
};

/**
 * Selector de dirección de entrega:
 * GET addresses (user_id = auth.uid()) -> tap guarda en checkoutStore y regresa.
 */
export default function AddressesScreen() {
  const { session } = useAuthStore();
  const selectedAddress = useCheckoutStore((state) => state.selectedAddress);
  const setAddress = useCheckoutStore((state) => state.setAddress);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recarga al volver del formulario de nueva dirección.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!session) return;

      fetchUserAddresses(session.user.id)
        .then((data) => {
          if (cancelled) return;
          setAddresses(data);
          setError(null);
        })
        .catch((e: unknown) => {
          if (!cancelled)
            setError(e instanceof Error ? e.message : 'Error cargando');
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [session]),
  );

  const onSelect = (address: Address) => {
    setAddress(address);
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      {/* Cabecera */}
      <View className="flex-row items-center gap-3 bg-white px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Mis direcciones</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-slate-500">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-2 py-16">
              <Ionicons name="location-outline" size={40} color="#94A3B8" />
              <Text className="text-base font-medium text-slate-600">
                Aún no tienes direcciones
              </Text>
              <Text className="text-center text-sm text-slate-400">
                Agrega una para recibir tus pedidos.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedAddress?.id === item.id;
            return (
              <Pressable
                onPress={() => onSelect(item)}
                className={`mb-3 flex-row items-center gap-3 rounded-2xl border bg-white p-4 active:opacity-80 ${
                  isSelected ? 'border-primary' : 'border-slate-100'
                }`}
              >
                <View
                  className={`h-11 w-11 items-center justify-center rounded-full ${
                    isSelected ? 'bg-primary/10' : 'bg-slate-100'
                  }`}
                >
                  <Ionicons
                    name={TYPE_ICONS[item.type]}
                    size={20}
                    color={isSelected ? '#208AEF' : '#64748B'}
                  />
                </View>

                <View className="flex-1 gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-semibold text-slate-500">
                      {TYPE_LABELS[item.type]}
                    </Text>
                    {item.is_default && (
                      <View className="rounded-full bg-primary/10 px-2 py-0.5">
                        <Text className="text-[10px] font-semibold text-primary">
                          Predeterminada
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
                    {item.street}
                  </Text>
                  <Text className="text-sm text-slate-500" numberOfLines={1}>
                    {item.city}
                    {item.reference ? ` · ${item.reference}` : ''}
                  </Text>
                </View>

                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={isSelected ? '#208AEF' : '#CBD5E1'}
                />
              </Pressable>
            );
          }}
        />
      )}

      {/* Agregar nueva dirección */}
      <View className="bg-white p-4">
        <Pressable
          onPress={() => router.push('/(client)/new-address')}
          className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 py-4 active:opacity-70"
        >
          <Ionicons name="add" size={20} color="#208AEF" />
          <Text className="text-base font-semibold text-primary">
            Agregar nueva dirección
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
