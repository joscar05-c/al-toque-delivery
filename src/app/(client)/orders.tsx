import { Text, View } from 'react-native';

/** Tab del cliente: historial y seguimiento de pedidos propios. */
export default function ClientOrdersScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="text-xl font-bold text-slate-800">Mis pedidos</Text>
      <Text className="mt-2 text-center text-sm text-slate-500">
        Pedidos donde client_id = auth.uid() (public.orders).
      </Text>
    </View>
  );
}
