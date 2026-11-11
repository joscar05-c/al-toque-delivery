import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { formatDateTime, formatPrice } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';

type HistoryFilter = 'all' | 'delivered' | 'cancelled';

export default function DriverHistoryScreen() {
  const driverId = useAuthStore((state) => state.session?.user.id);

  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!driverId) return;
    try {
      const result = await fetchDriverOrders(driverId, true);
      setOrders(result.orders);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el historial.');
    }
  }, [driverId]);

  useEffect(() => {
    if (!driverId) return;
    let cancelled = false;

    fetchDriverOrders(driverId, true)
      .then((result) => {
        if (!cancelled) {
          setOrders(result.orders);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : 'No se pudo cargar el historial.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [driverId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  };

  const metrics = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();

    let delivered = 0;
    let deliveredToday = 0;
    let cancelled = 0;
    let totalAmount = 0;

    for (const o of orders) {
      if (o.status === 'delivered') {
        delivered += 1;
        totalAmount += Number(o.total || 0);
        if (new Date(o.updated_at).getTime() >= todayMs) {
          deliveredToday += 1;
        }
      } else if (o.status === 'cancelled') {
        cancelled += 1;
      }
    }

    return { delivered, deliveredToday, cancelled, totalAmount };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">
            Historial de Entregas
          </Text>
          <Text className="text-xs text-slate-500">
            Pedidos completados y cancelados
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#208AEF"
            />
          }
          ListHeaderComponent={
            <View className="gap-3 pb-1">
              {error && (
                <View className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <Text className="text-xs font-medium text-red-700">{error}</Text>
                </View>
              )}

              {/* Resumen numérico */}
              <View className="flex-row gap-2.5">
                <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3.5">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Entregados
                  </Text>
                  <Text className="mt-1 text-xl font-black text-emerald-700">
                    {metrics.delivered}
                  </Text>
                  <Text className="text-[11px] text-slate-500">
                    {metrics.deliveredToday} hoy
                  </Text>
                </View>

                <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3.5">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total entregado
                  </Text>
                  <Text className="mt-1 text-xl font-black text-primary">
                    {formatPrice(metrics.totalAmount)}
                  </Text>
                  <Text className="text-[11px] text-slate-500">
                    {metrics.cancelled} cancelado{metrics.cancelled === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>

              {/* Filtros */}
              <View className="flex-row gap-2">
                {(
                  [
                    { id: 'all', label: `Todos (${orders.length})` },
                    { id: 'delivered', label: `Entregados (${metrics.delivered})` },
                    { id: 'cancelled', label: `Cancelados (${metrics.cancelled})` },
                  ] as const
                ).map((tab) => {
                  const active = filter === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => setFilter(tab.id)}
                      className={`rounded-full px-3.5 py-1.5 ${
                        active
                          ? 'bg-primary'
                          : 'border border-slate-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          active ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="mt-12 items-center gap-2 px-6">
              <Ionicons name="receipt-outline" size={44} color="#94A3B8" />
              <Text className="text-center text-sm font-semibold text-slate-700">
                No hay entregas en esta vista todavía
              </Text>
              <Text className="text-center text-xs text-slate-500">
                Cuando completes o canceles pedidos asignados aparecerán aquí.
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
              className="gap-2 rounded-2xl border border-slate-200 bg-white p-4 active:opacity-85"
            >
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-bold text-slate-900">
                    #{item.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <OrderStatusBadge status={item.status} />
                </View>
                <Text className="text-sm font-extrabold text-slate-900">
                  {formatPrice(item.total)}
                </Text>
              </View>

              {item.restaurant && (
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="storefront-outline" size={14} color="#D97706" />
                  <Text className="flex-1 text-xs font-semibold text-slate-700" numberOfLines={1}>
                    {item.restaurant.name}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center gap-1.5">
                <Ionicons name="location-outline" size={14} color="#64748B" />
                <Text className="flex-1 text-xs text-slate-500" numberOfLines={1}>
                  {item.deliveryAddress || 'Sin dirección'}
                </Text>
              </View>

              <View className="flex-row items-center justify-between border-t border-slate-100 pt-2">
                <Text className="text-[11px] text-slate-400">
                  {formatDateTime(item.updated_at)}
                </Text>
                <View className="flex-row items-center gap-0.5">
                  <Text className="text-xs font-semibold text-primary">Ver detalle</Text>
                  <Ionicons name="chevron-forward" size={14} color="#208AEF" />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
