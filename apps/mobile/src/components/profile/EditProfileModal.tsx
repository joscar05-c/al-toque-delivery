import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useKeyboardBottomInset } from '@/hooks/useKeyboardBottomInset';
import { updateUserProfileData } from '@/lib/profile';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialName: string;
  initialEmail: string | null;
  phone: string | null;
  onUpdated: (name: string, email: string | null) => void;
}

export function EditProfileModal({
  visible,
  onClose,
  userId,
  initialName,
  initialEmail,
  phone,
  onUpdated,
}: EditProfileModalProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomInset = useKeyboardBottomInset();

  // Sincroniza estado cuando se abre el modal
  const handleOpen = () => {
    setName(initialName);
    setEmail(initialEmail ?? '');
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Ingresa un correo electrónico válido o déjalo en blanco.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfileData(userId, {
        name: trimmedName,
        email: trimmedEmail || null,
      });
      onUpdated(trimmedName, trimmedEmail || null);
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.');
      Keyboard.dismiss();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.5)',
          paddingBottom: bottomInset,
        }}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <View
          style={{
            maxHeight: bottomInset > 0 ? '78%' : '90%',
          }}
          className="rounded-t-3xl bg-white px-6 pb-6 pt-5 shadow-2xl"
        >
          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between border-b border-slate-100 pb-3">
            <View>
              <Text className="text-lg font-bold text-[#1C2433]">Editar Perfil</Text>
              <Text className="text-xs text-[#8E98A8]">
                Actualiza tus datos personales
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                onClose();
              }}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:opacity-70"
            >
              <Ionicons name="close" size={18} color="#1C2433" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: bottomInset > 0 ? 32 : 16 }}
          >
            <View className="gap-4">
              {error && (
                <View className="flex-row items-center gap-2 rounded-xl bg-red-50 p-3">
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text className="flex-1 text-xs text-red-600">{error}</Text>
                </View>
              )}

              {/* Campo Nombre */}
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-[#1C2433]">
                  Nombre completo *
                </Text>
                <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
                  <Ionicons name="person-outline" size={18} color="#8E98A8" />
                  <TextInput
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      setError(null);
                    }}
                    placeholder="Tu nombre y apellido"
                    placeholderTextColor="#94A3B8"
                    className="ml-2.5 flex-1 text-sm text-[#1C2433]"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Campo Correo */}
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-[#1C2433]">
                  Correo electrónico (opcional)
                </Text>
                <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
                  <Ionicons name="mail-outline" size={18} color="#8E98A8" />
                  <TextInput
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      setError(null);
                    }}
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="ml-2.5 flex-1 text-sm text-[#1C2433]"
                  />
                </View>
              </View>

              {/* Campo Teléfono (Protegido/Verificado) */}
              <View className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-[#1C2433]">
                    Teléfono celular
                  </Text>
                  <View className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5">
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text className="text-[10px] font-bold text-emerald-700">
                      Verificado
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <Ionicons name="call-outline" size={18} color="#8E98A8" />
                  <Text className="ml-2.5 flex-1 text-sm font-medium text-slate-600">
                    {phone || 'Sin número registrado'}
                  </Text>
                  <Ionicons name="lock-closed" size={16} color="#94A3B8" />
                </View>
                <Text className="text-[11px] text-[#8E98A8]">
                  Vinculado a tu inicio de sesión de seguridad por SMS.
                </Text>
              </View>

              {/* Botón Guardar */}
              <View className="mt-2 flex-row gap-3">
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    onClose();
                  }}
                  disabled={isSaving}
                  className="flex-1 items-center justify-center rounded-2xl border border-slate-200 py-3.5 active:bg-slate-50"
                >
                  <Text className="text-sm font-bold text-slate-700">Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={isSaving}
                  className="flex-1 items-center justify-center rounded-2xl bg-primary py-3.5 active:opacity-80"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-sm font-bold text-white">
                      Guardar cambios
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
