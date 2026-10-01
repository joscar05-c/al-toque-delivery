import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createAddress } from '@/lib/addresses';
import { useAuthStore } from '@/store/authStore';
import type { Enums } from '@/types/database.types';

type AddressType = Enums<'addresses_type_enum'>;

const TYPE_OPTIONS: { value: AddressType; label: string }[] = [
  { value: 'home', label: 'Casa' },
  { value: 'work', label: 'Trabajo' },
  { value: 'other', label: 'Otro' },
];

/** Formulario de nueva dirección (INSERT en public.addresses). */
export default function NewAddressScreen() {
  const { session } = useAuthStore();

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [reference, setReference] = useState('');
  const [type, setType] = useState<AddressType>('home');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isValid =
    street.trim().length > 0 &&
    city.trim().length > 0 &&
    postalCode.trim().length > 0;

  const onSave = async () => {
    if (!session) return;
    if (!isValid) {
      Alert.alert(
        'Campos incompletos',
        'Dirección, ciudad y código postal son obligatorios.',
      );
      return;
    }

    setIsSaving(true);
    try {
      await createAddress({
        user_id: session.user.id,
        street: street.trim(),
        city: city.trim(),
        postal_code: postalCode.trim(),
        reference: reference.trim() || null,
        type,
        is_default: isDefault,
      });
      router.back(); // useFocusEffect de la lista recarga sola
    } catch (e) {
      Alert.alert(
        'No se pudo guardar',
        e instanceof Error ? e.message : 'Inténtalo de nuevo',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Cabecera */}
        <View className="flex-row items-center gap-3 bg-white px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:opacity-70"
          >
            <Ionicons name="chevron-back" size={22} color="#334155" />
          </Pressable>
          <Text className="text-lg font-bold text-slate-900">
            Nueva dirección
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* Tipo de dirección */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-700">Tipo</Text>
            <View className="flex-row gap-2">
              {TYPE_OPTIONS.map((option) => {
                const selected = type === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setType(option.value)}
                    className={`flex-1 items-center rounded-xl border py-3 ${
                      selected
                        ? 'border-primary bg-primary/10'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selected ? 'text-primary' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Campos */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-700">
              Dirección *
            </Text>
            <TextInput
              value={street}
              onChangeText={setStreet}
              placeholder="Ej: Jr. Amazonas 123"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900"
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 gap-2">
              <Text className="text-sm font-medium text-slate-700">
                Ciudad *
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Ej: Bagua"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900"
              />
            </View>
            <View className="w-32 gap-2">
              <Text className="text-sm font-medium text-slate-700">
                C. postal *
              </Text>
              <TextInput
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="01001"
                keyboardType="number-pad"
                maxLength={6}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900"
              />
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-700">
              Referencia
            </Text>
            <TextInput
              value={reference}
              onChangeText={setReference}
              placeholder="Ej: Casa de dos pisos, portón negro"
              multiline
              className="min-h-20 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900"
            />
          </View>

          {/* Predeterminada */}
          <View className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
            <Text className="text-sm font-medium text-slate-700">
              Establecer como predeterminada
            </Text>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ true: '#208AEF', false: '#CBD5E1' }}
              thumbColor="#fff"
            />
          </View>

          <Pressable
            onPress={onSave}
            disabled={isSaving || !isValid}
            className={`mt-2 items-center rounded-xl py-4 ${
              isSaving || !isValid
                ? 'bg-primary/50'
                : 'bg-primary active:opacity-80'
            }`}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Guardar dirección
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
