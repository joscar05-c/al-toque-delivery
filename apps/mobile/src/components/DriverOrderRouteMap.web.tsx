import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

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
  restaurantCoords,
  deliveryCoords,
  isHeadingToClient,
  fallbackDestinationQuery,
}: DriverOrderRouteMapProps) {
  const handleOpenGoogleMaps = () => {
    const target = isHeadingToClient ? deliveryCoords : restaurantCoords;
    const destination = target
      ? `${target.latitude},${target.longitude}`
      : fallbackDestinationQuery;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
      '_blank',
    );
  };

  return (
    <View className="gap-2.5 rounded-2xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-center gap-2">
        <Ionicons name="map-outline" size={20} color="#208AEF" />
        <Text className="text-xs font-semibold text-slate-700">
          Previsualización disponible en app móvil (Google Maps SDK)
        </Text>
      </View>
      <Pressable
        onPress={handleOpenGoogleMaps}
        className="flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 active:opacity-85"
      >
        <Ionicons name="navigate" size={15} color="#fff" />
        <Text className="text-xs font-bold text-white">Abrir ruta en Google Maps</Text>
      </Pressable>
    </View>
  );
}

