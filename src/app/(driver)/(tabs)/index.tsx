import { Text, View } from 'react-native';

/** Tab del repartidor: pedidos listos para recoger / asignados. */
export default function AvailableOrdersScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="text-xl font-bold text-slate-800">
        Pedidos disponibles
      </Text>
      <Text className="mt-2 text-center text-sm text-slate-500">
        {"Pedidos en estado 'ready' o asignados (driver_id = auth.uid())."}
      </Text>
    </View>
  );
}
