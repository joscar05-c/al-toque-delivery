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

import { confirmPhoneCode } from '@/lib/firebase';
import { getPhoneConfirmation } from '@/lib/phoneAuthSession';

const OTP_LENGTH = 6;

/**
 * Paso 2 del login: verificación del código SMS de 6 dígitos (Firebase).
 *
 * IMPORTANTE: si la verificación es exitosa NO se redirige manualmente.
 * El listener onAuthStateChanged del authStore detecta la sesión, consulta
 * el rol en public.users y los guards de los layouts redirigen a
 * /(client) o /(driver).
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

    const confirmation = getPhoneConfirmation();
    if (!confirmation) {
      Alert.alert('Sesión expirada', 'Vuelve a solicitar el código.');
      router.replace('/(auth)/login');
      return;
    }

    setIsLoading(true);
    try {
      await confirmPhoneCode(confirmation, otp);
      // Éxito: el authStore y los guards se encargan de la redirección.
    } catch (error) {
      Alert.alert(
        'Código incorrecto',
        error instanceof Error ? error.message : 'Inténtalo de nuevo.',
      );
      setOtp('');
      inputRef.current?.focus();
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
        <View className="flex-1 justify-center gap-8 px-5 py-6">
          {/* Encabezado */}
          <View className="items-center gap-7">
            <View
              className="h-40 w-40 items-center justify-center rounded-full bg-primary/15"
              accessibilityLabel="Al Toque Delivery"
            >
              <Ionicons name="restaurant-outline" size={42} color="#F29F30" />
              <Text className="mt-1 text-lg font-extrabold tracking-widest text-primary">
                AL TOQUE
              </Text>
            </View>

            <View className="items-center gap-2">
              <Text className="text-center text-[27px] font-bold text-[#1C2433]">
                Verify phone number
              </Text>
              <Text className="text-center text-sm leading-5 text-[#8E98A8]">
                We have just sent a code to {formattedPhone}.
              </Text>
            </View>
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
                    className="relative h-16 w-12 flex-1 items-center justify-center rounded-2xl bg-[#F3F4F6]"
                  >
                    <Text className="text-2xl font-bold text-[#1C2433]">
                      {digit}
                    </Text>
                    <View
                      className={`absolute bottom-0 h-1 w-8 rounded-full ${
                        isActive || digit ? 'bg-primary' : 'bg-slate-500'
                      }`}
                    />
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
          <View className="gap-4">
            <Pressable
              onPress={verifyOtp}
              disabled={isLoading || !isOtpComplete}
              className={`h-[52px] flex-row items-center justify-center gap-2 rounded-full ${
                isLoading || !isOtpComplete
                  ? 'bg-primary/60'
                  : 'bg-primary active:opacity-70'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">Next</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              disabled={isLoading}
              className="h-12 items-center justify-center rounded-full bg-[#F3F4F6] active:opacity-70"
            >
              <Text className="text-base font-semibold text-[#1C2433]">
                Send again
              </Text>
            </Pressable>

            <Text className="pt-1 text-center text-xs leading-5 text-[#8E98A8]">
              By signing up you agree to{'\n'}
              <Text className="text-primary">
                our terms of service and privacy policy.
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
