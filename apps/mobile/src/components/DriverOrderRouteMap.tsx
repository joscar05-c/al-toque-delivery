import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Linking, Pressable, Text, View } from 'react-native';

interface Coord {
  latitude: number;
  longitude: number;
}

interface DriverOrderRouteMapProps {
  restaurantName: string;
  restaurantCoords: Coord | null;
  deliveryCoords: Coord | null;
  driverCoords?: Coord | null;
  isHeadingToClient: boolean;
  fallbackDestinationQuery: string;
}

export function DriverOrderRouteMap({
  restaurantName,
  restaurantCoords,
  deliveryCoords,
  driverCoords,
  isHeadingToClient,
  fallbackDestinationQuery,
}: DriverOrderRouteMapProps) {
  const mapRef = useRef<MapView | null>(null);

  const routePoints = useMemo(() => {
    const pts: Coord[] = [];
    if (driverCoords) pts.push(driverCoords);
    if (!isHeadingToClient && restaurantCoords) pts.push(restaurantCoords);
    if (deliveryCoords) pts.push(deliveryCoords);
    else if (isHeadingToClient && restaurantCoords) pts.push(restaurantCoords);
    return pts;
  }, [driverCoords, isHeadingToClient, restaurantCoords, deliveryCoords]);

  const markerPoints = useMemo(() => {
    const pts: Coord[] = [];
    if (driverCoords) pts.push(driverCoords);
    if (restaurantCoords) pts.push(restaurantCoords);
    if (deliveryCoords) pts.push(deliveryCoords);
    return pts;
  }, [driverCoords, restaurantCoords, deliveryCoords]);

  useEffect(() => {
    if (!mapRef.current || markerPoints.length === 0) return;
    if (markerPoints.length === 1) {
      mapRef.current.animateToRegion(
        {
          ...markerPoints[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        300,
      );
      return;
    }

    mapRef.current.fitToCoordinates(markerPoints, {
      edgePadding: { top: 44, right: 44, bottom: 44, left: 44 },
      animated: true,
    });
  }, [markerPoints]);

  const handleOpenGoogleMaps = () => {
    const target = isHeadingToClient ? deliveryCoords : restaurantCoords;
    const destination = target
      ? `${target.latitude},${target.longitude}`
      : fallbackDestinationQuery;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    void Linking.openURL(url);
  };

  if (markerPoints.length === 0) {
    return (
      <View className="gap-2 rounded-2xl border border-slate-200 bg-white p-4">
        <Text className="text-xs text-slate-500">
          Sin coordenadas GPS guardadas para previsualizar el mapa en este pedido.
        </Text>
        <Pressable
          onPress={handleOpenGoogleMaps}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 active:opacity-85"
        >
          <Ionicons name="navigate" size={16} color="#fff" />
          <Text className="text-xs font-bold text-white">
            Abrir dirección en Google Maps
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ height: 220, width: '100%' }}
        initialRegion={{
          ...markerPoints[0],
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        toolbarEnabled={false}
        showsCompass
      >
        {routePoints.length >= 2 && (
          <Polyline
            coordinates={routePoints}
            strokeColor={isHeadingToClient ? '#208AEF' : '#F59E0B'}
            strokeWidth={3.5}
          />
        )}

        {driverCoords && (
          <Marker coordinate={driverCoords} title="Tu ubicación">
            <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-600 shadow">
              <Ionicons name="bicycle" size={18} color="#fff" />
            </View>
          </Marker>
        )}

        {restaurantCoords && (
          <Marker
            coordinate={restaurantCoords}
            title={`Recoger en: ${restaurantName}`}
          >
            <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-amber-500 shadow">
              <Ionicons name="storefront" size={17} color="#fff" />
            </View>
          </Marker>
        )}

        {deliveryCoords && (
          <Marker coordinate={deliveryCoords} title="Punto de entrega al cliente">
            <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary shadow">
              <Ionicons name="location" size={18} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      <View className="flex-row items-center justify-between gap-3 border-t border-slate-100 px-3.5 py-2.5">
        <View className="flex-1">
          <Text className="text-xs font-semibold text-slate-800">
            {isHeadingToClient ? 'Rumbo al cliente' : 'Rumbo al restaurante'}
          </Text>
          <Text className="text-[11px] text-slate-500">
            Google Maps SDK {restaurantCoords && deliveryCoords ? '· Ruta trazada' : ''}
          </Text>
        </View>
        <Pressable
          onPress={handleOpenGoogleMaps}
          className="flex-row items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 active:opacity-85"
        >
          <Ionicons name="navigate" size={14} color="#fff" />
          <Text className="text-xs font-bold text-white">Ir en Maps</Text>
        </Pressable>
      </View>
    </View>
  );
}

