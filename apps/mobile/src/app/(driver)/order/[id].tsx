import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriverOrderRouteMap } from '@/components/DriverOrderRouteMap';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import {
  claimDriverOrder,
  completeDriverOrderDelivery,
  fetchDriverOrderById,
  type DriverOrder,
} from '@/lib/driverOrders';
import { callPhoneNumber } from '@/lib/contact';
import { formatPrice } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useDriverStore } from '@/store/driverStore';
import type {
  MenuItem,
  OrderItem,
  OrderStatus,
} from '@delivery/shared';

type DriverOrderItem = OrderItem & {
  menu_items: Pick<MenuItem, 'name' | 'image_url'> | null;
};

interface DriverOrderData {
  order: DriverOrder;
  items: DriverOrderItem[];
}

/** Pedido detalle, dirección de entrega y acciones del repartidor. */
export default function DriverOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const driverId = useAuthStore((state) => state.session?.user.id);
  const driverCoords = useDriverStore((state) => state.coords);

  const [data, setData] = useState<DriverOrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del modal de verificación de código PIN (4 dígitos)
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const loadOrder = useCallback(async (): Promise<DriverOrderData> => {
    if (!id) throw new Error('Pedido inválido');

    const [order, itemsResult] = await Promise.all([
      fetchDriverOrderById(id),
      supabase
        .from('order_items')
        .select('*, menu_items(name, image_url)')
        .eq('order_id', id)
        .order('created_at', { ascending: true }),
    ]);

    if (!order) throw new Error('Pedido no encontrado o ya asignado a otro repartidor.');
    if (itemsResult.error) throw itemsResult.error;

    return {
      order,
      items: (itemsResult.data ?? []) as DriverOrderItem[],
    };
  }, [id]);

  // Carga inicial + suscripción Realtime a cambios del pedido
  useEffect(() => {
    let cancelled = false;
    if (!id) return;

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

    const channel = supabase
      .channel(`driver_order_detail_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        () => {
          void loadOrder()
            .then((result) => {
              if (cancelled) return;
              setData(result);
              setError(null);
            })
            .catch((e: unknown) => {
              if (!cancelled) {
                setError(
                  e instanceof Error
                    ? e.message
                    : 'El pedido ya no está disponible.',
                );
              }
            });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [id, loadOrder]);

  const handleRefresh = () => {
    if (!id || isRefreshing) return;
    setIsRefreshing(true);
    void loadOrder()
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Error recargando pedido');
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  const handleAction = async (actionType: 'claim' | OrderStatus) => {
    if (!data || !driverId || isUpdating) return;

    if (actionType === 'delivered') {
      setPinInput('');
      setPinError(null);
      setShowPinModal(true);
      return;
    }

    setIsUpdating(true);
    try {
      if (actionType === 'claim') {
        await claimDriverOrder(data.order.id);
      } else {
        // Recogida solo para el pedido asignado a este repartidor.
        const { data: updated, error: updateError } = await supabase
          .from('orders')
          .update({ status: actionType, updated_at: new Date().toISOString() })
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

  const handleConfirmPinDelivery = async () => {
    if (!data || !driverId || isUpdating) return;
    const cleanPin = pinInput.replace(/\D/g, '').slice(0, 4);
    if (cleanPin.length !== 4) {
      setPinError('Ingresa los 4 dígitos del código PIN del cliente.');
      return;
    }

    setIsUpdating(true);
    setPinError(null);
    try {
      await completeDriverOrderDelivery(data.order.id, cleanPin);
      setShowPinModal(false);
      setPinInput('');
      setData(await loadOrder());
    } catch (e) {
      setPinError(
        e instanceof Error
          ? e.message
          : 'Código PIN incorrecto. Verifica con el cliente.',
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

  const { order, items } = data;
  const deliveryAddress = order.deliveryAddress ?? '';

  const isUnclaimed =
    !order.driver_id &&
    (order.status === 'pending' ||
      order.status === 'accepted' ||
      order.status === 'preparing' ||
      order.status === 'ready');

  const action: { label: string; actionType: 'claim' | OrderStatus } | null = isUnclaimed
    ? {
      label: 'Tomar este Pedido',
      actionType: 'claim',
    }
    : order.driver_id === driverId && order.status === 'ready'
      ? { label: 'Recogí el pedido', actionType: 'picked_up' }
      : order.driver_id === driverId && order.status === 'picked_up'
        ? { label: 'Entregado al cliente', actionType: 'delivered' }
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

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#208AEF"
          />
        }
      >
        {/* Cliente */}
        <View className="gap-2 rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-xs font-semibold uppercase text-slate-400">
            Cliente
          </Text>
          <Text className="text-base font-bold text-slate-900">
            {order.client?.name ?? 'Cliente'}
          </Text>
          {order.client?.phone && (
            <View className="mt-1 flex-row items-center justify-between gap-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="call-outline" size={16} color="#64748B" />
                <Text className="text-sm text-slate-600">{order.client.phone}</Text>
              </View>
              <Pressable
                onPress={() =>
                  void callPhoneNumber(
                    order.client?.phone,
                    'El cliente no tiene teléfono registrado.',
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Llamar al cliente"
                className="flex-row items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 active:opacity-80"
              >
                <Ionicons name="call" size={14} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">
                  Llamar cliente
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Ruta y Mapa Google Cloud (Mismo SDK que Selector de Dirección del Cliente) */}
        <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-xs font-semibold uppercase text-slate-400">
              Recorrido y Entrega
            </Text>
            {order.restaurant && (
              <Text className="text-xs font-bold text-amber-700" numberOfLines={1}>
                🏪 {order.restaurant.name}
              </Text>
            )}
          </View>

          <DriverOrderRouteMap
            restaurantName={order.restaurant?.name ?? 'Restaurante'}
            restaurantCoords={
              order.restaurant?.latitude != null &&
              order.restaurant?.longitude != null
                ? {
                    latitude: order.restaurant.latitude,
                    longitude: order.restaurant.longitude,
                  }
                : null
            }
            deliveryCoords={
              order.delivery_latitude != null &&
              order.delivery_longitude != null
                ? {
                    latitude: order.delivery_latitude,
                    longitude: order.delivery_longitude,
                  }
                : null
            }
            driverCoords={
              driverCoords
                ? {
                    latitude: driverCoords.latitude,
                    longitude: driverCoords.longitude,
                  }
                : null
            }
            isHeadingToClient={
              order.status === 'picked_up' || order.status === 'delivered'
            }
            fallbackDestinationQuery={
              order.status === 'picked_up' || order.status === 'delivered'
                ? deliveryAddress || 'Bagua Grande, Amazonas'
                : order.restaurant
                  ? `${order.restaurant.name}, ${order.restaurant.address || 'Bagua'}`
                  : deliveryAddress || 'Bagua Grande, Amazonas'
            }
          />

          <View className="gap-1.5 rounded-xl bg-slate-50 p-3">
            {order.restaurant?.address && (
              <Text className="text-xs text-slate-600">
                <Text className="font-bold text-amber-700">Recojo: </Text>
                {order.restaurant.address}
              </Text>
            )}
            <Text className="text-xs text-slate-700">
              <Text className="font-bold text-primary">Entrega: </Text>
              {deliveryAddress || 'Dirección no disponible'}
            </Text>
          </View>

          {order.restaurant?.phone && (
            <View className="flex-row items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="storefront-outline" size={15} color="#B45309" />
                <Text className="text-xs font-medium text-amber-900">
                  {order.restaurant.phone}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  void callPhoneNumber(
                    order.restaurant?.phone,
                    'El restaurante no tiene teléfono registrado.',
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Llamar al restaurante"
                className="flex-row items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 active:opacity-80"
              >
                <Ionicons name="call" size={13} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">
                  Llamar restaurante
                </Text>
              </Pressable>
            </View>
          )}
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
              <View className="flex-1">
                <Text className="text-sm text-slate-700" numberOfLines={2}>
                  {item.menu_items?.name ?? 'Plato'}
                </Text>
                {Array.isArray(item.options) && item.options.length > 0 && (
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {(item.options as { optionName: string }[]).map((o) => o.optionName).join(', ')}
                  </Text>
                )}
              </View>
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
      {action ? (
        <View className="bg-white p-4">
          <Pressable
            onPress={() => handleAction(action.actionType)}
            disabled={isUpdating}
            className={`flex-row items-center justify-center gap-2 rounded-xl py-4 ${isUpdating ? 'bg-primary/60' : 'bg-primary active:opacity-80'
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
      ) : order.driver_id === driverId &&
        (order.status === 'pending' ||
          order.status === 'accepted' ||
          order.status === 'preparing') ? (
        <View className="border-t border-slate-100 bg-white px-4 py-3.5">
          <View className="flex-row items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3">
            <Ionicons name="time-outline" size={18} color="#D97706" />
            <Text className="text-xs font-semibold text-amber-800">
              Esperando que el restaurante marque el pedido como Listo…
            </Text>
          </View>
        </View>
      ) : null}

      {/* Modal para confirmar entrega con código PIN de 4 dígitos */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isUpdating) setShowPinModal(false);
        }}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-white p-6 gap-4 shadow-lg">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={22}
                    color="#208AEF"
                  />
                </View>
                <View>
                  <Text className="text-base font-bold text-slate-900">
                    Confirmar Entrega
                  </Text>
                  <Text className="text-xs text-slate-500">
                    Solicita el código PIN al cliente
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  if (!isUpdating) setShowPinModal(false);
                }}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </Pressable>
            </View>

            <Text className="text-xs leading-4 text-slate-600">
              Ingresa el código de 4 dígitos que aparece en la pantalla del pedido del cliente ({order.client?.name ?? 'Cliente'}).
            </Text>

            <TextInput
              value={pinInput}
              onChangeText={(text) => {
                setPinInput(text.replace(/\D/g, '').slice(0, 4));
                if (pinError) setPinError(null);
              }}
              placeholder="0000"
              placeholderTextColor="#CBD5E1"
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-2xl font-black tracking-[12px] text-slate-900"
            />

            {pinError && (
              <View className="flex-row items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="flex-1 text-xs font-semibold text-red-700">
                  {pinError}
                </Text>
              </View>
            )}

            <View className="flex-row gap-2.5 pt-1">
              <Pressable
                onPress={() => setShowPinModal(false)}
                disabled={isUpdating}
                className="flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white py-3.5 active:bg-slate-50"
              >
                <Text className="text-sm font-bold text-slate-600">
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={() => void handleConfirmPinDelivery()}
                disabled={isUpdating || pinInput.length !== 4}
                className={`flex-1 items-center justify-center rounded-xl py-3.5 ${
                  isUpdating || pinInput.length !== 4
                    ? 'bg-primary/50'
                    : 'bg-primary active:opacity-85'
                }`}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-bold text-white">
                    Confirmar
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
