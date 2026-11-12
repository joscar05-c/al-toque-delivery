import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';

import { EditProfileModal } from '@/components/profile/EditProfileModal';
import {
  startBackgroundDriverTracking,
  stopBackgroundDriverTracking,
} from '@/lib/backgroundLocation';
import {
  saveDriverLocation,
  setDriverActiveStatus,
} from '@/lib/driverLocations';
import {
  fetchDriverFullProfile,
  type DriverFullProfile,
} from '@/lib/driverProfile';
import { formatPrice } from '@/lib/format';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { useAuthStore } from '@/store/authStore';
import { useDriverStore } from '@/store/driverStore';

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: '🛵 Motocicleta',
  bicycle: '🚲 Bicicleta',
  car: '🚗 Automóvil',
};

export default function DriverProfileScreen() {
  const { session, profile, signOut: signOutStore } = useAuthStore();
  const isOnline = useDriverStore((state) => state.isOnline);
  const setIsOnline = useDriverStore((state) => state.setIsOnline);
  const backgroundTrackingActive = useDriverStore(
    (state) => state.backgroundTrackingActive,
  );
  const driverCoords = useDriverStore((state) => state.coords);

  const [driverInfo, setDriverInfo] = useState<DriverFullProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingOnline, setIsUpdatingOnline] = useState(false);
  const [isEnablingBg, setIsEnablingBg] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const driverId = session?.user.id;
  const unreadNotifications = useUnreadNotificationsCount(driverId);

  const loadDriverProfile = useCallback(async (uid: string) => {
    try {
      const info = await fetchDriverFullProfile(uid);
      setDriverInfo(info);
    } catch (error) {
      console.warn('[driver-profile] Error cargando perfil:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!driverId) return;
    let cancelled = false;

    fetchDriverFullProfile(driverId)
      .then((info) => {
        if (!cancelled) setDriverInfo(info);
      })
      .catch((error) => {
        if (!cancelled) console.warn('[driver-profile] Error cargando perfil:', error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [driverId]);

  const onRefresh = async () => {
    if (!driverId) return;
    setIsRefreshing(true);
    await Promise.all([
      useAuthStore.getState().refreshProfile(),
      loadDriverProfile(driverId),
    ]);
    setIsRefreshing(false);
  };

  const handleToggleOnline = async (nextValue: boolean) => {
    if (!driverId || isUpdatingOnline) return;
    setIsUpdatingOnline(true);
    try {
      setIsOnline(nextValue);
      await setDriverActiveStatus(driverId, nextValue);
      if (nextValue) {
        if (driverCoords) {
          await saveDriverLocation({
            driverId,
            latitude: driverCoords.latitude,
            longitude: driverCoords.longitude,
            heading: driverCoords.heading,
            speed: driverCoords.speed,
            accuracy: driverCoords.accuracy,
            isActive: true,
          });
        }
        await startBackgroundDriverTracking(driverId, {
          promptPermission: false,
        });
      } else {
        await stopBackgroundDriverTracking();
      }
    } catch {
      setIsOnline(!nextValue);
      Alert.alert(
        'Error',
        'No se pudo actualizar tu estado de disponibilidad.',
      );
    } finally {
      setIsUpdatingOnline(false);
    }
  };

  const handleEnableBackgroundGps = async () => {
    if (!driverId || isEnablingBg) return;
    setIsEnablingBg(true);
    try {
      const started = await startBackgroundDriverTracking(driverId, {
        promptPermission: true,
      });
      if (!started) {
        Alert.alert(
          'Permiso de ubicación continua',
          'Para seguir transmitiendo tu ubicación con la app minimizada, permite el acceso a ubicación "Todo el tiempo" en la configuración del sistema.',
          [
            { text: 'Ahora no', style: 'cancel' },
            { text: 'Abrir Ajustes', onPress: () => void Linking.openSettings() },
          ],
        );
      } else {
        Alert.alert(
          'GPS en 2do plano activo',
          'Tu posición se actualizará automáticamente mientras estés En Línea.',
        );
      }
    } finally {
      setIsEnablingBg(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      'Al cerrar sesión se detendrá el seguimiento GPS y dejarás de recibir entregas en este dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              if (driverId) {
                await setDriverActiveStatus(driverId, false).catch(() => {});
              }
              await stopBackgroundDriverTracking();
              await signOutStore();
            } catch (error) {
              setIsSigningOut(false);
              Alert.alert(
                'Error al salir',
                error instanceof Error ? error.message : 'Inténtalo de nuevo.',
              );
            }
          },
        },
      ],
    );
  };

  const handleSupportContact = () => {
    const message = encodeURIComponent(
      `Hola Al Toque Delivery, soy repartidor (${profile?.name ?? ''}, ${profile?.phone ?? ''}) y necesito soporte.`,
    );
    const whatsappUrl = `https://wa.me/51987654321?text=${message}`;
    void Linking.canOpenURL(whatsappUrl).then((supported) => {
      if (supported) {
        void Linking.openURL(whatsappUrl);
      } else {
        Alert.alert(
          'Soporte Flota Al Toque',
          'Escríbenos por WhatsApp al +51 987 654 321 o a contacto@altoquedelivery.com.',
        );
      }
    });
  };

  const name = profile?.name ?? 'Repartidor';
  const dp = driverInfo?.profile;
  const isPlatform = driverInfo?.driverTypeCode !== 'restaurant_own';

  return (
    <ScrollView
      className="flex-1 bg-[#F8F9FA]"
      contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#208AEF"
          colors={['#208AEF']}
        />
      }
    >
      {/* 1. Cabecera del Repartidor */}
      <View className="items-center rounded-3xl border border-slate-100 bg-white px-5 py-6 shadow-sm">
        <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-primary/25 bg-blue-50">
          <Text className="text-3xl font-black text-primary">
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text className="mt-3 text-center text-xl font-bold text-[#1C2433]">
          {name}
        </Text>

        <View className="mt-1 flex-row items-center gap-1.5">
          <Ionicons name="call-outline" size={13} color="#8E98A8" />
          <Text className="text-xs text-[#8E98A8]">
            {profile?.phone ?? 'Sin teléfono'}
          </Text>
          <View className="ml-1 flex-row items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5">
            <Ionicons name="checkmark-circle" size={11} color="#10B981" />
            <Text className="text-[10px] font-bold text-emerald-700">Verificado</Text>
          </View>
        </View>

        {profile?.email && (
          <View className="mt-1 flex-row items-center gap-1.5">
            <Ionicons name="mail-outline" size={13} color="#8E98A8" />
            <Text className="text-xs text-[#8E98A8]">{profile.email}</Text>
          </View>
        )}

        <View className="mt-4 flex-row flex-wrap items-center justify-center gap-2">
          <View
            className={`rounded-full px-3 py-1 ${
              isPlatform ? 'bg-blue-100' : 'bg-emerald-100'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                isPlatform ? 'text-blue-800' : 'text-emerald-800'
              }`}
            >
              {isPlatform ? '⚡ Red Al Toque' : '🛵 Flota Propia'}
            </Text>
          </View>

          <Pressable
            onPress={() => setShowEditModal(true)}
            className="flex-row items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 active:opacity-70"
          >
            <Ionicons name="pencil-outline" size={12} color="#1C2433" />
            <Text className="text-xs font-semibold text-[#1C2433]">
              Editar datos
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Estado Operativo y Tracking GPS */}
      <View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-bold text-slate-900">
              {isOnline ? 'En línea para entregas' : 'Desconectado'}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              {isOnline
                ? 'Tu ubicación en vivo se comparte con clientes y locales.'
                : 'Actívalo para aparecer disponible en tu flota.'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            disabled={isUpdatingOnline}
            trackColor={{ false: '#CBD5E1', true: '#10B981' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View className="flex-row items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
          <View className="flex-row items-center gap-2.5 flex-1 pr-2">
            <Ionicons
              name={backgroundTrackingActive ? 'radio' : 'navigate-circle-outline'}
              size={19}
              color={backgroundTrackingActive ? '#059669' : '#D97706'}
            />
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-800">
                {backgroundTrackingActive
                  ? 'GPS en segundo plano activo'
                  : 'GPS solo en primer plano'}
              </Text>
              <Text className="text-[11px] text-slate-500">
                {backgroundTrackingActive
                  ? 'Sigue transmitiendo incluso con pantalla bloqueada'
                  : 'Habilita "Todo el tiempo" para no cortar tu ruta'}
              </Text>
            </View>
          </View>
          {!backgroundTrackingActive && isOnline && (
            <Pressable
              onPress={() => void handleEnableBackgroundGps()}
              disabled={isEnablingBg}
              className="rounded-xl bg-amber-500 px-3 py-1.5 active:opacity-80"
            >
              {isEnablingBg ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-[11px] font-bold text-white">Activar</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* 3. Resumen de Actividad e Historial */}
      <View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-wider text-[#8E98A8]">
            Actividad de Entregas
          </Text>
          {isLoading && <ActivityIndicator size="small" color="#208AEF" />}
        </View>

        <View className="flex-row gap-2.5">
          <View className="flex-1 rounded-2xl bg-slate-50 p-3">
            <Text className="text-[11px] font-semibold text-slate-500">Hoy</Text>
            <Text className="mt-0.5 text-xl font-black text-slate-900">
              {driverInfo?.stats.deliveredToday ?? 0}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-slate-50 p-3">
            <Text className="text-[11px] font-semibold text-slate-500">Este mes</Text>
            <Text className="mt-0.5 text-xl font-black text-slate-900">
              {driverInfo?.stats.deliveredThisMonth ?? 0}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-slate-50 p-3">
            <Text className="text-[11px] font-semibold text-slate-500">Total</Text>
            <Text className="mt-0.5 text-xl font-black text-emerald-700">
              {driverInfo?.stats.totalDelivered ?? 0}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between rounded-2xl bg-blue-50/70 px-3.5 py-2.5">
          <Text className="text-xs font-semibold text-slate-700">
            Monto total entregado
          </Text>
          <Text className="text-sm font-extrabold text-primary">
            {formatPrice(driverInfo?.stats.totalDeliveredAmount ?? 0)}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/(driver)/notifications')}
          className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 active:bg-slate-50"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
              <Ionicons name="notifications-outline" size={19} color="#F29F30" />
            </View>
            <View>
              <Text className="text-sm font-bold text-slate-900">
                Mis Notificaciones
              </Text>
              <Text className="text-xs text-slate-500">
                Avisos de nuevos pedidos y asignaciones
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            {unreadNotifications > 0 && (
              <View className="rounded-full bg-primary px-2 py-0.5">
                <Text className="text-[11px] font-extrabold text-white">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(driver)/history')}
          className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 active:bg-slate-50"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <Ionicons name="time-outline" size={19} color="#208AEF" />
            </View>
            <View>
              <Text className="text-sm font-bold text-slate-900">
                Historial completo de entregas
              </Text>
              <Text className="text-xs text-slate-500">
                Consulta tus pedidos entregados y cancelados
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>
      </View>

      {/* 4. Perfil Técnico / Vehículo y Flota */}
      <View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm gap-2.5">
        <Text className="text-xs font-bold uppercase tracking-wider text-[#8E98A8]">
          Modalidad y Vehículo
        </Text>

        <View className="flex-row items-center justify-between py-1">
          <Text className="text-xs text-slate-500">Modalidad asignada</Text>
          <Text className="text-xs font-bold text-slate-800">
            {driverInfo?.driverTypeLabel ?? 'Red Al Toque'}
          </Text>
        </View>

        {dp?.vehicle_type && (
          <View className="flex-row items-center justify-between py-1 border-t border-slate-100">
            <Text className="text-xs text-slate-500">Vehículo</Text>
            <Text className="text-xs font-semibold text-slate-800">
              {VEHICLE_LABELS[dp.vehicle_type] ?? dp.vehicle_type}
            </Text>
          </View>
        )}

        {dp?.vehicle_plate && (
          <View className="flex-row items-center justify-between py-1 border-t border-slate-100">
            <Text className="text-xs text-slate-500">Placa</Text>
            <Text className="text-xs font-bold uppercase text-slate-800">
              {dp.vehicle_plate}
            </Text>
          </View>
        )}

        {(dp?.vehicle_brand || dp?.vehicle_model) && (
          <View className="flex-row items-center justify-between py-1 border-t border-slate-100">
            <Text className="text-xs text-slate-500">Marca / Modelo</Text>
            <Text className="text-xs font-semibold text-slate-800">
              {[dp.vehicle_brand, dp.vehicle_model].filter(Boolean).join(' ')}
            </Text>
          </View>
        )}

        {dp?.license_number && (
          <View className="flex-row items-center justify-between py-1 border-t border-slate-100">
            <Text className="text-xs text-slate-500">Licencia</Text>
            <Text className="text-xs font-semibold text-slate-800">
              {dp.license_number}
            </Text>
          </View>
        )}

        {driverInfo && driverInfo.driverTypeCode === 'restaurant_own' && (
          <View className="mt-1 rounded-2xl bg-slate-50 p-3 gap-1.5">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Restaurantes Vinculados ({driverInfo.linkedRestaurants.length})
            </Text>
            {driverInfo.linkedRestaurants.length === 0 ? (
              <Text className="text-xs text-amber-700">
                Aún no estás vinculado a ningún restaurante. Un local debe agregarte en su Flota Propia.
              </Text>
            ) : (
              driverInfo.linkedRestaurants.map((rest) => (
                <View key={rest.id} className="flex-row items-center gap-2">
                  <Ionicons name="storefront-outline" size={14} color="#059669" />
                  <Text className="flex-1 text-xs font-semibold text-slate-800" numberOfLines={1}>
                    {rest.name} · {rest.address}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {/* 5. Soporte y Cerrar Sesión */}
      <View className="rounded-3xl border border-slate-100 bg-white px-4 py-1 shadow-sm">
        <Pressable
          onPress={handleSupportContact}
          className="flex-row items-center justify-between border-b border-slate-100 py-3.5 active:opacity-70"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <Ionicons name="logo-whatsapp" size={18} color="#10B981" />
            </View>
            <View>
              <Text className="text-sm font-semibold text-slate-900">
                Soporte para Repartidores
              </Text>
              <Text className="text-xs text-slate-500">
                Atención directa con coordinación
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert(
              'Al Toque Delivery · Repartidor',
              'Versión 1.0.5\n\nOperación logística local con Google Maps SDK y seguimiento GPS continuo.',
            )
          }
          className="flex-row items-center justify-between py-3.5 active:opacity-70"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <Ionicons name="document-text-outline" size={18} color="#64748B" />
            </View>
            <View>
              <Text className="text-sm font-semibold text-slate-900">
                Información de la App
              </Text>
              <Text className="text-xs text-slate-500">
                Versión, permisos GPS y términos
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>
      </View>

      <Pressable
        onPress={handleSignOut}
        disabled={isSigningOut}
        className="flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3.5 active:bg-red-100"
      >
        {isSigningOut ? (
          <ActivityIndicator color="#EF4444" size="small" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text className="text-sm font-bold text-red-600">Cerrar Sesión</Text>
          </>
        )}
      </Pressable>

      <View className="items-center gap-1.5 pb-2">
        <Image
          source={require('../../../../assets/images/logo.png')}
          style={{ width: 32, height: 32, borderRadius: 16 }}
          contentFit="contain"
        />
        <Text className="text-center text-[11px] text-[#8E98A8]">
          Al Toque Delivery • Modo Repartidor
        </Text>
      </View>

      {driverId && (
        <EditProfileModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          userId={driverId}
          initialName={profile?.name ?? ''}
          initialEmail={profile?.email ?? null}
          phone={profile?.phone ?? null}
          onUpdated={() => {
            void loadDriverProfile(driverId);
          }}
        />
      )}
    </ScrollView>
  );
}
