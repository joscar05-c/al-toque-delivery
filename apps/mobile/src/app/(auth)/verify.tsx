import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

const OTP_LENGTH = 6;

/**
 * Paso 2 del login: verificación del código OTP de 6 dígitos.
 *
 * IMPORTANTE: si la verificación es exitosa NO se redirige manualmente.
 * El listener onAuthStateChange del authStore detecta la nueva sesión,
 * consulta el rol en public.users y los guards de los layouts redirigen
 * automáticamente a /(client) o /(driver).
 */
export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Acceso directo a la pantalla sin teléfono -> volver al login.
  if (!phone) {
    return <Redirect href="/(auth)/login" />;
  }

  const isOtpComplete = otp.length === OTP_LENGTH;
  // "+51987654321" -> "+51 987 654 321"
  const formattedPhone = phone.replace(
    /(\+\d{2})(\d{3})(\d{3})(\d{3})/,
    '$1 $2 $3 $4',
  );

  const verifyOtp = async () => {
    if (!isOtpComplete) {
      Alert.alert(
        'Código incompleto',
        `Ingresa los ${OTP_LENGTH} dígitos que recibiste por SMS.`,
      );
      return;
    }

    console.log('[Verify] Verifying OTP for:', phone);
    setIsLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });
    console.log('[Verify] OTP result:', { error: error?.message });
    setIsLoading(false);

    if (error) {
      Alert.alert('Código incorrecto', error.message);
      setOtp('');
      inputRef.current?.focus();
      return;
    }
    console.log('[Verify] OTP verified successfully, waiting for authStore redirect...');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 gap-8 px-8 pt-4">
          {/* Botón volver */}
          <Pressable
            onPress={() => router.back()}
            disabled={isLoading}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:opacity-70"
          >
            <Ionicons name="chevron-back" size={22} color="#334155" />
          </Pressable>

          {/* Encabezado */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-slate-900">
              Verifica tu número
            </Text>
            <Text className="text-base leading-6 text-slate-500">
              Ingresa el código de {OTP_LENGTH} dígitos que enviamos por SMS a{' '}
              <Text className="font-semibold text-slate-700">
                {formattedPhone}
              </Text>
            </Text>
          </View>

          {/* Casillas del código OTP */}
          <Pressable
            onPress={() => inputRef.current?.focus()}
            className="relative"
          >
            <View className="flex-row justify-center gap-2">
              {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                const digit = otp[index] ?? '';
                const isActive = index === otp.length;
                return (
                  <View
                    key={index}
                    className={`h-14 w-12 items-center justify-center rounded-xl border-2 ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : digit
                          ? 'border-primary/40 bg-white'
                          : 'border-slate-300 bg-slate-50'
                    }`}
                  >
                    <Text className="text-2xl font-bold text-slate-900">
                      {digit}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Input real, invisible, encima de las casillas.
                Mantiene teclado numérico y autocompletado de SMS nativo. */}
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={(text) =>
                setOtp(text.replace(/\D/g, '').slice(0, OTP_LENGTH))
              }
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              autoFocus
              caretHidden
              editable={!isLoading}
              style={[StyleSheet.absoluteFill, { opacity: 0 }]}
            />
          </Pressable>

          {/* Botón verificar */}
          <Pressable
            onPress={verifyOtp}
            disabled={isLoading || !isOtpComplete}
            className={`flex-row items-center justify-center gap-2 rounded-xl py-4 ${
              isLoading || !isOtpComplete
                ? 'bg-primary/60'
                : 'bg-primary active:opacity-80'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Verificar
              </Text>
            )}
          </Pressable>

          <Text className="text-center text-xs leading-5 text-slate-400">
            ¿No recibiste el código? Vuelve atrás y reenvíalo a tu número.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
