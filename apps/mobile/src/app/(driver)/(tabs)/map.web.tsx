import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { formatPrice } from '@/lib/format';
import { setDriverActiveStatus } from '@/lib/driverLocations';
import { fetchDriverOrders, type DriverOrder } from '@/lib/driverOrders';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useDriverStore } from '@/store/driverStore';

export default function DriverMapWebScreen() {
  const driverId = useAuthStore((state) => state.session?.user.id);
  const isOnline = useDriverStore((state) => state.isOnline);
  const setIsOnline = useDriverStore((state) => state.setIsOnline);
  const driverCoords = useDriverStore((state) => state.coords);

  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!driverId) return;
    setIsLoadingOrders(true);
    try {
      const result = await fetchDriverOrders(driverId);
      setOrders(result.orders);
    } catch (err) {
      console.warn('[DriverMapWeb] Error cargando pedidos:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [driverId]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!driverId) return;

    const channel = supabase
      .channel('driver-map-web-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          void loadOrders();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [driverId, loadOrders]);

  const handleToggleOnline = async (value: boolean) => {
    if (!driverId) return;
    setIsUpdatingStatus(true);
    try {
      setIsOnline(value);
      await setDriverActiveStatus(driverId, value);
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar el estado de conexión.');
      setIsOnline(!value);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenNavigation = (order: DriverOrder) => {
    const isHeadingToClient = order.status === 'picked_up';
    const query = isHeadingToClient
      ? (order.deliveryAddress || 'Bagua Grande, Amazonas')
      : (order.restaurant
          ? `${order.restaurant.name}, ${order.restaurant.address || 'Bagua'}`
          : order.deliveryAddress || 'Bagua Grande, Amazonas');

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`,
      '_blank',
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header de conexión */}
        <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            <View
              className={`h-3.5 w-3.5 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <View>
              <Text className="text-base font-bold text-slate-800">
                {isOnline ? 'Repartidor En Línea' : 'Desconectado'}
              </Text>
              <Text className="text-xs text-slate-500">
                {driverCoords
                  ? `Coords: ${driverCoords.latitude.toFixed(4)}, ${driverCoords.longitude.toFixed(4)}`
                  : 'GPS activo en la app móvil'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            disabled={isUpdatingStatus}
            trackColor={{ false: '#CBD5E1', true: '#10B981' }}
          />
        </View>

        {/* Visualizador de mapa en web */}
        <View className="mb-6 h-64 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 p-6 text-center">
          <Ionicons name="map-outline" size={48} color="#94A3B8" />
          <Text className="mt-2 text-center text-sm font-semibold text-slate-700">
            Vista de mapa interactivo con Google Maps
          </Text>
          <Text className="mt-1 text-center text-xs text-slate-500 max-w-sm">
            El mapa en tiempo real con seguimiento GPS se renderiza de forma nativa en la aplicación Android / iOS.
          </Text>
          {driverCoords && (
            <View className="mt-3 rounded-full bg-blue-50 px-3 py-1">
              <Text className="text-xs font-medium text-primary">
                Última posición GPS: {driverCoords.latitude.toFixed(5)}, {driverCoords.longitude.toFixed(5)}
              </Text>
            </View>
          )}
        </View>

        {/* Lista de pedidos activos */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-base font-bold text-slate-800">
            Pedidos Activos ({orders.length})
          </Text>
          <Pressable
            onPress={loadOrders}
            className="flex-row items-center gap-1 rounded-lg px-2.5 py-1 active:bg-slate-200"
          >
            {isLoadingOrders ? (
              <ActivityIndicator size="small" color="#208AEF" />
            ) : (
              <>
                <Ionicons name="refresh" size={14} color="#64748B" />
                <Text className="text-xs text-slate-600">Actualizar</Text>
              </>
            )}
          </Pressable>
        </View>

        {orders.length === 0 ? (
          <View className="items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-12">
            <Ionicons name="bicycle-outline" size={36} color="#94A3B8" />
            <Text className="mt-2 text-sm font-semibold text-slate-600">
              No tienes pedidos activos en este momento
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <View
              key={order.id}
              className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-bold text-slate-900">
                  Pedido #{order.id.slice(0, 8).toUpperCase()}
                </Text>
                <OrderStatusBadge status={order.status} />
              </View>

              <Text className="text-xs text-slate-500 mb-1">
                Restaurante: <Text className="font-semibold text-slate-700">{order.restaurant?.name || 'Local'}</Text> ({order.restaurant?.address || 'Sin dirección'})
              </Text>
              <Text className="text-xs text-slate-500 mb-3">
                Destino: <Text className="font-semibold text-slate-700">{order.client?.name || 'Cliente'}</Text> - {order.deliveryAddress || 'Dirección no registrada'}
              </Text>

              <View className="flex-row items-center justify-between border-t border-slate-100 pt-3">
                <Text className="text-sm font-bold text-primary">
                  {formatPrice(order.total)}
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleOpenNavigation(order)}
                    className="flex-row items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2"
                  >
                    <Ionicons name="navigate" size={14} color="#ffffff" />
                    <Text className="text-xs font-bold text-white">Navegar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/(driver)/order/[id]',
                        params: { id: order.id },
                      })
                    }
                    className="rounded-xl bg-primary px-3 py-2"
                  >
                    <Text className="text-xs font-bold text-white">Ver Detalle</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
