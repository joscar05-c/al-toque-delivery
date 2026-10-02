import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PublicProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Ionicons name="person-outline" size={64} color="#94A3B8" />
        <Text className="text-center text-xl font-semibold text-slate-800">
          Tu perfil
        </Text>
        <Text className="text-center text-sm text-slate-500 px-8">
          Guarda direcciones, gestiona métodos de pago y
          accede a tu configuración personal.
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