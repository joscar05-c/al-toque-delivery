import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import {
  claimDriverOrder,
  fetchDriverOrders,
  type DriverOrder,
} from '@/lib/driverOrders';
import { supabase } from '@/lib/supabase';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { useAuthStore } from '@/store/authStore';
import type { DriverTypeCode } from '@delivery/shared';

/** Pedidos asignados o disponibles para el repartidor según su modalidad (platform o restaurant_own). */
export default function AvailableOrdersScreen() {
  const session = useAuthStore((state) => state.session);
  const driverId = session?.user.id;
  const unreadNotifications = useUnreadNotificationsCount(driverId);

  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [isAssigned, setIsAssigned] = useState(true);
  const [driverType, setDriverType] = useState<DriverTypeCode>('platform');
  const [linkedCount, setLinkedCount] = useState(0);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (silent = false) => {
      if (!driverId) return;
      try {
        const result = await fetchDriverOrders(driverId);
        setIsAssigned(result.assigned);
        setDriverType(result.driverType);
        setLinkedCount(result.linkedRestaurantsCount);
        setOrders(result.orders);
        setError(null);
      } catch (e: unknown) {
        if (!silent) {
          setError(e instanceof Error ? e.message : 'Error cargando pedidos');
        }
      }
    },
    [driverId],
  );

  // Carga inicial + suscripción Realtime a cambios de pedidos
  useEffect(() => {
    let cancelled = false;
    if (!driverId) return;

    void fetchDriverOrders(driverId)
      .then((result) => {
        if (cancelled) return;
        setIsAssigned(result.assigned);
        setDriverType(result.driverType);
        setLinkedCount(result.linkedRestaurantsCount);
        setOrders(result.orders);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error cargando pedidos');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    const channel = supabase
      .channel(`driver-orders-${driverId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          void loadOrders(true);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [driverId, loadOrders]);

  const onRefresh = () => {
    if (!driverId) return;
    setIsRefreshing(true);
    void loadOrders(false).finally(() => setIsRefreshing(false));
  };

  const handleQuickClaim = async (orderId: string) => {
    setClaimingId(orderId);
    try {
      await claimDriverOrder(orderId);
      await loadOrders(true);
    } catch (e: unknown) {
      Alert.alert(
        'No se pudo tomar el pedido',
        e instanceof Error ? e.message : 'Otro repartidor ya pudo haberlo tomado.',
      );
    } finally {
      setClaimingId(null);
    }
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
      <View className="border-b border-slate-200 bg-white px-4 py-3 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-slate-900">Entregas</Text>
          <Text className="text-xs text-slate-500">
            {driverType === 'restaurant_own'
              ? `Flota Propia · ${linkedCount} restaurante${linkedCount === 1 ? '' : 's'}`
              : 'Red Al Toque (Plataforma)'}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View
            className={`rounded-full px-3 py-1 ${
              driverType === 'restaurant_own' ? 'bg-amber-100' : 'bg-blue-100'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                driverType === 'restaurant_own' ? 'text-amber-800' : 'text-blue-800'
              }`}
            >
              {driverType === 'restaurant_own' ? '🛵 Flota Propia' : '⚡ Al Toque'}
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/(driver)/notifications')}
            className="relative h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:opacity-75"
          >
            <Ionicons name="notifications-outline" size={19} color="#334155" />
            {unreadNotifications > 0 && (
              <View className="absolute -right-1 -top-1 min-w-[18px] items-center justify-center rounded-full bg-primary px-1 py-0.5">
                <Text className="text-[10px] font-extrabold text-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

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
          <View className="flex-1 items-center justify-center gap-3 py-16 px-6">
            <Ionicons
              name={isAssigned ? 'receipt-outline' : 'storefront-outline'}
              size={48}
              color="#94A3B8"
            />
            <Text className="text-center text-base font-medium text-slate-600">
              {isAssigned
                ? 'No hay pedidos activos en este momento'
                : driverType === 'restaurant_own'
                  ? 'Aún no estás vinculado a ningún restaurante'
                  : 'Sin locales habilitados disponibles'}
            </Text>
            {!isAssigned && driverType === 'restaurant_own' && (
              <Text className="text-center text-xs text-slate-400">
                Pide al restaurante que te vincule desde Configuración → Flota Propia usando tu teléfono o correo.
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isMine = item.driver_id === driverId;
          const isClaimingThis = claimingId === item.id;
          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(driver)/order/[id]',
                  params: { id: item.id },
                })
              }
              className="mb-3 rounded-2xl border border-slate-100 bg-white p-4 active:opacity-80"
            >
              <View className="mb-2 flex-row items-center justify-between gap-2">
                <Text className="text-base font-bold text-slate-900">
                  Pedido #{item.id.slice(0, 8).toUpperCase()}
                </Text>
                <OrderStatusBadge status={item.status} />
              </View>

              <View className="mb-2 flex-row items-center justify-between gap-2">
                <Text className="text-xs font-semibold text-primary" numberOfLines={1}>
                  {item.restaurant?.name ?? 'Restaurante'}
                </Text>
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    isMine ? 'bg-emerald-100' : 'bg-amber-100'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      isMine ? 'text-emerald-800' : 'text-amber-800'
                    }`}
                  >
                    {isMine ? 'Asignado a ti' : 'Disponible'}
                  </Text>
                </View>
              </View>

              <View className="mb-2 flex-row items-center gap-2">
                <Ionicons name="person-outline" size={16} color="#64748B" />
                <Text className="flex-1 text-sm text-slate-700" numberOfLines={1}>
                  {item.client?.name ?? 'Cliente'}
                </Text>
                <Text className="text-sm font-bold text-slate-900">
                  S/ {Number(item.total).toFixed(2)}
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

              {!item.driver_id && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    void handleQuickClaim(item.id);
                  }}
                  disabled={isClaimingThis}
                  className="mt-3 items-center rounded-xl bg-primary py-2.5 active:opacity-80 disabled:opacity-50"
                >
                  {isClaimingThis ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-xs font-bold text-white">
                      Tomar este Pedido
                    </Text>
                  )}
                </Pressable>
              )}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
