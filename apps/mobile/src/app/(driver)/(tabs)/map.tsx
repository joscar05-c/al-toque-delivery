import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import {
  startBackgroundDriverTracking,
  stopBackgroundDriverTracking,
} from '@/lib/backgroundLocation';
import { callPhoneNumber } from '@/lib/contact';
import { formatPrice } from '@/lib/format';
import {
  saveDriverLocation,
  setDriverActiveStatus,
} from '@/lib/driverLocations';
import { fetchDriverOrders, type DriverOrder } from '@/lib/driverOrders';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useDriverStore } from '@/store/driverStore';

// Centro operativo por defecto antes de recibir GPS real
const DEFAULT_CENTER = {
  latitude: -5.7567, // Bagua Grande, Amazonas
  longitude: -78.4419,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

interface LatLng {
  latitude: number;
  longitude: number;
}

function getRealOrderCoordinates(order: DriverOrder): {
  restCoord: LatLng | null;
  clientCoord: LatLng | null;
} {
  const restCoord =
    order.restaurant?.latitude != null && order.restaurant?.longitude != null
      ? {
          latitude: order.restaurant.latitude,
          longitude: order.restaurant.longitude,
        }
      : null;

  const clientCoord =
    order.delivery_latitude != null && order.delivery_longitude != null
      ? {
          latitude: order.delivery_latitude,
          longitude: order.delivery_longitude,
        }
      : null;

  return { restCoord, clientCoord };
}

export default function DriverMapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const hasAutoCenteredRef = useRef(false);

  const driverId = useAuthStore((state) => state.session?.user.id);
  const isOnline = useDriverStore((state) => state.isOnline);
  const setIsOnline = useDriverStore((state) => state.setIsOnline);
  const backgroundTrackingActive = useDriverStore(
    (state) => state.backgroundTrackingActive,
  );
  const driverCoords = useDriverStore((state) => state.coords);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(0);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
    let cancelled = false;

    Location.requestForegroundPermissionsAsync()
      .then(async ({ status }) => {
        const granted = status === 'granted';
        if (cancelled) return;
        setHasPermission(granted);
        if (!granted) return;

        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        useDriverStore.getState().setCoords({
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
          heading: initial.coords.heading,
          speed: initial.coords.speed,
          accuracy: initial.coords.accuracy,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('[DriverMap] Error obteniendo ubicación:', err);
          setHasPermission(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Cargar pedidos activos (asignados primero, luego disponibles)
  const loadOrders = useCallback(async () => {
    if (!driverId) return;
    setIsLoadingOrders(true);
    try {
      const result = await fetchDriverOrders(driverId);
      const sorted = [...result.orders].sort((a, b) => {
        const aMine = a.driver_id === driverId ? 0 : 1;
        const bMine = b.driver_id === driverId ? 0 : 1;
        return aMine - bMine;
      });
      setOrders(sorted);
    } catch (err) {
      console.warn('[DriverMap] Error cargando pedidos:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [driverId]);

  useEffect(() => {
    if (!driverId) return;
    let cancelled = false;

    fetchDriverOrders(driverId)
      .then((result) => {
        if (cancelled) return;
        const sorted = [...result.orders].sort((a, b) => {
          const aMine = a.driver_id === driverId ? 0 : 1;
          const bMine = b.driver_id === driverId ? 0 : 1;
          return aMine - bMine;
        });
        setOrders(sorted);
      })
      .catch((err) => {
        if (!cancelled) console.warn('[DriverMap] Error cargando pedidos:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [driverId]);

  // Realtime en pedidos
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

  // Centrar automáticamente al recibir la primera posición GPS real
  useEffect(() => {
    if (hasAutoCenteredRef.current || !driverCoords || !mapRef.current) return;
    hasAutoCenteredRef.current = true;
    mapRef.current.animateToRegion(
      {
        latitude: driverCoords.latitude,
        longitude: driverCoords.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      500,
    );
  }, [driverCoords]);

  const handleToggleOnline = async (value: boolean) => {
    if (!driverId) return;
    setIsUpdatingStatus(true);
    try {
      setIsOnline(value);
      await setDriverActiveStatus(driverId, value);

      if (value) {
        if (driverCoords) {
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
        await startBackgroundDriverTracking(driverId, {
          promptPermission: false,
        });
      } else {
        await stopBackgroundDriverTracking();
      }
    } catch {
      Alert.alert(
        'Error',
        'No se pudo actualizar el estado de conexión. Intente nuevamente.',
      );
      setIsOnline(!value);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleEnableBackgroundGps = async () => {
    if (!driverId) return;
    const ok = await startBackgroundDriverTracking(driverId, {
      promptPermission: true,
    });
    if (!ok) {
      Alert.alert(
        'Permiso de ubicación continua',
        'Para seguir compartiendo tu ruta con la app minimizada, selecciona "Permitir todo el tiempo" en Ajustes.',
        [
          { text: 'Luego', style: 'cancel' },
          { text: 'Abrir Ajustes', onPress: () => void Linking.openSettings() },
        ],
      );
    }
  };

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

  const fitAllPoints = useCallback(() => {
    if (!mapRef.current) return;
    const points: LatLng[] = [];

    if (driverCoords) {
      points.push({
        latitude: driverCoords.latitude,
        longitude: driverCoords.longitude,
      });
    }

    orders.forEach((order) => {
      const { restCoord, clientCoord } = getRealOrderCoordinates(order);
      if (restCoord) points.push(restCoord);
      if (clientCoord) points.push(clientCoord);
    });

    if (points.length === 0) {
      centerOnDriver();
      return;
    }

    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 145, right: 60, bottom: 290, left: 60 },
      animated: true,
    });
  }, [driverCoords, orders, centerOnDriver]);

  const safeSelectedIndex =
    orders.length === 0 ? 0 : Math.min(selectedOrderIndex, orders.length - 1);
  const activeOrder = orders[safeSelectedIndex] ?? null;

  const activeRoutePoints = useMemo(() => {
    if (!activeOrder) return [];
    const { restCoord, clientCoord } = getRealOrderCoordinates(activeOrder);
    const pts: LatLng[] = [];
    if (driverCoords) {
      pts.push({
        latitude: driverCoords.latitude,
        longitude: driverCoords.longitude,
      });
    }
    if (activeOrder.status !== 'picked_up' && restCoord) {
      pts.push(restCoord);
    }
    if (clientCoord) {
      pts.push(clientCoord);
    }
    return pts;
  }, [activeOrder, driverCoords]);

  const handleOpenNavigation = (order: DriverOrder) => {
    const isHeadingToClient = order.status === 'picked_up';
    const destinationQuery = isHeadingToClient
      ? order.delivery_latitude != null && order.delivery_longitude != null
        ? `${order.delivery_latitude},${order.delivery_longitude}`
        : order.deliveryAddress || 'Bagua Grande, Amazonas'
      : order.restaurant?.latitude != null && order.restaurant?.longitude != null
        ? `${order.restaurant.latitude},${order.restaurant.longitude}`
        : order.restaurant
          ? `${order.restaurant.name}, ${order.restaurant.address || 'Bagua'}`
          : order.deliveryAddress || 'Bagua Grande, Amazonas';

    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationQuery)}&travelmode=driving`;
    void Linking.openURL(url);
  };

  const handleCall = (phone?: string | null) => {
    void callPhoneNumber(phone);
  };

  const initialRegion = useMemo(() => {
    return {
      latitude: driverCoords?.latitude ?? DEFAULT_CENTER.latitude,
      longitude: driverCoords?.longitude ?? DEFAULT_CENTER.longitude,
      latitudeDelta: DEFAULT_CENTER.latitudeDelta,
      longitudeDelta: DEFAULT_CENTER.longitudeDelta,
    };
  }, [driverCoords]);

  if (hasPermission === false) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <View className="items-center rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
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
            className="mt-6 w-full items-center rounded-2xl bg-primary py-3.5 active:opacity-90"
          >
            <Text className="font-bold text-white">Abrir Configuración</Text>
          </Pressable>
          <Pressable onPress={() => void requestLocation()} className="mt-3 py-2">
            <Text className="text-sm font-semibold text-primary">Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-100">
      {/* MAPA NATIVO GOOGLE MAPS SDK (mismo PROVIDER_GOOGLE que AddressLocationPicker) */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {activeRoutePoints.length >= 2 && (
          <Polyline
            coordinates={activeRoutePoints}
            strokeColor={
              activeOrder?.status === 'picked_up' ? '#208AEF' : '#F59E0B'
            }
            strokeWidth={4}
          />
        )}

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
              <View
                className={`h-11 w-11 items-center justify-center rounded-full border-2 border-white shadow-lg ${
                  isOnline ? 'bg-emerald-600' : 'bg-slate-500'
                }`}
              >
                <Ionicons name="bicycle" size={22} color="#ffffff" />
              </View>
            </View>
          </Marker>
        )}

        {orders.map((order, index) => {
          const restName = order.restaurant?.name ?? '';
          const { restCoord, clientCoord } = getRealOrderCoordinates(order);
          const isSelected = safeSelectedIndex === index;

          return (
            <View key={order.id}>
              {restCoord && (
                <Marker
                  coordinate={restCoord}
                  title={`Recojo: ${restName}`}
                  description={order.restaurant?.address ?? 'Restaurante'}
                  onPress={() => setSelectedOrderIndex(index)}
                >
                  <View
                    className={`items-center justify-center rounded-2xl border-2 border-white px-2.5 py-1.5 shadow-md ${
                      isSelected ? 'bg-amber-600' : 'bg-amber-500'
                    }`}
                  >
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="storefront" size={14} color="#ffffff" />
                      <Text className="text-[11px] font-bold text-white" numberOfLines={1}>
                        {restName || 'Local'}
                      </Text>
                    </View>
                  </View>
                </Marker>
              )}

              {clientCoord && (
                <Marker
                  coordinate={clientCoord}
                  title={`Entrega: ${order.client?.name ?? 'Cliente'}`}
                  description={order.deliveryAddress ?? 'Dirección de entrega'}
                  onPress={() => setSelectedOrderIndex(index)}
                >
                  <View
                    className={`items-center justify-center rounded-2xl border-2 border-white px-2.5 py-1.5 shadow-md ${
                      isSelected ? 'bg-primary' : 'bg-blue-500'
                    }`}
                  >
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="location" size={14} color="#ffffff" />
                      <Text className="text-[11px] font-bold text-white" numberOfLines={1}>
                        #{order.id.slice(0, 5).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </Marker>
              )}
            </View>
          );
        })}
      </MapView>

      {/* PANEL SUPERIOR: ESTADO + TRACKING SEGUNDO PLANO */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) + 8 }}
        className="absolute left-4 right-4 z-10 gap-2"
      >
        <View className="flex-row items-center justify-between rounded-2xl border border-slate-100/80 bg-white/95 px-4 py-3 shadow-lg">
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
                  ? backgroundTrackingActive
                    ? 'GPS en 2do plano activo'
                    : driverCoords
                      ? `GPS: ±${Math.round(driverCoords.accuracy ?? 10)}m · Primer plano`
                      : 'Buscando GPS...'
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

        {isOnline && !backgroundTrackingActive && (
          <Pressable
            onPress={() => void handleEnableBackgroundGps()}
            className="flex-row items-center justify-between rounded-xl border border-amber-200 bg-amber-50/95 px-3.5 py-2 shadow"
          >
            <Text className="flex-1 text-[11px] font-semibold text-amber-900">
              Activa GPS en 2do plano para transmitir con pantalla bloqueada
            </Text>
            <Text className="ml-2 text-[11px] font-extrabold text-amber-700">
              Activar →
            </Text>
          </Pressable>
        )}
      </View>

      {/* BOTONES FLOTANTES (DERECHA) */}
      <View
        style={{ top: insets.top + 115 }}
        className="absolute right-4 z-10 gap-3"
      >
        <Pressable
          onPress={centerOnDriver}
          className="h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-md active:bg-slate-50"
        >
          <Ionicons name="navigate" size={20} color="#208AEF" />
        </Pressable>

        {orders.length > 0 && (
          <Pressable
            onPress={fitAllPoints}
            className="h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-md active:bg-slate-50"
          >
            <Ionicons name="scan-outline" size={20} color="#64748B" />
          </Pressable>
        )}

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

      {/* PANEL INFERIOR FLOTANTE */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}
        className="absolute bottom-0 left-4 right-4 z-10"
      >
        {activeOrder ? (
          <View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xl">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-bold text-slate-900">
                  Pedido #{activeOrder.id.slice(0, 8).toUpperCase()}
                </Text>
                <OrderStatusBadge status={activeOrder.status} />
                {activeOrder.driver_id === driverId && (
                  <View className="rounded-full bg-emerald-100 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-emerald-800">
                      Tuyo
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-base font-extrabold text-primary">
                {formatPrice(activeOrder.total)}
              </Text>
            </View>

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
                  className="h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white active:bg-slate-100"
                >
                  <Ionicons name="call-outline" size={15} color="#D97706" />
                </Pressable>
              )}
            </View>

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
                  className="h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white active:bg-slate-100"
                >
                  <Ionicons name="call-outline" size={15} color="#208AEF" />
                </Pressable>
              )}
            </View>

            {orders.length > 1 && (
              <View className="mb-3 flex-row items-center justify-between border-t border-slate-100 px-1 pt-2">
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

                <Text className="text-xs font-medium text-slate-400">
                  {safeSelectedIndex + 1} de {orders.length} pedidos
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

            <View className="flex-row gap-2.5">
              <Pressable
                onPress={() => handleOpenNavigation(activeOrder)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 shadow-sm active:bg-emerald-700"
              >
                <Ionicons name="navigate" size={17} color="#ffffff" />
                <Text className="text-sm font-bold text-white">
                  {activeOrder.status === 'picked_up'
                    ? 'Navegar a Cliente'
                    : 'Navegar al Local'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(driver)/order/[id]',
                    params: { id: activeOrder.id },
                  })
                }
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 shadow-sm active:opacity-90"
              >
                <Ionicons name="document-text-outline" size={17} color="#ffffff" />
                <Text className="text-sm font-bold text-white">
                  Gestionar Pedido
                </Text>
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
                    ? 'Esperando pedidos disponibles'
                    : 'Estás en modo desconectado'}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">
                  {isOnline
                    ? 'Tu ubicación en vivo está activa para recibir entregas de tu flota.'
                    : 'Activa el switch superior para empezar a compartir ubicación y recibir pedidos.'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
