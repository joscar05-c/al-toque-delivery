import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { formatPrice } from '@/lib/format';
import {
  saveDriverLocation,
  setDriverActiveStatus,
} from '@/lib/driverLocations';
import { fetchDriverOrders, type DriverOrder } from '@/lib/driverOrders';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useDriverStore } from '@/store/driverStore';

// Coordenadas predeterminadas de ciudades operativas (fallback)
const DEFAULT_CENTER = {
  latitude: -5.7567, // Bagua Grande, Amazonas
  longitude: -78.4419,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

// Coordenadas aproximadas para restaurantes de Bagua Grande
const RESTAURANT_LOCATIONS: Record<string, { latitude: number; longitude: number }> = {
  'Brasas y Leñas': { latitude: -5.758, longitude: -78.4435 },
  'Polleria Punta Sal': { latitude: -5.755, longitude: -78.4405 },
  'Chifa Hong Kong': { latitude: -5.7562, longitude: -78.4428 },
  'Pizzería La Nona': { latitude: -5.7575, longitude: -78.4412 },
  'Burger Bros': { latitude: -5.7545, longitude: -78.444 },
};

export default function DriverMapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);

  const driverId = useAuthStore((state) => state.session?.user.id);
  const isOnline = useDriverStore((state) => state.isOnline);
  const setIsOnline = useDriverStore((state) => state.setIsOnline);
  const driverCoords = useDriverStore((state) => state.coords);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(0);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Solicitar permisos de ubicación y obtener posición inicial
  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (granted) {
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        useDriverStore.getState().setCoords({
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
          heading: initial.coords.heading,
          speed: initial.coords.speed,
          accuracy: initial.coords.accuracy,
        });
      }
    } catch (err) {
      console.warn('[DriverMap] Error obteniendo ubicación:', err);
      setHasPermission(false);
    }
  }, []);

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

  // Cargar pedidos asignados
  const loadOrders = useCallback(async () => {
    if (!driverId) return;
    setIsLoadingOrders(true);
    try {
      const result = await fetchDriverOrders(driverId);
      setOrders(result.orders);
      if (selectedOrderIndex >= result.orders.length) {
        setSelectedOrderIndex(0);
      }
    } catch (err) {
      console.warn('[DriverMap] Error cargando pedidos:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [driverId, selectedOrderIndex]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Suscribirse a cambios en tiempo real en pedidos (Supabase Realtime)
  useEffect(() => {
    if (!driverId) return;

    const channel = supabase
      .channel('driver-map-realtime')
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

  // Alternar estado En Línea / Desconectado
  const handleToggleOnline = async (value: boolean) => {
    if (!driverId) return;
    setIsUpdatingStatus(true);
    try {
      setIsOnline(value);
      await setDriverActiveStatus(driverId, value);

      // Si se activa y tenemos coordenadas, actualizar ubicación
      if (value && driverCoords) {
        await saveDriverLocation({
          driverId,
          latitude: driverCoords.latitude,
          longitude: driverCoords.longitude,
          heading: driverCoords.heading,
          speed: driverCoords.speed,
          accuracy: driverCoords.accuracy,
          isActive: true,
        });
      }
    } catch (err) {
      Alert.alert(
        'Error',
        'No se pudo actualizar el estado de conexión. Intente nuevamente.',
      );
      setIsOnline(!value);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Re-centrar el mapa en la ubicación del repartidor
  const centerOnDriver = useCallback(() => {
    if (!mapRef.current) return;
    const target = driverCoords ?? DEFAULT_CENTER;
    mapRef.current.animateToRegion(
      {
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      },
      600,
    );
  }, [driverCoords]);

  // Ajustar cámara para ver al repartidor y todos los puntos de pedidos activos
  const fitAllPoints = useCallback(() => {
    if (!mapRef.current) return;
    const points: { latitude: number; longitude: number }[] = [];

    if (driverCoords) {
      points.push({
        latitude: driverCoords.latitude,
        longitude: driverCoords.longitude,
      });
    }

    orders.forEach((order, idx) => {
      const restName = order.restaurant?.name ?? '';
      const restCoord =
        RESTAURANT_LOCATIONS[restName] ?? {
          latitude: DEFAULT_CENTER.latitude + (idx + 1) * 0.002,
          longitude: DEFAULT_CENTER.longitude + (idx + 1) * 0.002,
        };
      points.push(restCoord);

      // Coordenada destino aproximada (offset visual)
      points.push({
        latitude: restCoord.latitude + 0.003 + idx * 0.001,
        longitude: restCoord.longitude + 0.004 - idx * 0.001,
      });
    });

    if (points.length === 0) {
      centerOnDriver();
      return;
    }

    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 140, right: 60, bottom: 280, left: 60 },
      animated: true,
    });
  }, [driverCoords, orders, centerOnDriver]);

  // Pedido activo seleccionado para el bottom sheet
  const activeOrder = orders[selectedOrderIndex] ?? null;

  // Abrir navegación externa con Google Maps / Waze
  const handleOpenNavigation = (order: DriverOrder) => {
    // Si el pedido está en camino ('picked_up'), navegar al cliente; si no, al restaurante
    const isHeadingToClient = order.status === 'picked_up';
    const destinationQuery = isHeadingToClient
      ? (order.deliveryAddress || 'Bagua Grande, Amazonas')
      : (order.restaurant
          ? `${order.restaurant.name}, ${order.restaurant.address || 'Bagua'}`
          : order.deliveryAddress || 'Bagua Grande, Amazonas');

    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationQuery)}`;
    void Linking.openURL(url);
  };

  // Abrir app de llamadas para cliente o restaurante
  const handleCall = (phone?: string | null) => {
    if (!phone) {
      Alert.alert('Teléfono no disponible', 'No hay número de contacto registrado.');
      return;
    }
    void Linking.openURL(`tel:${phone}`);
  };

  // Ubicación actual del mapa
  const initialRegion = useMemo(() => {
    return {
      latitude: driverCoords?.latitude ?? DEFAULT_CENTER.latitude,
      longitude: driverCoords?.longitude ?? DEFAULT_CENTER.longitude,
      latitudeDelta: DEFAULT_CENTER.latitudeDelta,
      longitudeDelta: DEFAULT_CENTER.longitudeDelta,
    };
  }, [driverCoords]);

  // Si no hay permisos otorgados
  if (hasPermission === false) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <View className="items-center rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <Ionicons name="location-outline" size={32} color="#EF4444" />
          </View>
          <Text className="text-center text-lg font-bold text-slate-800">
            Permiso de Ubicación Necesario
          </Text>
          <Text className="mt-2 text-center text-sm leading-relaxed text-slate-500">
            Para recibir pedidos y transmitir tu posición en tiempo real a los clientes y restaurantes, necesitamos acceso a tu ubicación.
          </Text>
          <Pressable
            onPress={() => void Linking.openSettings()}
            className="mt-6 w-full rounded-2xl bg-primary py-3.5 items-center active:opacity-90"
          >
            <Text className="font-bold text-white">Abrir Configuración</Text>
          </Pressable>
          <Pressable
            onPress={() => void requestLocation()}
            className="mt-3 py-2"
          >
            <Text className="text-sm font-semibold text-primary">Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-100">
      {/* MAPA NATIVO GOOGLE MAPS */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onMapReady={() => setIsMapReady(true)}
      >
        {/* MARCADOR DEL REPARTIDOR (CON DIRECCIÓN Y PULSO) */}
        {driverCoords && (
          <Marker
            coordinate={{
              latitude: driverCoords.latitude,
              longitude: driverCoords.longitude,
            }}
            title="Mi Ubicación"
            description={isOnline ? 'En línea transmitiendo' : 'Desconectado'}
            flat
            rotation={driverCoords.heading ?? 0}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View className="items-center justify-center">
              {/* Anillo de pulso cuando está en línea */}
              {isOnline && (
                <View className="absolute h-14 w-14 rounded-full bg-emerald-500/25 animate-ping" />
              )}
              <View
                className={`h-11 w-11 items-center justify-center rounded-full border-2 border-white shadow-lg ${
                  isOnline ? 'bg-emerald-600' : 'bg-slate-500'
                }`}
              >
                <Ionicons name="bicycle" size={22} color="#ffffff" />
              </View>
              {driverCoords.heading != null && isOnline && (
                <View className="absolute -top-1">
                  <Ionicons name="caret-up" size={14} color="#059669" />
                </View>
              )}
            </View>
          </Marker>
        )}

        {/* MARCADORES DE PEDIDOS ACTIVOS */}
        {orders.map((order, index) => {
          const restName = order.restaurant?.name ?? '';
          const restCoord =
            RESTAURANT_LOCATIONS[restName] ?? {
              latitude: DEFAULT_CENTER.latitude + (index + 1) * 0.002,
              longitude: DEFAULT_CENTER.longitude + (index + 1) * 0.002,
            };

          const clientCoord = {
            latitude: restCoord.latitude + 0.0035 + index * 0.001,
            longitude: restCoord.longitude + 0.004 - index * 0.001,
          };

          const isSelected = selectedOrderIndex === index;

          return (
            <View key={order.id}>
              {/* Marcador Restaurante (Recojo) */}
              <Marker
                coordinate={restCoord}
                title={`Recojo: ${restName}`}
                description={order.restaurant?.address ?? 'Restaurante'}
                onPress={() => setSelectedOrderIndex(index)}
              >
                <View
                  className={`items-center justify-center rounded-2xl border-2 border-white px-2.5 py-1.5 shadow-md ${
                    isSelected ? 'bg-amber-600 scale-105' : 'bg-amber-500'
                  }`}
                >
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="storefront" size={14} color="#ffffff" />
                    <Text className="text-[11px] font-bold text-white" numberOfLines={1}>
                      {restName || 'Restaurante'}
                    </Text>
                  </View>
                </View>
              </Marker>

              {/* Marcador Cliente (Entrega) */}
              <Marker
                coordinate={clientCoord}
                title={`Entrega: ${order.client?.name ?? 'Cliente'}`}
                description={order.deliveryAddress ?? 'Dirección de entrega'}
                onPress={() => setSelectedOrderIndex(index)}
              >
                <View
                  className={`items-center justify-center rounded-2xl border-2 border-white px-2.5 py-1.5 shadow-md ${
                    isSelected ? 'bg-primary scale-105' : 'bg-blue-500'
                  }`}
                >
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="location" size={14} color="#ffffff" />
                    <Text className="text-[11px] font-bold text-white" numberOfLines={1}>
                      Pedido #{order.id.slice(0, 5).toUpperCase()}
                    </Text>
                  </View>
                </View>
              </Marker>
            </View>
          );
        })}
      </MapView>

      {/* PANEL SUPERIOR: ESTADO EN LÍNEA / CONEXIÓN */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) + 8 }}
        className="absolute left-4 right-4 z-10"
      >
        <View className="flex-row items-center justify-between rounded-2xl border border-slate-100/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md">
          <View className="flex-row items-center gap-3">
            <View
              className={`h-3 w-3 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <View>
              <Text className="text-sm font-bold text-slate-800">
                {isOnline ? 'En línea' : 'Desconectado'}
              </Text>
              <Text className="text-[11px] text-slate-500">
                {isOnline
                  ? driverCoords
                    ? `GPS: ±${Math.round(driverCoords.accuracy ?? 10)}m · En vivo`
                    : 'Buscando satélites GPS...'
                  : 'Ubicación pausada'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {orders.length > 0 && (
              <View className="rounded-full bg-blue-50 px-2.5 py-1">
                <Text className="text-xs font-bold text-primary">
                  {orders.length} activo{orders.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              disabled={isUpdatingStatus}
              trackColor={{ false: '#CBD5E1', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* BOTONES FLOTANTES DE ACCIÓN RÁPIDA (DERECHA) */}
      <View
        style={{ top: insets.top + 80 }}
        className="absolute right-4 z-10 gap-3"
      >
        {/* Centrar en mi ubicación */}
        <Pressable
          onPress={centerOnDriver}
          className="h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-md active:bg-slate-50"
        >
          <Ionicons name="navigate" size={20} color="#208AEF" />
        </Pressable>

        {/* Ajustar vista a todos los pedidos */}
        {orders.length > 0 && (
          <Pressable
            onPress={fitAllPoints}
            className="h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-md active:bg-slate-50"
          >
            <Ionicons name="scan-outline" size={20} color="#64748B" />
          </Pressable>
        )}

        {/* Recargar pedidos */}
        <Pressable
          onPress={loadOrders}
          disabled={isLoadingOrders}
          className="h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-md active:bg-slate-50"
        >
          {isLoadingOrders ? (
            <ActivityIndicator size="small" color="#208AEF" />
          ) : (
            <Ionicons name="refresh" size={20} color="#64748B" />
          )}
        </Pressable>
      </View>

      {/* PANEL INFERIOR FLOTANTE: DETALLE DEL PEDIDO ACTIVO / RADAR */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}
        className="absolute bottom-0 left-4 right-4 z-10"
      >
        {activeOrder ? (
          <View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xl">
            {/* Header del pedido y estado */}
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-bold text-slate-900">
                  Pedido #{activeOrder.id.slice(0, 8).toUpperCase()}
                </Text>
                <OrderStatusBadge status={activeOrder.status} />
              </View>
              <Text className="text-base font-extrabold text-primary">
                {formatPrice(activeOrder.total)}
              </Text>
            </View>

            {/* Recojo en Restaurante */}
            <View className="mb-2 flex-row items-start gap-2.5 rounded-xl bg-slate-50 p-2.5">
              <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                <Ionicons name="storefront" size={13} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Recoger en
                </Text>
                <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>
                  {activeOrder.restaurant?.name || 'Restaurante'}
                </Text>
                <Text className="text-xs text-slate-500" numberOfLines={1}>
                  {activeOrder.restaurant?.address || 'Dirección de restaurante'}
                </Text>
              </View>
              {activeOrder.restaurant?.phone && (
                <Pressable
                  onPress={() => handleCall(activeOrder.restaurant?.phone)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 active:bg-slate-100"
                >
                  <Ionicons name="call-outline" size={15} color="#D97706" />
                </Pressable>
              )}
            </View>

            {/* Entrega a Cliente */}
            <View className="mb-3.5 flex-row items-start gap-2.5 rounded-xl bg-slate-50 p-2.5">
              <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                <Ionicons name="location" size={13} color="#208AEF" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Entregar a
                </Text>
                <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>
                  {activeOrder.client?.name || 'Cliente'}
                </Text>
                <Text className="text-xs text-slate-500" numberOfLines={2}>
                  {activeOrder.deliveryAddress || 'Sin dirección registrada'}
                </Text>
              </View>
              {activeOrder.client?.phone && (
                <Pressable
                  onPress={() => handleCall(activeOrder.client?.phone)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 active:bg-slate-100"
                >
                  <Ionicons name="call-outline" size={15} color="#208AEF" />
                </Pressable>
              )}
            </View>

            {/* Paginador de pedidos si hay varios */}
            {orders.length > 1 && (
              <View className="mb-3 flex-row items-center justify-between border-t border-slate-100 pt-2 px-1">
                <Pressable
                  onPress={() =>
                    setSelectedOrderIndex((prev) =>
                      prev > 0 ? prev - 1 : orders.length - 1,
                    )
                  }
                  className="flex-row items-center gap-1 py-1"
                >
                  <Ionicons name="chevron-back" size={14} color="#64748B" />
                  <Text className="text-xs font-semibold text-slate-600">Anterior</Text>
                </Pressable>

                <Text className="text-xs text-slate-400 font-medium">
                  {selectedOrderIndex + 1} de {orders.length} pedidos
                </Text>

                <Pressable
                  onPress={() =>
                    setSelectedOrderIndex((prev) =>
                      prev < orders.length - 1 ? prev + 1 : 0,
                    )
                  }
                  className="flex-row items-center gap-1 py-1"
                >
                  <Text className="text-xs font-semibold text-slate-600">Siguiente</Text>
                  <Ionicons name="chevron-forward" size={14} color="#64748B" />
                </Pressable>
              </View>
            )}

            {/* Botones de acción principales */}
            <View className="flex-row gap-2.5">
              <Pressable
                onPress={() => handleOpenNavigation(activeOrder)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 active:bg-emerald-700 shadow-sm"
              >
                <Ionicons name="navigate" size={17} color="#ffffff" />
                <Text className="font-bold text-white text-sm">
                  {activeOrder.status === 'picked_up' ? 'Navegar a Cliente' : 'Navegar al Local'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(driver)/order/[id]',
                    params: { id: activeOrder.id },
                  })
                }
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 active:opacity-90 shadow-sm"
              >
                <Ionicons name="document-text-outline" size={17} color="#ffffff" />
                <Text className="font-bold text-white text-sm">Gestionar Pedido</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl">
            <View className="flex-row items-center gap-3.5">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                <Ionicons name="bicycle" size={24} color="#208AEF" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-800">
                  {isOnline
                    ? 'Esperando asignación de pedidos'
                    : 'Estás en modo desconectado'}
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  {isOnline
                    ? 'Tu ubicación en vivo está activa para recibir pedidos de tus restaurantes.'
                    : 'Activa el switch superior para empezar a recibir pedidos.'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
