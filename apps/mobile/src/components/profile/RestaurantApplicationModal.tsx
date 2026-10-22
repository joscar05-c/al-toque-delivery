import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
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
import {
  fetchCategoriesForApplication,
  submitRestaurantApplication,
  type ApplicationCity,
} from '@/lib/profile';
import type { RestaurantApplication, RestaurantCategory } from '@delivery/shared';

interface RestaurantApplicationModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialOwnerName: string;
  initialPhone: string;
  initialEmail: string | null;
  application: RestaurantApplication | null;
  onApplicationUpdated: (app: RestaurantApplication) => void;
}

const CITY_OPTIONS: { city: ApplicationCity; label: string }[] = [
  { city: 'jaen', label: 'Jaén' },
  { city: 'bagua', label: 'Bagua' },
  { city: 'chachapoyas', label: 'Chachapoyas' },
  { city: 'other', label: 'Otra' },
];

export function RestaurantApplicationModal({
  visible,
  onClose,
  userId,
  initialOwnerName,
  initialPhone,
  initialEmail,
  application,
  onApplicationUpdated,
}: RestaurantApplicationModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Categorías de restaurantes disponibles
  const [categories, setCategories] = useState<
    Pick<RestaurantCategory, 'id' | 'name' | 'icon'>[]
  >([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState<ApplicationCity>('jaen');
  const [address, setAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState(initialPhone);
  const [businessEmail, setBusinessEmail] = useState(initialEmail ?? '');
  const [ownerName, setOwnerName] = useState(initialOwnerName);
  const [ownerDni, setOwnerDni] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');

  // Cargar categorías gastronómicas
  useEffect(() => {
    if (visible && categories.length === 0) {
      setIsLoadingCategories(true);
      fetchCategoriesForApplication()
        .then((cats) => {
          setCategories(cats);
          if (cats.length > 0 && !categoryId) {
            setCategoryId(cats[0].id);
          }
        })
        .catch((e) => console.error('[restaurant modal] Error cargando categorías:', e))
        .finally(() => setIsLoadingCategories(false));
    }
  }, [visible, categories.length, categoryId]);

  // Sincronizar datos si hay solicitud previa
  useEffect(() => {
    if (application) {
      setBusinessName(application.business_name || '');
      setCategoryId(application.category_id || '');
      setCity(application.city || 'jaen');
      setAddress(application.address || '');
      setBusinessPhone(application.business_phone || initialPhone);
      setBusinessEmail(application.business_email || initialEmail || '');
      setOwnerName(application.owner_name || initialOwnerName);
      setOwnerDni(application.owner_dni || '');
      setAdditionalComments(application.additional_comments || '');
      setIsEditing(false);
    } else {
      setBusinessPhone(initialPhone);
      setBusinessEmail(initialEmail ?? '');
      setOwnerName(initialOwnerName);
      setIsEditing(true);
    }
    setError(null);
  }, [application, initialOwnerName, initialPhone, initialEmail, visible]);

  const handleSubmit = async () => {
    setError(null);

    if (!businessName.trim() || businessName.trim().length < 3) {
      setError('Ingresa el nombre de tu restaurante (mínimo 3 caracteres).');
      return;
    }

    if (!categoryId) {
      setError('Selecciona una categoría gastronómica para tu restaurante.');
      return;
    }

    if (!address.trim() || address.trim().length < 5) {
      setError('Ingresa la dirección física de tu local.');
      return;
    }

    if (!businessPhone.trim() || businessPhone.trim().length < 6) {
      setError('Ingresa un teléfono comercial de contacto válido.');
      return;
    }

    if (!ownerName.trim()) {
      setError('Ingresa el nombre del propietario o representante.');
      return;
    }

    if (!ownerDni.trim() || ownerDni.trim().length < 8) {
      setError('Ingresa un DNI de propietario válido (mínimo 8 dígitos).');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await submitRestaurantApplication({
        existingId: application?.id,
        userId,
        businessName: businessName.trim(),
        businessPhone: businessPhone.trim(),
        businessEmail: businessEmail.trim() || undefined,
        address: address.trim(),
        categoryId,
        city,
        ownerName: ownerName.trim(),
        ownerDni: ownerDni.trim(),
        additionalComments: additionalComments.trim() || undefined,
      });

      onApplicationUpdated(saved);
      setIsEditing(false);
      Alert.alert(
        'Solicitud enviada',
        'Tu solicitud para afiliar tu restaurante fue enviada con éxito. Nuestro equipo se contactará contigo.',
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al enviar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusView = () => {
    if (!application) return null;

    if (application.status === 'pending') {
      return (
        <View className="gap-5 py-2">
          <View className="items-center rounded-2xl bg-amber-50 p-5 border border-amber-200">
            <Text className="text-4xl mb-2">⏳</Text>
            <View className="rounded-full bg-amber-100 px-3 py-1 mb-2">
              <Text className="text-xs font-bold text-amber-800">
                Solicitud en evaluación
              </Text>
            </View>
            <Text className="text-center text-sm font-semibold text-slate-800">
              {application.business_name}
            </Text>
            <Text className="mt-1 text-center text-xs text-slate-600">
              Tu solicitud para registrar tu restaurante está en evaluación. Nuestro equipo
              comercial revisará la viabilidad y se comunicará al teléfono {application.business_phone}.
            </Text>
          </View>

          {/* Resumen */}
          <View className="rounded-2xl border border-slate-200 bg-white p-4 gap-2.5">
            <Text className="text-xs font-bold uppercase tracking-wider text-[#8E98A8]">
              Resumen del Negocio
            </Text>
            <View className="flex-row justify-between py-1 border-b border-slate-100">
              <Text className="text-xs text-slate-500">Restaurante</Text>
              <Text className="text-xs font-semibold text-slate-800">
                {application.business_name}
              </Text>
            </View>
            <View className="flex-row justify-between py-1 border-b border-slate-100">
              <Text className="text-xs text-slate-500">Ciudad</Text>
              <Text className="text-xs font-semibold text-slate-800 capitalize">
                {application.city}
              </Text>
            </View>
            <View className="flex-row justify-between py-1 border-b border-slate-100">
              <Text className="text-xs text-slate-500">Dirección</Text>
              <Text className="text-xs font-semibold text-slate-800">
                {application.address}
              </Text>
            </View>
            <View className="flex-row justify-between py-1">
              <Text className="text-xs text-slate-500">Fecha de envío</Text>
              <Text className="text-xs font-semibold text-slate-800">
                {new Date(application.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setIsEditing(true)}
            className="items-center justify-center rounded-2xl border border-slate-200 py-3 active:bg-slate-50"
          >
            <Text className="text-xs font-bold text-slate-700">
              Modificar datos del restaurante
            </Text>
          </Pressable>
        </View>
      );
    }

    if (application.status === 'approved') {
      return (
        <View className="items-center rounded-2xl bg-emerald-50 p-6 border border-emerald-200 gap-3">
          <Text className="text-5xl">🏪</Text>
          <View className="rounded-full bg-emerald-100 px-3 py-1">
            <Text className="text-xs font-bold text-emerald-800">
              ¡Restaurante Aprobado!
            </Text>
          </View>
          <Text className="text-center text-sm font-semibold text-slate-800">
            {application.business_name} ya es parte de Al Toque Delivery
          </Text>
          <Text className="text-center text-xs text-slate-600">
            Tu restaurante fue registrado en el sistema. Puedes acceder al Panel
            Administrativo Web en tu computadora para configurar tu menú, horarios y tarifas de entrega.
          </Text>
        </View>
      );
    }

    if (application.status === 'rejected') {
      return (
        <View className="gap-4 py-2">
          <View className="items-center rounded-2xl bg-red-50 p-5 border border-red-200">
            <Text className="text-4xl mb-2">⚠️</Text>
            <View className="rounded-full bg-red-100 px-3 py-1 mb-2">
              <Text className="text-xs font-bold text-red-800">Solicitud no aprobada</Text>
            </View>
            <Text className="text-center text-sm font-semibold text-slate-800">
              Notas del Administrador:
            </Text>
            <Text className="mt-1 text-center text-xs text-red-700 font-medium">
              {application.admin_notes || 'Por favor verifica la información de tu local y vuelve a intentarlo.'}
            </Text>
          </View>

          <Pressable
            onPress={() => setIsEditing(true)}
            className="items-center justify-center rounded-2xl bg-primary py-3.5 active:opacity-80"
          >
            <Text className="text-sm font-bold text-white">
              Corregir y volver a postular
            </Text>
          </Pressable>
        </View>
      );
    }

    return null;
  };

  const bottomInset = useKeyboardBottomInset();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
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
            <View className="flex-1 pr-2">
              <Text className="text-lg font-bold text-[#1C2433]">
                {application && !isEditing
                  ? 'Estado de tu Restaurante'
                  : 'Registra tu Restaurante'}
              </Text>
              <Text className="text-xs text-[#8E98A8]">
                {application && !isEditing
                  ? 'Consulta el estado de tu negocio afiliado'
                  : 'Vende tus platos a miles de clientes'}
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
            {application && !isEditing ? (
              renderStatusView()
            ) : (
              <View className="gap-3.5 pb-4">
                {error && (
                  <View className="flex-row items-center gap-2 rounded-xl bg-red-50 p-3">
                    <Ionicons name="alert-circle" size={18} color="#EF4444" />
                    <Text className="flex-1 text-xs text-red-600">{error}</Text>
                  </View>
                )}

                {/* Nombre del Restaurante */}
                <View className="gap-1">
                  <Text className="text-xs font-semibold text-[#1C2433]">
                    Nombre Comercial del Restaurante *
                  </Text>
                  <TextInput
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Ej: Pollería El Buen Gusto"
                    placeholderTextColor="#94A3B8"
                    className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#1C2433]"
                  />
                </View>

                {/* Selector de Ciudad */}
                <View className="gap-1.5 pt-1">
                  <Text className="text-xs font-semibold text-[#1C2433]">
                    Ciudad del Local *
                  </Text>
                  <View className="flex-row gap-2">
                    {CITY_OPTIONS.map((opt) => {
                      const selected = city === opt.city;
                      return (
                        <Pressable
                          key={opt.city}
                          onPress={() => setCity(opt.city)}
                          className={`flex-1 items-center justify-center rounded-2xl py-2.5 border ${
                            selected
                              ? 'border-primary bg-primary/10'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              selected ? 'text-primary' : 'text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Categoría Gastronómica */}
                <View className="gap-1.5 pt-1">
                  <Text className="text-xs font-semibold text-[#1C2433]">
                    Categoría Gastronómica *
                  </Text>
                  {isLoadingCategories ? (
                    <ActivityIndicator size="small" color="#F29F30" />
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="flex-row gap-2"
                    >
                      {categories.map((cat) => {
                        const selected = categoryId === cat.id;
                        return (
                          <Pressable
                            key={cat.id}
                            onPress={() => setCategoryId(cat.id)}
                            className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 border mr-2 ${
                              selected
                                ? 'border-primary bg-primary/15'
                                : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <Text className="text-sm">{cat.icon || '🍽️'}</Text>
                            <Text
                              className={`text-xs font-semibold ${
                                selected ? 'text-primary font-bold' : 'text-slate-700'
                              }`}
                            >
                              {cat.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>

                {/* Dirección del local */}
                <View className="gap-1">
                  <Text className="text-xs font-semibold text-[#1C2433]">
                    Dirección física del restaurante *
                  </Text>
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Ej: Jr. San Martín 420 (Cerca a la plaza)"
                    placeholderTextColor="#94A3B8"
                    className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#1C2433]"
                  />
                </View>

                {/* Teléfono y Correo comercial */}
                <View className="flex-row gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-xs font-semibold text-[#1C2433]">
                      Teléfono del local *
                    </Text>
                    <TextInput
                      value={businessPhone}
                      onChangeText={setBusinessPhone}
                      placeholder="987654321"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#1C2433]"
                    />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="text-xs font-semibold text-[#1C2433]">
                      Correo comercial
                    </Text>
                    <TextInput
                      value={businessEmail}
                      onChangeText={setBusinessEmail}
                      placeholder="Opcional"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#1C2433]"
                    />
                  </View>
                </View>

                {/* Datos del Propietario */}
                <View className="gap-2.5 rounded-2xl bg-slate-50 p-3 border border-slate-200">
                  <Text className="text-[11px] font-bold uppercase text-[#8E98A8]">
                    Titular / Propietario
                  </Text>
                  <View className="flex-row gap-2.5">
                    <View className="flex-1 gap-1">
                      <TextInput
                        value={ownerName}
                        onChangeText={setOwnerName}
                        placeholder="Nombre completo"
                        placeholderTextColor="#94A3B8"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#1C2433]"
                      />
                    </View>
                    <View className="w-28 gap-1">
                      <TextInput
                        value={ownerDni}
                        onChangeText={setOwnerDni}
                        placeholder="DNI (8 dígitos)"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        maxLength={10}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#1C2433]"
                      />
                    </View>
                  </View>
                </View>

                {/* Comentarios adicionales */}
                <View className="gap-1">
                  <Text className="text-xs font-semibold text-[#1C2433]">
                    Comentarios o especialidad (opcional)
                  </Text>
                  <TextInput
                    value={additionalComments}
                    onChangeText={setAdditionalComments}
                    placeholder="Ej: Ofrecemos almuerzos ejecutivos y delivery propio nocturno."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={2}
                    className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#1C2433]"
                  />
                </View>

                {/* Botones */}
                <View className="mt-3 flex-row gap-3">
                  {application && (
                    <Pressable
                      onPress={() => setIsEditing(false)}
                      className="flex-1 items-center justify-center rounded-2xl border border-slate-200 py-3.5 active:bg-slate-50"
                    >
                      <Text className="text-sm font-bold text-slate-700">Cancelar</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 items-center justify-center rounded-2xl bg-primary py-3.5 active:opacity-80"
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-sm font-bold text-white">
                        {application ? 'Actualizar Solicitud' : 'Enviar Solicitud'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
