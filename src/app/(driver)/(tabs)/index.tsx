import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { fetchDriverOrders, type DriverOrder } from '@/lib/driverOrders';
import { useAuthStore } from '@/store/authStore';

/** Pedidos activos de los restaurantes vinculados a restaurant_drivers. */
export default function AvailableOrdersScreen() {
  const session = useAuthStore((state) => state.session);
  const driverId = session?.user.id;

  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [isAssigned, setIsAssigned] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializa cargando asignaciones activas y su pool de pedidos.
  useEffect(() => {
    let cancelled = false;
    if (!driverId) return;

    fetchDriverOrders(driverId)
      .then((result) => {
        if (cancelled) return;
        setIsAssigned(result.assigned);
        setOrders(result.orders);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Error cargando pedidos');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [driverId]);

  const onRefresh = () => {
    if (!driverId) return;
    setIsRefreshing(true);
    fetchDriverOrders(driverId)
      .then((result) => {
        setIsAssigned(result.assigned);
        setOrders(result.orders);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Error cargando pedidos');
      })
      .finally(() => setIsRefreshing(false));
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#208AEF" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-slate-50 px-8">
        <Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />
        <Text className="text-center text-sm text-slate-500">{error}</Text>
        <Pressable
          onPress={onRefresh}
          className="rounded-xl bg-primary px-6 py-3 active:opacity-80"
        >
          <Text className="font-semibold text-white">Reintentar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
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
            <Ionicons
              name={isAssigned ? 'receipt-outline' : 'storefront-outline'}
              size={48}
              color="#94A3B8"
            />
            <Text className="text-center text-base font-medium text-slate-600">
              {isAssigned
                ? 'No hay pedidos activos'
                : 'Sin restaurante asignado'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(driver)/order/[id]',
                params: { id: item.id },
              })
            }
            className="mb-3 rounded-2xl border border-slate-100 bg-white p-4 active:opacity-80"
          >
            <View className="mb-3 flex-row items-center justify-between gap-2">
              <Text className="text-base font-bold text-slate-900">
                Pedido #{item.id.slice(0, 8).toUpperCase()}
              </Text>
              <OrderStatusBadge status={item.status} />
            </View>

            <View className="mb-2 flex-row items-center gap-2">
              <Ionicons name="person-outline" size={16} color="#64748B" />
              <Text className="flex-1 text-sm text-slate-700" numberOfLines={1}>
                {item.client?.name ?? 'Cliente'}
              </Text>
            </View>

            <View className="flex-row items-start gap-2">
              <Ionicons
                name="location-outline"
                size={16}
                color="#64748B"
                style={{ marginTop: 2 }}
              />
              <Text className="flex-1 text-sm text-slate-500" numberOfLines={2}>
                {item.deliveryAddress ?? 'Dirección no registrada'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
