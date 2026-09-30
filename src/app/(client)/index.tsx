import { Text, View } from 'react-native';

/** Tab del cliente: listado de restaurantes (se implementará a continuación). */
export default function RestaurantsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="text-xl font-bold text-slate-800">Restaurantes</Text>
      <Text className="mt-2 text-center text-sm text-slate-500">
        Aquí se listarán los restaurantes activos (public.restaurants).
      </Text>
    </View>
  );
}
