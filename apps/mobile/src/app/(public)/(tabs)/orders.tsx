import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PublicOrdersScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Ionicons name="bag-handle-outline" size={64} color="#94A3B8" />
        <Text className="text-center text-xl font-semibold text-slate-800">
          Inicia sesión para ver tus pedidos
        </Text>
        <Text className="text-center text-sm text-slate-500 px-8">
          Tu historial de pedidos, estado actual y detalles
          solo están disponibles tras iniciar sesión.
        </Text>
        <Pressable
          onPress={() => router.push('/(auth)/login')}
          className="mt-2 rounded-xl bg-primary px-8 py-3 active:opacity-80"
        >
          <Text className="font-semibold text-white">Iniciar sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}