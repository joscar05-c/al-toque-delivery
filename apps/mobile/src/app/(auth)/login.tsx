import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { startPhoneVerification } from '@/lib/firebase';
import { setPhoneConfirmation } from '@/lib/phoneAuthSession';

// Las ciudades del enum (bagua, jaen, chachapoyas) están en Perú.
// Hazlo configurable si la app opera en más países.
const COUNTRY_CODE = '+51';
const PHONE_LENGTH = 9;

/**
 * Paso 1 del login (Firebase Phone Auth): ingreso del número.
 * Envía el SMS y navega a /(auth)/verify con el número como param.
 */
export default function LoginScreen() {
  const [digits, setDigits] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isPhoneValid = digits.length === PHONE_LENGTH;

  const sendOtp = async () => {
    if (!isPhoneValid) {
      Alert.alert(
        'Número inválido',
        `Ingresa los ${PHONE_LENGTH} dígitos de tu celular (sin el ${COUNTRY_CODE}).`,
      );
      return;
    }

    const phone = `${COUNTRY_CODE}${digits}`;

    setIsLoading(true);
    try {
      const confirmation = await startPhoneVerification(phone);
      setPhoneConfirmation(confirmation);
      router.push({ pathname: '/(auth)/verify', params: { phone } });
    } catch (error) {
      Alert.alert(
        'No se pudo enviar el código',
        error instanceof Error ? error.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center gap-8 px-8">
          {/* Encabezado */}
          <View className="items-center gap-3">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <Ionicons name="restaurant" size={40} color="#208AEF" />
            </View>
            <Text className="text-3xl font-bold text-slate-900">
              Al Toque Delivery
            </Text>
            <Text className="text-center text-base leading-6 text-slate-500">
              Ingresa tu número de celular y te enviaremos un código de
              verificación por SMS.
            </Text>
          </View>

          {/* Input de teléfono */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-700">
              Número de celular
            </Text>
            <View
              className={`flex-row items-center rounded-xl border-2 bg-white ${
                isPhoneValid ? 'border-primary' : 'border-slate-300'
              }`}
            >
              <View className="border-r border-slate-200 px-4 py-3">
                <Text className="text-lg font-semibold text-slate-700">
                  {COUNTRY_CODE}
                </Text>
              </View>
              <TextInput
                value={digits}
                onChangeText={(text) =>
                  setDigits(text.replace(/\D/g, '').slice(0, PHONE_LENGTH))
                }
                placeholder="987 654 321"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={PHONE_LENGTH}
                editable={!isLoading}
                className="flex-1 px-4 py-3 text-lg text-slate-900"
              />
            </View>
          </View>

          {/* Botón enviar código */}
          <Pressable
            onPress={sendOtp}
            disabled={isLoading}
            className={`flex-row items-center justify-center gap-2 rounded-xl py-4 ${
              isLoading ? 'bg-primary/60' : 'bg-primary active:opacity-80'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={20}
                  color="#fff"
                />
                <Text className="text-base font-semibold text-white">
                  Enviar código por SMS
                </Text>
              </>
            )}
          </Pressable>

          {/* Botón Saltar */}
          <Pressable
            onPress={() => router.replace('/(public)/(tabs)')}
            disabled={isLoading}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 active:opacity-70"
          >
            <Ionicons name="play-skip-forward-outline" size={20} color="#64748B" />
            <Text className="text-base font-medium text-slate-600">
              Saltar y explorar
            </Text>
          </Pressable>

          <Text className="text-center text-xs leading-5 text-slate-400">
            Al continuar aceptas recibir un SMS con tu código de acceso. Pueden
            aplicar tarifas de tu operador.
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Contenedor de reCAPTCHA invisible (solo web usa este id). */}
      <View nativeID="recaptcha-container" />
    </SafeAreaView>
  );
}
