import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { updateUserProfile } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { isProfileIncomplete, useAuthStore } from '@/store/authStore';

export default function CompleteProfileScreen() {
  const { session, user, profile, refreshProfile, signOut } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Si no hay sesión activa, volver al login
  if (!session || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Si el perfil ya está completo, redirigir a cliente
  if (!isProfileIncomplete(profile)) {
    return <Redirect href="/(client)/(tabs)" />;
  }

  const phone = user.phoneNumber ?? profile?.phone ?? '';
  const formattedPhone = phone.replace(
    /(\+\d{2})(\d{3})(\d{3})(\d{3})/,
    '$1 $2 $3 $4',
  );

  const handleSave = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 3) {
      setErrorMessage('Por favor ingresa tu nombre y apellido (mínimo 3 letras).');
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Ingresa un correo electrónico válido o déjalo en blanco.');
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      // 1. Guardar en Supabase public.users
      const { error: dbError } = await supabase
        .from('users')
        .update({
          name: trimmedName,
          email: trimmedEmail || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.uid);

      if (dbError) {
        throw new Error(dbError.message);
      }

      // 2. Guardar display name en Firebase Auth
      await updateUserProfile(trimmedName);

      // 3. Refrescar estado global en Zustand
      await refreshProfile();

      // 4. Navegar a la app de cliente
      router.replace('/(client)/(tabs)');
    } catch (e: unknown) {
      console.error('[complete-profile] Error al guardar datos:', e);
      Alert.alert(
        'Error al guardar',
        e instanceof Error ? e.message : 'No se pudo guardar la información. Inténtalo de nuevo.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Encabezado con logotipo e ilustración */}
          <View className="items-center gap-3 pt-4 pb-6">
            <Image
              source={require('../../../assets/images/logo.png')}
              style={{ width: 84, height: 84, borderRadius: 42 }}
              contentFit="contain"
            />
            <Text className="text-2xl font-bold text-[#1C2433] text-center">
              ¡Casi listo para pedir!
            </Text>
            <Text className="text-sm text-[#8E98A8] text-center px-4 leading-5">
              Ingresa tu nombre para que los restaurantes y repartidores sepan a quién entregarle el pedido.
            </Text>
          </View>

          {/* Tarjeta de número verificado */}
          {phone ? (
            <View className="mb-6 flex-row items-center justify-between rounded-2xl bg-[#F8F9FA] border border-slate-100 p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                  <Ionicons name="call" size={16} color="#10B981" />
                </View>
                <View>
                  <Text className="text-xs text-[#8E98A8]">Número verificado</Text>
                  <Text className="text-sm font-semibold text-[#1C2433]">{formattedPhone}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                <Ionicons name="checkmark-circle" size={13} color="#059669" />
                <Text className="text-[11px] font-bold text-emerald-800">Verificado</Text>
              </View>
            </View>
          ) : null}

          {/* Formulario */}
          <View className="gap-5">
            {/* Campo: Nombre completo */}
            <View className="gap-1.5">
              <Text className="text-sm font-semibold text-[#1C2433]">
                Nombre y Apellido <Text className="text-red-500">*</Text>
              </Text>
              <View className="h-13 flex-row items-center gap-3 rounded-2xl bg-[#F8F9FA] border border-slate-200 px-4 focus:border-primary">
                <Ionicons name="person-outline" size={20} color="#8E98A8" />
                <TextInput
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Ej. Juan Pérez"
                  placeholderTextColor="#A0AAB8"
                  autoCapitalize="words"
                  autoCorrect={false}
                  className="flex-1 text-base font-medium text-[#1C2433]"
                  autoFocus
                />
              </View>
            </View>

            {/* Campo: Correo electrónico (opcional) */}
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-[#1C2433]">
                  Correo electrónico
                </Text>
                <Text className="text-xs text-[#8E98A8]">Opcional</Text>
              </View>
              <View className="h-13 flex-row items-center gap-3 rounded-2xl bg-[#F8F9FA] border border-slate-200 px-4 focus:border-primary">
                <Ionicons name="mail-outline" size={20} color="#8E98A8" />
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#A0AAB8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 text-base font-medium text-[#1C2433]"
                />
              </View>
              <Text className="text-[11px] text-[#8E98A8] px-1">
                Para enviarte boletas y comprobantes de tus pedidos.
              </Text>
            </View>

            {/* Mensaje de error */}
            {errorMessage ? (
              <View className="flex-row items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text className="flex-1 text-xs font-medium text-red-700">{errorMessage}</Text>
              </View>
            ) : null}

            {/* Botón de acción principal */}
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className={`mt-4 h-13 flex-row items-center justify-center rounded-2xl bg-primary shadow-sm active:opacity-90 ${
                isSaving ? 'opacity-70' : ''
              }`}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-bold text-white">Comenzar a pedir</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              )}
            </Pressable>
          </View>

          {/* Cerrar sesión al final */}
          <View className="mt-auto pt-8 pb-4 items-center">
            <Pressable
              onPress={() => signOut()}
              hitSlop={8}
              className="active:opacity-60"
            >
              <Text className="text-xs font-semibold text-[#8E98A8]">
                ¿Número equivocado? <Text className="text-primary font-bold">Cerrar sesión</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
