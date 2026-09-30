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

import { supabase } from '@/lib/supabase';

/**
 * Login con número de teléfono (OTP por SMS):
 * 1. signInWithOtp({ phone }) -> Supabase envía el código.
 * 2. verifyOtp({ phone, token, type: 'sms' }) -> crea la sesión.
 *
 * Tras verificar, onAuthStateChange actualiza el store y el router
 * redirige automáticamente según el rol del usuario.
 *
 * Requiere un proveedor SMS (p. ej. Twilio) configurado en:
 * Supabase Dashboard > Authentication > Providers > Phone.
 */
export default function LoginScreen() {
  const [phone, setPhone] = useState('+51');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendOtp = async () => {
    const sanitizedPhone = phone.replace(/\s/g, '');
    if (sanitizedPhone.length < 10) {
      Alert.alert(
        'Número inválido',
        'Ingresa tu número con código de país. Ej: +51987654321',
      );
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: sanitizedPhone,
    });
    setIsSubmitting(false);

    if (error) {
      Alert.alert('No se pudo enviar el código', error.message);
      return;
    }
    setStep('otp');
  };

  const verifyOtp = async () => {
    if (otp.trim().length < 6) {
      Alert.alert('Código incompleto', 'Ingresa el código de 6 dígitos.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone.replace(/\s/g, ''),
      token: otp.trim(),
      type: 'sms',
    });
    setIsSubmitting(false);

    if (error) {
      Alert.alert('Código incorrecto', error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center gap-6 px-8">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-slate-900">
              Al Toque Delivery
            </Text>
            <Text className="text-base text-slate-500">
              {step === 'phone'
                ? 'Ingresa tu número de teléfono para continuar.'
                : `Enviamos un código SMS a ${phone}.`}
            </Text>
          </View>

          {step === 'phone' ? (
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+51987654321"
              keyboardType="phone-pad"
              autoComplete="tel"
              className="rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900"
            />
          ) : (
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="Código de 6 dígitos"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              className="rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[8px] text-slate-900"
            />
          )}

          <Pressable
            onPress={step === 'phone' ? sendOtp : verifyOtp}
            disabled={isSubmitting}
            className="items-center rounded-xl bg-primary py-4 active:opacity-80 disabled:opacity-50"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                {step === 'phone' ? 'Enviar código' : 'Verificar e ingresar'}
              </Text>
            )}
          </Pressable>

          {step === 'otp' && (
            <Pressable
              onPress={() => {
                setStep('phone');
                setOtp('');
              }}
              className="items-center py-2 active:opacity-60"
            >
              <Text className="text-sm font-medium text-primary">
                Cambiar número de teléfono
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
