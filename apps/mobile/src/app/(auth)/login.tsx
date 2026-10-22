import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Encabezado y marca */}
            <View style={styles.header}>
              <View style={styles.logo} accessibilityLabel="Al Toque Delivery">
                <Image
                  source={require('../../../assets/images/logo.png')}
                  style={{ width: 140, height: 140, borderRadius: 70 }}
                  contentFit="contain"
                  transition={200}
                />
              </View>

              <View style={styles.heading}>
                <Text style={styles.title}>Get started with Al Toque</Text>
                <Text style={styles.subtitle}>Ingresa tu número de celular</Text>
              </View>
            </View>

            {/* Campo de número */}
            <View style={styles.form}>
              <View style={styles.phoneInput}>
                <Text style={styles.inputLabel}>Número de celular</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.flag} accessibilityLabel="Perú">
                      🇵🇪
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#8E98A8" />
                    <Text style={styles.countryCodeText}>{COUNTRY_CODE}</Text>
                  </View>

                  <TextInput
                    value={digits}
                    onChangeText={(text) =>
                      setDigits(text.replace(/\D/g, '').slice(0, PHONE_LENGTH))
                    }
                    placeholder="987 654 321"
                    placeholderTextColor="#B8C0CC"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    maxLength={PHONE_LENGTH}
                    editable={!isLoading}
                    style={styles.textInput}
                    accessibilityLabel="Número de celular"
                  />

                  <View
                    style={[
                      styles.validationIcon,
                      isPhoneValid && styles.validationIconValid,
                    ]}
                    accessibilityLabel={isPhoneValid ? 'Número válido' : undefined}
                  >
                    <Ionicons
                      name="checkmark"
                      size={15}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Acciones */}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={sendOtp}
                disabled={isLoading}
                activeOpacity={0.7}
                style={[
                  styles.primaryButton,
                  isLoading && styles.primaryButtonLoading,
                ]}
                accessibilityRole="button"
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Enviar código por SMS
                  </Text>
                )}
              </TouchableOpacity>

              <Pressable
                onPress={() => router.replace('/(public)/(tabs)')}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.exploreButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Ionicons
                  name="play-skip-forward-outline"
                  size={18}
                  color="#8E98A8"
                />
                <Text style={styles.exploreButtonText}>Saltar y explorar</Text>
              </Pressable>

              <Text style={styles.legalText}>
                Al continuar aceptas recibir un SMS con tu código de acceso.
                Pueden aplicar tarifas de tu operador.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Contenedor de reCAPTCHA invisible (solo web usa este id). */}
      <View nativeID="recaptcha-container" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: 28,
  },
  header: {
    alignItems: 'center',
    gap: 28,
  },
  logo: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoText: {
    color: '#F29F30',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  heading: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#1C2433',
    fontSize: 27,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#8E98A8',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  phoneInput: {
    minHeight: 90,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  inputLabel: {
    color: '#8E98A8',
    fontSize: 12,
    marginBottom: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: {
    fontSize: 22,
  },
  countryCodeText: {
    color: '#1C2433',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
    paddingHorizontal: 10,
    color: '#1C2433',
    fontSize: 16,
  },
  validationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C4CAD3',
  },
  validationIconValid: {
    backgroundColor: '#10B981',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#F29F30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLoading: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  exploreButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
  },
  exploreButtonText: {
    color: '#8E98A8',
    fontSize: 14,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.7,
  },
  legalText: {
    color: '#8E98A8',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
