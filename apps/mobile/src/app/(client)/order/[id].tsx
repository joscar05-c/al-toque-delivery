import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { DriverTrackingMap } from '@/components/DriverTrackingMap';
import { formatDateTime, formatPrice } from '@/lib/format';
import {
  fetchOrderDetail,
  type OrderFullDetail,
} from '@/lib/orders';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@delivery/shared';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Timeline de 5 pasos (el enum tiene 'ready'/'cancelled': se manejan aparte).
const STEPS: { key: OrderStatus; label: string; icon: IconName }[] = [
  { key: 'pending', label: 'Pedido recibido', icon: 'receipt-outline' },
  { key: 'accepted', label: 'Aceptado', icon: 'checkmark-circle-outline' },
  { key: 'preparing', label: 'Preparando tu pedido', icon: 'flame-outline' },
  { key: 'picked_up', label: 'Repartidor en camino', icon: 'bicycle-outline' },
  { key: 'delivered', label: 'Entregado', icon: 'home-outline' },
];

// 'ready' pinta igual que 'preparing'; 'cancelled' no usa timeline.
const STEP_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  accepted: 1,
  preparing: 2,
  ready: 2,
  picked_up: 3,
  delivered: 4,
  cancelled: -1,
};

/** Detalle del pedido: timeline en vivo + items + desglose de pago. */
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [detail, setDetail] = useState<OrderFullDetail | null>(null);
  const [driverCoords, setDriverCoords] = useState<{
    driverId: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial: pedido + items + pago.
  useEffect(() => {
    let cancelled = false;
    if (!id) return;

    fetchOrderDetail(id)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Error cargando el pedido');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Realtime GPS: suscribe al repartidor cuando recogió el pedido.
  useEffect(() => {
    const order = detail?.order;
    const driverId = order?.driver_id;
    const isTracking = order?.status === 'picked_up' || order?.status === 'delivered';
    if (!driverId || !isTracking) return;

    let active = true;
    const applyLocation = (row: {
      driver_id?: unknown;
      latitude?: unknown;
      longitude?: unknown;
    }) => {
      if (
        !active ||
        row.driver_id !== driverId ||
        typeof row.latitude !== 'number' ||
        typeof row.longitude !== 'number'
      ) {
        return;
      }
      setDriverCoords({ driverId, latitude: row.latitude, longitude: row.longitude });
    };

    const channel = supabase
      .channel('driver_tracking')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => applyLocation(payload.new),
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => applyLocation(payload.new),
      )
      .subscribe();

    // Ubicación inicial antes del siguiente evento Realtime.
    supabase
      .from('driver_locations')
      .select('driver_id, latitude, longitude')
      .eq('driver_id', driverId)
      .eq('isActive', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.warn('[order-tracking] No se pudo cargar GPS:', error.message);
          return;
        }
        if (data) applyLocation(data);
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [detail?.order]);

  // Realtime: UPDATE de este pedido -> el timeline avanza solo.
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`order_detail_${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          const updated = payload.new as Order;
          setDetail((prev) =>
            prev && prev.order.id === updated.id
              ? { ...prev, order: { ...prev.order, status: updated.status } }
              : prev,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (!id) {
    return <Redirect href="/(client)/(tabs)/orders" />;
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#208AEF" />
      </SafeAreaView>
    );
  }

  if (error || !detail) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-white px-8">
        <Ionicons name="alert-circle-outline" size={40} color="#94A3B8" />
        <Text className="text-center text-sm text-slate-500">
          {error ?? 'No se encontr├│ el pedido.'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="rounded-xl bg-primary px-6 py-3 active:opacity-80"
        >
          <Text className="font-semibold text-white">Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { order, items, payment } = detail;
  const currentIndex = STEP_INDEX[order.status];
  const isCancelled = order.status === 'cancelled';

  // Fallback si no hay fila de pago: derivar del pedido.
  const subtotal =
    payment?.subtotal ??
    items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
  const deliveryFee = payment?.delivery_fee ?? 0;
  const total = payment?.amount ?? order.total;

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
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">
            Pedido #{id.slice(0, 8).toUpperCase()}
          </Text>
          <Text className="text-xs text-slate-500">
            {formatDateTime(order.created_at)}
          </Text>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Mapa en vivo desde picked_up hasta entregado. */}
        {(order.status === 'picked_up' || order.status === 'delivered') &&
          order.driver_id && (
            <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {driverCoords?.driverId === order.driver_id ? (
                <DriverTrackingMap
                  latitude={driverCoords.latitude}
                  longitude={driverCoords.longitude}
                />
              ) : (
                <View className="h-[250px] items-center justify-center gap-2 bg-slate-100">
                  <ActivityIndicator size="large" color="#208AEF" />
                  <Text className="text-sm text-slate-500">
                    Buscando al repartidor…
                  </Text>
                </View>
              )}
            </View>
          )}

        {/* Parte 1: Timeline (o banner de cancelado) */}
        {isCancelled ? (
          <View className="flex-row items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <Ionicons name="close-circle" size={28} color="#DC2626" />
            <View className="flex-1">
              <Text className="font-bold text-red-700">Pedido cancelado</Text>
              <Text className="text-sm text-red-500">
                Este pedido fue cancelado y no seguir├í avanzando.
              </Text>
            </View>
          </View>
        ) : (
          <View className="rounded-2xl border border-slate-200 bg-white p-4">
            {STEPS.map((step, index) => {
              const isDone = currentIndex >= index;
              const isLast = index === STEPS.length - 1;
              return (
                <View key={step.key} className="flex-row">
                  {/* Riel: c├¡rculo + conector */}
                  <View className="items-center">
                    <View
                      className={`h-9 w-9 items-center justify-center rounded-full ${
                        isDone ? 'bg-primary' : 'bg-slate-200'
                      }`}
                    >
                      <Ionicons
                        name={step.icon}
                        size={18}
                        color={isDone ? '#fff' : '#94A3B8'}
                      />
                    </View>
                    {!isLast && (
                      <View
                        className={`w-0.5 flex-1 ${
                          currentIndex > index ? 'bg-primary' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </View>
                  <View className={`ml-3 flex-1 pt-2 ${isLast ? '' : 'pb-6'}`}>
                    <Text
                      className={`text-sm font-semibold ${
                        isDone ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {order.status === 'delivered' && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(client)/order/review/[order_id]',
                params: { order_id: order.id },
              })
            }
            className="flex-row items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 active:opacity-80"
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-amber-100">
              <Ionicons name="star" size={21} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-amber-900">
                ¿Cómo fue tu experiencia?
              </Text>
              <Text className="mt-0.5 text-sm text-amber-700">
                Toca para calificar este pedido.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#B45309" />
          </Pressable>
        )}

        {/* Restaurante */}
        <View className="gap-1.5 rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-base font-bold text-slate-900">
            {order.restaurants?.name ?? 'Restaurante'}
          </Text>
          {order.restaurants?.address && (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="location-outline" size={14} color="#64748B" />
              <Text className="flex-1 text-sm text-slate-500" numberOfLines={1}>
                {order.restaurants.address}
              </Text>
            </View>
          )}
          {order.restaurants?.phone && (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="call-outline" size={14} color="#64748B" />
              <Text className="text-sm text-slate-500">
                {order.restaurants.phone}
              </Text>
            </View>
          )}
        </View>

        {/* Parte 2: Items */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-700">
            Tu pedido ({items.length} {items.length === 1 ? 'plato' : 'platos'})
          </Text>
          <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            {items.map((item) => (
              <View key={item.id} className="flex-row items-center gap-3">
                {item.menu_items?.image_url ? (
                  <Image
                    source={{ uri: item.menu_items.image_url }}
                    style={{ width: 44, height: 44, borderRadius: 10 }}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                    <Ionicons name="fast-food-outline" size={20} color="#94A3B8" />
                  </View>
                )}
                <Text className="w-8 text-sm font-bold text-primary">
                  {item.quantity}x
                </Text>
                <Text
                  className="flex-1 text-sm text-slate-700"
                  numberOfLines={2}
                >
                  {item.menu_items?.name ?? 'Plato'}
                </Text>
                <Text className="text-sm font-medium text-slate-900">
                  {formatPrice(item.unit_price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Desglose de pago */}
        <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          {payment && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-500">M├®todo de pago</Text>
              <Text className="text-sm font-medium uppercase text-slate-900">
                {payment.payment_method_code}
              </Text>
            </View>
          )}
          <View className="flex-row justify-between">
            <Text className="text-sm text-slate-500">Subtotal</Text>
            <Text className="text-sm font-medium text-slate-900">
              {formatPrice(subtotal)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-slate-500">Delivery</Text>
            <Text className="text-sm font-medium text-slate-900">
              {deliveryFee === 0 ? 'Gratis' : formatPrice(deliveryFee)}
            </Text>
          </View>
          <View className="h-px bg-slate-100" />
          <View className="flex-row justify-between">
            <Text className="text-base font-bold text-slate-900">Total</Text>
            <Text className="text-base font-bold text-primary">
              {formatPrice(total)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
