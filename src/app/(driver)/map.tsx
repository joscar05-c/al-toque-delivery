import { Text, View } from 'react-native';

/** Tab del repartidor: mapa con navegación y reporte de ubicación. */
export default function DriverMapScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="text-xl font-bold text-slate-800">Mapa</Text>
      <Text className="mt-2 text-center text-sm text-slate-500">
        Aquí irá el mapa en tiempo real (public.driver_locations).
      </Text>
    </View>
  );
}
