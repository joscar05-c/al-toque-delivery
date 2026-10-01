import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { formatDateTime, formatPrice } from '@/lib/format';
import { fetchClientOrders, type OrderWithRestaurant } from '@/lib/orders';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Order } from '@/types/database.types';

/**
 * Tab "Mis pedidos": historial del cliente (orders donde client_id = auth.uid()).
 * Recarga al enfocar el tab (p. ej. al volver del checkout).
 */
export default function ClientOrdersScreen() {
  const { session } = useAuthStore();

  const [orders, setOrders] = useState<OrderWithRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    (kind: 'loading' | 'refresh') => {
      if (!session) return;
      const setBusy = kind === 'loading' ? setIsLoading : setIsRefreshing;
      setBusy(true);

      fetchClientOrders(session.user.id)
        .then((data) => {
          setOrders(data);
          setError(null);
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : 'Error cargando pedidos');
        })
        .finally(() => setBusy(false));
    },
    [session],
  );

  // Carga inicial + recarga al enfocar el tab.
  useFocusEffect(
    useCallback(() => {
      reload('loading');
    }, [reload]),
  );

  // Realtime: UPDATE en orders del cliente -> actualiza el status en vivo.
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `client_id=eq.${session.user.id}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          // Match por id y reemplazo solo del status (conserva el join).
          setOrders((prev) =>
            prev.map((order) =>
              order.id === updated.id
                ? { ...order, status: updated.status }
                : order,
            ),
          );
        },
      )
      .subscribe();

    // Limpieza del canal al desmontar.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const onRefresh = () => reload('refresh');

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-slate-50 px-8">
        <Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />
        <Text className="text-center text-sm text-slate-500">{error}</Text>
        <Pressable
          onPress={() => reload('loading')}
          className="rounded-xl bg-primary px-6 py-3 active:opacity-80"
        >
          <Text className="font-semibold text-white">Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      className="bg-slate-50"
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#208AEF"
        />
      }
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center gap-3 py-16">
          <Ionicons name="receipt-outline" size={48} color="#94A3B8" />
          <Text className="text-base font-medium text-slate-600">
            Aún no tienes pedidos
          </Text>
          <Text className="text-center text-sm text-slate-400">
            Explora los restaurantes y haz tu primer pedido.
          </Text>
          <Pressable
            onPress={() => router.push('/(client)/(tabs)')}
            className="mt-1 rounded-xl bg-primary px-6 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-white">
              Explorar restaurantes
            </Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            // La pantalla de detalle /(client)/order/[id] se hará después.
            router.push({ pathname: '/(client)/order/[id]', params: { id: item.id } })
          }
          className="mb-3 flex-row items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 active:opacity-80"
        >
          {/* Imagen del restaurante */}
          {item.restaurants?.image_url ? (
            <Image
              source={{ uri: item.restaurants.image_url }}
              style={{ width: 56, height: 56, borderRadius: 12 }}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View className="h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
              <Ionicons name="restaurant-outline" size={24} color="#94A3B8" />
            </View>
          )}

          {/* Datos del pedido */}
          <View className="flex-1 gap-0.5">
            <Text
              className="text-base font-semibold text-slate-900"
              numberOfLines={1}
            >
              {item.restaurants?.name ?? 'Restaurante'}
            </Text>
            <Text className="text-xs text-slate-400">
              {formatDateTime(item.created_at)}
            </Text>
            <Text className="mt-0.5 text-sm font-bold text-primary">
              {formatPrice(item.total)}
            </Text>
          </View>

          <View className="items-end gap-2">
            <OrderStatusBadge status={item.status} />
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </View>
        </Pressable>
      )}
    />
  );
}
