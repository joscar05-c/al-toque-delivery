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
  submitDriverApplication,
  type VehicleType,
} from '@/lib/profile';
import type { DriverApplication } from '@delivery/shared';

interface DriverApplicationModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialFullName: string;
  initialPhone: string;
  initialEmail: string | null;
  application: DriverApplication | null;
  onApplicationUpdated: (app: DriverApplication) => void;
}

const VEHICLE_OPTIONS: { type: VehicleType; label: string; icon: string }[] = [
  { type: 'motorcycle', label: 'Moto', icon: '🛵' },
  { type: 'bicycle', label: 'Bicicleta', icon: '🚲' },
  { type: 'car', label: 'Auto', icon: '🚗' },
];

export function DriverApplicationModal({
  visible,
  onClose,
  userId,
  initialFullName,
  initialPhone,
  initialEmail,
  application,
  onApplicationUpdated,
}: DriverApplicationModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos del formulario
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail ?? '');
  const [dni, setDni] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Sincronizar con solicitud previa si existe
  useEffect(() => {
    if (application) {
      setFullName(application.full_name || initialFullName);
      setPhone(application.phone || initialPhone);
      setEmail(application.email || initialEmail || '');
      setDni(application.dni || '');
      setBirthDate(application.birth_date || '');
      setVehicleType(application.vehicle_type || 'motorcycle');
      setLicenseNumber(application.license_number || '');
      setVehiclePlate(application.vehicle_plate || '');
      setVehicleBrand(application.vehicle_brand || '');
      setEmergencyName(application.emergency_contact_name || '');
      setEmergencyPhone(application.emergency_contact_phone || '');
      setIsEditing(false);
    } else {
      setFullName(initialFullName);
      setPhone(initialPhone);
      setEmail(initialEmail ?? '');
      setIsEditing(true);
    }
    setError(null);
  }, [application, initialFullName, initialPhone, initialEmail, visible]);

  const handleSubmit = async () => {
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 3) {
      setError('Ingresa tu nombre completo.');
      return;
    }

    if (!dni.trim() || dni.trim().length < 8) {
      setError('Ingresa un número de DNI válido (mínimo 8 dígitos).');
      return;
    }

    if (!birthDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())) {
      setError('Ingresa tu fecha de nacimiento en formato AAAA-MM-DD (ej: 1998-05-20).');
      return;
    }

    if (vehicleType !== 'bicycle' && !vehiclePlate.trim()) {
      setError('La placa del vehículo es requerida para motos y autos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await submitDriverApplication({
        existingId: application?.id,
        userId,
        dni: dni.trim(),
        birthDate: birthDate.trim(),
        vehicleType,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        licenseNumber: licenseNumber.trim() || undefined,
        vehiclePlate: vehiclePlate.trim() || undefined,
        vehicleBrand: vehicleBrand.trim() || undefined,
        emergencyContactName: emergencyName.trim() || undefined,
        emergencyContactPhone: emergencyPhone.trim() || undefined,
      });

      onApplicationUpdated(saved);
      setIsEditing(false);
      Alert.alert(
        'Solicitud enviada',
        'Tu postulación como repartidor fue enviada con éxito. El equipo la revisará a la brevedad.',
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
                Solicitud en revisión
              </Text>
            </View>
            <Text className="text-center text-sm font-semibold text-slate-800">
              Estamos revisando tu postulación
            </Text>
            <Text className="mt-1 text-center text-xs text-slate-600">
              Nuestro equipo administrativo está validando tus datos y disponibilidad.
              Te notificaremos en cuanto tu cuenta sea activada como repartidor.
            </Text>
          </View>

          {/* Resumen de datos enviados */}
          <View className="rounded-2xl border border-slate-200 bg-white p-4 gap-2.5">
            <Text className="text-xs font-bold uppercase tracking-wider text-[#8E98A8]">
              Datos Registrados
            </Text>
            <View className="flex-row justify-between py-1 border-b border-slate-100">
              <Text className="text-xs text-slate-500">Vehículo</Text>
              <Text className="text-xs font-semibold text-slate-800">
                {application.vehicle_type === 'motorcycle'
                  ? '🛵 Moto'
                  : application.vehicle_type === 'bicycle'
                    ? '🚲 Bicicleta'
                    : '🚗 Auto'}
              </Text>
            </View>
            <View className="flex-row justify-between py-1 border-b border-slate-100">
              <Text className="text-xs text-slate-500">DNI</Text>
              <Text className="text-xs font-semibold text-slate-800">{application.dni}</Text>
            </View>
            {application.vehicle_plate && (
              <View className="flex-row justify-between py-1 border-b border-slate-100">
                <Text className="text-xs text-slate-500">Placa</Text>
                <Text className="text-xs font-semibold text-slate-800">
                  {application.vehicle_plate}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between py-1">
              <Text className="text-xs text-slate-500">Fecha de postulación</Text>
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
              Modificar datos de la solicitud
            </Text>
          </Pressable>
        </View>
      );
    }

    if (application.status === 'approved') {
      return (
        <View className="items-center rounded-2xl bg-emerald-50 p-6 border border-emerald-200 gap-3">
          <Text className="text-5xl">🎉</Text>
          <View className="rounded-full bg-emerald-100 px-3 py-1">
            <Text className="text-xs font-bold text-emerald-800">¡Postulación Aprobada!</Text>
          </View>
          <Text className="text-center text-sm font-semibold text-slate-800">
            Ya eres parte de la flota de repartidores
          </Text>
          <Text className="text-center text-xs text-slate-600">
            Tu cuenta tiene permisos de conductor activos. Si aún estás en la vista de cliente,
            cierra sesión o reinicia la app para acceder al panel de repartidor.
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
              Observaciones del Administrador:
            </Text>
            <Text className="mt-1 text-center text-xs text-red-700 font-medium">
              {application.rejection_reason || 'Por favor verifica tus datos e inténtalo nuevamente.'}
            </Text>
          </View>

          <Pressable
            onPress={() => setIsEditing(true)}
            className="items-center justify-center rounded-2xl bg-primary py-3.5 active:opacity-80"
          >
            <Text className="text-sm font-bold text-white">
              Corregir datos y volver a enviar
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
                {application && !isEditing ? 'Estado de tu Postulación' : 'Trabaja como Repartidor'}
              </Text>
              <Text className="text-xs text-[#8E98A8]">
                {application && !isEditing
                  ? 'Revisa el estado de tu solicitud de repartidor'
                  : 'Únete a nuestra flota y genera ingresos'}
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

                {/* Nombre */}
                <View className="gap-1">
                  <Text className="text-xs font-semibold text-[#1C2433]">
                    Nombre completo *
                  </Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Tu nombre y apellidos"
                    placeholderTextColor="#94A3B8"
                    className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#1C2433]"
                  />
                </View>

                {/* DNI y Fecha de Nacimiento en fila */}
                <View className="flex-row gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-xs font-semibold text-[#1C2433]">DNI *</Text>
                    <TextInput
                      value={dni}
                      onChangeText={setDni}
                      placeholder="8 dígitos"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={10}
                      className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#1C2433]"
                    />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="text-xs font-semibold text-[#1C2433]">
                      F. Nacimiento *
                    </Text>
                    <TextInput
                      value={birthDate}
                      onChangeText={setBirthDate}
                      placeholder="AAAA-MM-DD"
                      placeholderTextColor="#94A3B8"
                      maxLength={10}
                      className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#1C2433]"
                    />
                  </View>
                </View>

                {/* Teléfono y Correo */}
                <View className="flex-row gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-xs font-semibold text-[#1C2433]">Teléfono *</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="987654321"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#1C2433]"
                    />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="text-xs font-semibold text-[#1C2433]">Correo</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Opcional"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#1C2433]"
                    />
                  </View>
                </View>

                {/* Selector de Vehículo */}
                <View className="gap-1.5 pt-1">
                  <Text className="text-xs font-semibold text-[#1C2433]">
                    Tipo de Vehículo *
                  </Text>
                  <View className="flex-row gap-2">
                    {VEHICLE_OPTIONS.map((opt) => {
                      const selected = vehicleType === opt.type;
                      return (
                        <Pressable
                          key={opt.type}
                          onPress={() => setVehicleType(opt.type)}
                          className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl py-2.5 border ${
                            selected
                              ? 'border-primary bg-primary/10'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <Text className="text-base">{opt.icon}</Text>
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

                {/* Campos de Vehículo de Motor */}
                {vehicleType !== 'bicycle' && (
                  <View className="gap-2.5 rounded-2xl bg-slate-50 p-3 border border-slate-200">
                    <Text className="text-[11px] font-bold uppercase text-[#8E98A8]">
                      Datos del Vehículo ({vehicleType === 'motorcycle' ? 'Moto' : 'Auto'})
                    </Text>
                    <View className="flex-row gap-2.5">
                      <View className="flex-1 gap-1">
                        <Text className="text-[11px] font-medium text-slate-600">
                          Placa *
                        </Text>
                        <TextInput
                          value={vehiclePlate}
                          onChangeText={setVehiclePlate}
                          placeholder="ABC-123"
                          placeholderTextColor="#94A3B8"
                          autoCapitalize="characters"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#1C2433]"
                        />
                      </View>
                      <View className="flex-1 gap-1">
                        <Text className="text-[11px] font-medium text-slate-600">
                          N° Licencia
                        </Text>
                        <TextInput
                          value={licenseNumber}
                          onChangeText={setLicenseNumber}
                          placeholder="Opcional"
                          placeholderTextColor="#94A3B8"
                          autoCapitalize="characters"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#1C2433]"
                        />
                      </View>
                    </View>
                    <View className="gap-1">
                      <Text className="text-[11px] font-medium text-slate-600">
                        Marca / Modelo
                      </Text>
                      <TextInput
                        value={vehicleBrand}
                        onChangeText={setVehicleBrand}
                        placeholder="Ej: Honda Wave 110"
                        placeholderTextColor="#94A3B8"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#1C2433]"
                      />
                    </View>
                  </View>
                )}

                {/* Contacto de Emergencia */}
                <View className="gap-2 rounded-2xl bg-slate-50 p-3 border border-slate-200">
                  <Text className="text-[11px] font-bold uppercase text-[#8E98A8]">
                    Contacto de Emergencia (Opcional)
                  </Text>
                  <View className="flex-row gap-2.5">
                    <View className="flex-1 gap-1">
                      <TextInput
                        value={emergencyName}
                        onChangeText={setEmergencyName}
                        placeholder="Nombre familiar"
                        placeholderTextColor="#94A3B8"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#1C2433]"
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <TextInput
                        value={emergencyPhone}
                        onChangeText={setEmergencyPhone}
                        placeholder="Teléfono"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#1C2433]"
                      />
                    </View>
                  </View>
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
                        {application ? 'Actualizar Postulación' : 'Enviar Postulación'}
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
