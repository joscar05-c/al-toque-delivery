import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { formatPrice } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type {
  Address,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  User,
} from '@delivery/shared';

type DriverOrderDetail = Order & {
  client: Pick<User, 'name' | 'phone'> | null;
};

type DriverOrderItem = OrderItem & {
  menu_items: Pick<MenuItem, 'name' | 'image_url'> | null;
};

interface DriverOrderData {
  order: DriverOrderDetail;
  items: DriverOrderItem[];
  address: Pick<Address, 'street' | 'city' | 'reference'> | null;
}

/** Pedido detalle, dirección de entrega y acciones del repartidor. */
export default function DriverOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const driverId = useAuthStore((state) => state.session?.user.id);

  const [data, setData] = useState<DriverOrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async (): Promise<DriverOrderData> => {
    if (!id) throw new Error('Pedido inválido');

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*, client:users!FK_505ba3689ef2763acd6c4fc93a4(name, phone)')
      .eq('id', id)
      .single();

    if (orderError) throw orderError;

    const order = orderData as DriverOrderDetail;
    const [itemsResult, addressResult] = await Promise.all([
      supabase
        .from('order_items')
        .select('*, menu_items(name, image_url)')
        .eq('order_id', id)
        .order('created_at', { ascending: true }),
      order.client_id
        ? supabase
            .from('addresses')
            .select('street, city, reference')
            .eq('user_id', order.client_id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (itemsResult.error) throw itemsResult.error;

    return {
      order,
      items: (itemsResult.data ?? []) as DriverOrderItem[],
      // deliveryAddress es la dirección guardada al crear el pedido; addresses es fallback.
      address: addressResult.error ? null : addressResult.data,
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    loadOrder()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Error cargando pedido');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadOrder]);

  const updateStatus = async (status: OrderStatus) => {
    if (!data || !driverId || isUpdating) return;

    setIsUpdating(true);
    try {
      if (data.order.status === 'pending' && status === 'accepted') {
        // Solo puede aceptar pedidos del restaurante que lo tiene asignado.
        const { data: assignment, error: assignmentError } = await supabase
          .from('restaurant_drivers')
          .select('id')
          .eq('driver_id', driverId)
          .eq('restaurant_id', data.order.restaurant_id ?? '')
          .eq('is_active', true)
          .maybeSingle();

        if (assignmentError) throw assignmentError;
        if (!assignment) throw new Error('No estás asignado a este restaurante.');

        const { data: updated, error: updateError } = await supabase
          .from('orders')
          .update({ status: 'accepted', driver_id: driverId })
          .eq('id', data.order.id)
          .eq('status', 'pending')
          .select('id')
          .maybeSingle();

        if (updateError) throw updateError;
        if (!updated) throw new Error('El pedido ya fue actualizado.');
      } else {
        // Recogida/entrega solo para el pedido asignado a este repartidor.
        const { data: updated, error: updateError } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', data.order.id)
          .eq('driver_id', driverId)
          .eq('status', data.order.status)
          .select('id')
          .maybeSingle();

        if (updateError) throw updateError;
        if (!updated) throw new Error('El pedido ya fue actualizado o no está asignado.');
      }

      setData(await loadOrder());
    } catch (e) {
      Alert.alert(
        'No se pudo actualizar',
        e instanceof Error ? e.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (!id) return <Redirect href="/(driver)/(tabs)" />;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#208AEF" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-white px-8">
        <Ionicons name="alert-circle-outline" size={40} color="#94A3B8" />
        <Text className="text-center text-sm text-slate-500">
          {error ?? 'No se encontró el pedido.'}
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

  const { order, items, address } = data;
  const deliveryAddress =
    order.deliveryAddress ??
    [address?.street, address?.city, address?.reference]
      .filter(Boolean)
      .join(', ');

  const action =
    order.status === 'pending'
      ? { label: 'Aceptar Pedido', nextStatus: 'accepted' as const }
      : order.status === 'ready'
        ? { label: 'Recogí el pedido', nextStatus: 'picked_up' as const }
        : order.status === 'picked_up'
          ? { label: 'Entregado al cliente', nextStatus: 'delivered' as const }
          : null;

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
        <Text className="flex-1 text-lg font-bold text-slate-900">
          Pedido #{id.slice(0, 8).toUpperCase()}
        </Text>
        <OrderStatusBadge status={order.status} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Cliente */}
        <View className="gap-2 rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-xs font-semibold uppercase text-slate-400">
            Cliente
          </Text>
          <Text className="text-base font-bold text-slate-900">
            {order.client?.name ?? 'Cliente'}
          </Text>
          {order.client?.phone && (
            <View className="flex-row items-center gap-2">
              <Ionicons name="call-outline" size={16} color="#64748B" />
              <Text className="text-sm text-slate-600">{order.client.phone}</Text>
            </View>
          )}
        </View>

        {/* Dirección / mapa estático */}
        <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-xs font-semibold uppercase text-slate-400">
            Dirección de entrega
          </Text>
          <View className="min-h-28 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-5">
            <Ionicons name="map-outline" size={30} color="#208AEF" />
            <Text className="text-center text-sm font-medium text-slate-700">
              {deliveryAddress || 'Dirección no disponible'}
            </Text>
          </View>
        </View>

        {/* Resumen */}
        <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-base font-bold text-slate-900">
            Resumen del pedido
          </Text>
          {items.map((item) => (
            <View key={item.id} className="flex-row items-center gap-3">
              {item.menu_items?.image_url ? (
                <Image
                  source={{ uri: item.menu_items.image_url }}
                  style={{ width: 44, height: 44, borderRadius: 10 }}
                  contentFit="cover"
                />
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <Ionicons name="fast-food-outline" size={20} color="#94A3B8" />
                </View>
              )}
              <Text className="w-8 text-sm font-bold text-primary">
                {item.quantity}x
              </Text>
              <Text className="flex-1 text-sm text-slate-700" numberOfLines={2}>
                {item.menu_items?.name ?? 'Plato'}
              </Text>
              <Text className="text-sm font-semibold text-slate-900">
                {formatPrice(item.unit_price * item.quantity)}
              </Text>
            </View>
          ))}
          <View className="h-px bg-slate-100" />
          <View className="flex-row justify-between">
            <Text className="text-sm text-slate-500">Total del pedido</Text>
            <Text className="text-base font-bold text-primary">
              {formatPrice(order.total)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Acción disponible según estado actual */}
      {action && (
        <View className="bg-white p-4">
          <Pressable
            onPress={() => updateStatus(action.nextStatus)}
            disabled={isUpdating}
            className={`flex-row items-center justify-center gap-2 rounded-xl py-4 ${
              isUpdating ? 'bg-primary/60' : 'bg-primary active:opacity-80'
            }`}
          >
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-bold text-white">
                {action.label}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
