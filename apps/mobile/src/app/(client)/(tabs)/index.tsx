import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryChip } from '@/components/CategoryChip';
import { RestaurantCard } from '@/components/RestaurantCard';
import {
  fetchActiveRestaurants,
  fetchRestaurantCategories,
  type RestaurantWithCategory,
} from '@/lib/restaurants';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useCheckoutStore } from '@/store/checkoutStore';
import type { Address, RestaurantCategory } from '@delivery/shared';

type CategoryOption = { id: string | null; name: string };

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

/**
 * Home del cliente:
 * - Cabecera con saludo y dirección por defecto (public.addresses).
 * - Carrusel horizontal de categorías que filtra la lista.
 * - Lista vertical de restaurantes activos.
 */
export default function ClientHomeScreen() {
  const { session, profile } = useAuthStore();
  const selectedAddress = useCheckoutStore((state) => state.selectedAddress);

  const [address, setAddress] = useState<Pick<Address, 'street' | 'city'> | null>(null);
  const [categories, setCategories] = useState<RestaurantCategory[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantWithCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = profile?.name.split(' ')[0] ?? 'Cliente';
  // Prioriza la elegida en checkoutStore; si no, la predeterminada de la BD.
  const displayAddress = selectedAddress ?? address;

  // Dirección por defecto del usuario (RLS: solo ve las suyas).
  useEffect(() => {
    if (!session) return;

    supabase
      .from('addresses')
      .select('street, city')
      .eq('user_id', session.user.id)
      .eq('is_default', true)
      .maybeSingle()
      .then(({ data, error: addressError }) => {
        if (addressError) {
          console.error('[home] Error cargando dirección:', addressError.message);
          return;
        }
        setAddress(data);
      });
  }, [session]);

  // Fetch puro (sin setState): los efectos/handlers deciden cómo aplicarlo.
  const loadData = useCallback(async (categoryId?: string) => {
    const [cats, rests] = await Promise.all([
      fetchRestaurantCategories(),
      fetchActiveRestaurants(categoryId),
    ]);
    return { cats, rests };
  }, []);

  // Carga inicial: los setState van dentro de callbacks (regla del compiler).
  useEffect(() => {
    let cancelled = false;

    loadData()
      .then(({ cats, rests }) => {
        if (cancelled) return;
        setCategories(cats);
        setRestaurants(rests);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(errorMessage(e, 'Error cargando los datos'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  // Recarga desde handlers (filtro / pull-to-refresh / reintentar).
  const reload = (categoryId: string | null, kind: 'loading' | 'refresh') => {
    const setBusy = kind === 'loading' ? setIsLoading : setIsRefreshing;
    setBusy(true);
    setError(null);

    loadData(categoryId ?? undefined)
      .then(({ cats, rests }) => {
        setCategories(cats);
        setRestaurants(rests);
      })
      .catch((e: unknown) => {
        setError(errorMessage(e, 'Error cargando los datos'));
      })
      .finally(() => setBusy(false));
  };

  const onSelectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    reload(categoryId, 'loading');
  };

  const onRefresh = () => reload(selectedCategory, 'refresh');
  const onRetry = () => reload(selectedCategory, 'loading');

  const categoryOptions: CategoryOption[] = [
    { id: null, name: 'Todas' },
    ...categories,
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      {/* Cabecera: bienvenida + ubicación */}
      <View className="gap-1 bg-white px-4 pb-4 pt-2">
        <Text className="text-sm text-slate-500">Hola de nuevo,</Text>
        <Text className="text-2xl font-bold text-slate-900">{firstName}</Text>
        <Pressable
          onPress={() => router.push('/(client)/addresses')}
          className="mt-1 flex-row items-center gap-1.5 active:opacity-70"
        >
          <Ionicons name="location" size={16} color="#208AEF" />
          <Text numberOfLines={1} className="flex-1 text-sm text-slate-600">
            {displayAddress
              ? `${displayAddress.street}, ${displayAddress.city}`
              : 'Configura tu dirección de entrega'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
        </Pressable>
      </View>

      {/* Carrusel de categorías */}
      <View className="border-b border-slate-100 bg-white py-3">
        <FlatList
          horizontal
          data={categoryOptions}
          keyExtractor={(item) => item.id ?? 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <CategoryChip
              label={item.name}
              selected={
                item.id === null
                  ? selectedCategory === null
                  : selectedCategory === item.id
              }
              onPress={() => onSelectCategory(item.id ?? null)}
            />
          )}
        />
      </View>

      {/* Lista de restaurantes */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />
          <Text className="text-center text-sm text-slate-500">{error}</Text>
          <Pressable
            onPress={onRetry}
            className="rounded-xl bg-primary px-6 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-white">Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RestaurantCard restaurant={item} />}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 32,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#208AEF"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-2 py-16">
              <Ionicons name="storefront-outline" size={40} color="#94A3B8" />
              <Text className="text-base font-medium text-slate-600">
                No hay restaurantes disponibles
              </Text>
              <Text className="text-center text-sm text-slate-400">
                {selectedCategory
                  ? 'Prueba con otra categoría.'
                  : 'Vuelve a intentarlo más tarde.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
