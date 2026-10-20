import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  DriverApplicationModal,
} from '@/components/profile/DriverApplicationModal';
import {
  EditProfileModal,
} from '@/components/profile/EditProfileModal';
import {
  RestaurantApplicationModal,
} from '@/components/profile/RestaurantApplicationModal';
import {
  fetchUserDriverApplication,
  fetchUserRestaurantApplication,
} from '@/lib/profile';
import { useAuthStore } from '@/store/authStore';
import type { DriverApplication, RestaurantApplication, RoleName } from '@delivery/shared';

const ROLE_CONFIG: Record<
  RoleName,
  { label: string; bg: string; text: string; icon: string }
> = {
  client: { label: 'Cliente', bg: 'bg-primary/10', text: 'text-primary', icon: 'person' },
  driver: { label: 'Repartidor', bg: 'bg-emerald-100', text: 'text-emerald-800', icon: 'bicycle' },
  restaurant_owner: {
    label: 'Restaurante',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    icon: 'restaurant',
  },
  admin: { label: 'Administrador', bg: 'bg-purple-100', text: 'text-purple-800', icon: 'shield' },
};

export function ProfileScreen() {
  const { session, profile, signOut: signOutStore } = useAuthStore();

  const [driverApp, setDriverApp] = useState<DriverApplication | null>(null);
  const [restaurantApp, setRestaurantApp] = useState<RestaurantApplication | null>(null);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Estados de modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);

  const userId = session?.user.id;

  const loadApplications = useCallback(async (uid: string) => {
    try {
      const [dApp, rApp] = await Promise.all([
        fetchUserDriverApplication(uid),
        fetchUserRestaurantApplication(uid),
      ]);
      setDriverApp(dApp);
      setRestaurantApp(rApp);
    } catch (e) {
      console.warn('[profile] Error cargando solicitudes:', e);
    } finally {
      setIsLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadApplications(userId);
  }, [userId, loadApplications]);

  const onRefresh = async () => {
    if (!userId) return;
    setIsRefreshing(true);
    await Promise.all([
      useAuthStore.getState().refreshProfile(),
      loadApplications(userId),
    ]);
    setIsRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar tu sesión en este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
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
      `Hola Al Toque Delivery, necesito ayuda con mi cuenta de usuario (${profile?.phone ?? ''}).`,
    );
    const whatsappUrl = `https://wa.me/51987654321?text=${message}`;
    Linking.canOpenURL(whatsappUrl).then((supported) => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Alert.alert(
          'Atención al Cliente',
          'Puedes escribirnos por WhatsApp al +51 987 654 321 o enviarnos un correo a contacto@altoquedelivery.com.',
        );
      }
    });
  };

  const name = profile?.name ?? 'Usuario';
  const role = (profile?.roles?.name as RoleName) ?? 'client';
  const roleCfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.client;

  return (
    <ScrollView
      className="flex-1 bg-[#F8F9FA]"
      contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#F29F30"
          colors={['#F29F30']}
        />
      }
    >
      {/* 1. Header Card Principal */}
      <View className="items-center rounded-3xl bg-white px-5 py-6 shadow-sm border border-slate-100">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-[#FFF7E6] border-2 border-primary/20">
          <Text className="text-3xl font-black text-primary">
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text className="mt-3 text-xl font-bold text-[#1C2433] text-center">
          {name}
        </Text>

        {/* Teléfono verificado */}
        <View className="mt-1 flex-row items-center gap-1.5">
          <Ionicons name="call-outline" size={13} color="#8E98A8" />
          <Text className="text-xs text-[#8E98A8]">
            {profile?.phone ?? 'Sin teléfono'}
          </Text>
          <View className="flex-row items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 ml-1">
            <Ionicons name="checkmark-circle" size={11} color="#10B981" />
            <Text className="text-[10px] font-bold text-emerald-700">Verificado</Text>
          </View>
        </View>

        {/* Correo (si tiene) */}
        {profile?.email && (
          <View className="mt-1 flex-row items-center gap-1.5">
            <Ionicons name="mail-outline" size={13} color="#8E98A8" />
            <Text className="text-xs text-[#8E98A8]">{profile.email}</Text>
          </View>
        )}

        {/* Badge de Rol y Botón Editar */}
        <View className="mt-4 flex-row items-center gap-2.5">
          <View className={`rounded-full px-3 py-1 ${roleCfg.bg}`}>
            <Text className={`text-xs font-bold ${roleCfg.text}`}>
              {roleCfg.label}
            </Text>
          </View>

          <Pressable
            onPress={() => setShowEditModal(true)}
            className="flex-row items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 active:opacity-70"
          >
            <Ionicons name="pencil-outline" size={12} color="#1C2433" />
            <Text className="text-xs font-semibold text-[#1C2433]">Editar datos</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Sección Mi Cuenta y Actividad */}
      <View className="mt-5">
        <Text className="mb-2.5 px-1 text-xs font-bold uppercase tracking-wider text-[#8E98A8]">
          Mi Cuenta
        </Text>
        <View className="rounded-3xl bg-white px-4 py-1 shadow-sm border border-slate-100">
          <MenuRow
            icon="location-outline"
            title="Mis Direcciones de Entrega"
            subtitle="Gestiona tus casas, trabajos y ubicaciones"
            onPress={() => router.push('/(client)/addresses')}
          />
          <MenuRow
            icon="receipt-outline"
            title="Mis Pedidos"
            subtitle="Revisa el estado de tus compras anteriores"
            isLast
            onPress={() => router.push('/(client)/(tabs)/orders')}
          />
        </View>
      </View>

      {/* 3. Sección Oportunidades & Negocios (Postulaciones) */}
      <View className="mt-5">
        <Text className="mb-2.5 px-1 text-xs font-bold uppercase tracking-wider text-[#8E98A8]">
          Oportunidades & Negocios
        </Text>
        <View className="rounded-3xl bg-white px-4 py-2 shadow-sm border border-slate-100 gap-1">
          {/* Tarjeta Repartidor */}
          {role === 'driver' ? (
            <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
                  <Text className="text-lg">🛵</Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-[#1C2433]">
                    Modo Repartidor Activo
                  </Text>
                  <Text className="text-xs text-emerald-700 font-medium">
                    Tienes habilitada la flota de entregas
                  </Text>
                </View>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
          ) : (
            <ApplicationMenuRow
              icon="🛵"
              title="Trabaja como Repartidor"
              defaultSubtitle="Genera ingresos entregando pedidos en tu ciudad"
              applicationStatus={driverApp?.status}
              rejectionReason={driverApp?.rejection_reason}
              onPress={() => setShowDriverModal(true)}
            />
          )}

          {/* Tarjeta Restaurante */}
          {role === 'restaurant_owner' ? (
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
                  <Text className="text-lg">🏪</Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-[#1C2433]">
                    Restaurante Afiliado
                  </Text>
                  <Text className="text-xs text-amber-700 font-medium">
                    Gestiona tu menú y pedidos desde el Panel Web
                  </Text>
                </View>
              </View>
              <Ionicons name="storefront" size={18} color="#F29F30" />
            </View>
          ) : (
            <ApplicationMenuRow
              icon="🏪"
              title="Registra tu Restaurante"
              defaultSubtitle="Vende tus platos a miles de clientes locales"
              applicationStatus={restaurantApp?.status}
              rejectionReason={restaurantApp?.admin_notes}
              isLast
              onPress={() => setShowRestaurantModal(true)}
            />
          )}
        </View>
      </View>

      {/* 4. Sección Ayuda y Soporte */}
      <View className="mt-5">
        <Text className="mb-2.5 px-1 text-xs font-bold uppercase tracking-wider text-[#8E98A8]">
          Ayuda y Soporte
        </Text>
        <View className="rounded-3xl bg-white px-4 py-1 shadow-sm border border-slate-100">
          <MenuRow
            icon="logo-whatsapp"
            iconColor="#10B981"
            title="Centro de Ayuda / WhatsApp"
            subtitle="Soporte directo con nuestro equipo"
            onPress={handleSupportContact}
          />
          <MenuRow
            icon="document-text-outline"
            title="Términos y Privacidad"
            subtitle="Políticas de uso de Al Toque Delivery"
            isLast
            onPress={() => {
              Alert.alert(
                'Al Toque Delivery',
                'Versión 1.0.0\n\nAplicación de delivery de comida y comercio local para Jaén, Bagua y Chachapoyas.',
              );
            }}
          />
        </View>
      </View>

      {/* 5. Botón Cerrar Sesión */}
      <Pressable
        onPress={handleSignOut}
        disabled={isSigningOut}
        className={`mt-6 flex-row items-center justify-center gap-2 rounded-2xl py-3.5 border border-red-200 bg-red-50 active:bg-red-100`}
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

      <Text className="mt-4 text-center text-[11px] text-[#8E98A8]">
        Al Toque Delivery • v1.0.0
      </Text>

      {/* Modales Bottom-Sheet */}
      {userId && (
        <>
          <EditProfileModal
            visible={showEditModal}
            onClose={() => setShowEditModal(false)}
            userId={userId}
            initialName={profile?.name ?? ''}
            initialEmail={profile?.email ?? null}
            phone={profile?.phone ?? null}
            onUpdated={(newName, newEmail) => {
              // El store se refresca automáticamente dentro de updateUserProfileData
            }}
          />

          <DriverApplicationModal
            visible={showDriverModal}
            onClose={() => setShowDriverModal(false)}
            userId={userId}
            initialFullName={profile?.name ?? ''}
            initialPhone={profile?.phone ?? ''}
            initialEmail={profile?.email ?? null}
            application={driverApp}
            onApplicationUpdated={(app) => setDriverApp(app)}
          />

          <RestaurantApplicationModal
            visible={showRestaurantModal}
            onClose={() => setShowRestaurantModal(false)}
            userId={userId}
            initialOwnerName={profile?.name ?? ''}
            initialPhone={profile?.phone ?? ''}
            initialEmail={profile?.email ?? null}
            application={restaurantApp}
            onApplicationUpdated={(app) => setRestaurantApp(app)}
          />
        </>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Componentes Auxiliares de Fila
// ---------------------------------------------------------------------------

function MenuRow({
  icon,
  iconColor = '#F29F30',
  title,
  subtitle,
  isLast = false,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  title: string;
  subtitle: string;
  isLast?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between py-3.5 active:opacity-70 ${
        isLast ? '' : 'border-b border-slate-100'
      }`}
    >
      <View className="flex-1 flex-row items-center gap-3 pr-2">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-[#1C2433]">{title}</Text>
          <Text className="text-xs text-[#8E98A8] leading-4" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </Pressable>
  );
}

function ApplicationMenuRow({
  icon,
  title,
  defaultSubtitle,
  applicationStatus,
  rejectionReason,
  isLast = false,
  onPress,
}: {
  icon: string;
  title: string;
  defaultSubtitle: string;
  applicationStatus?: 'draft' | 'pending' | 'approved' | 'rejected' | null;
  rejectionReason?: string | null;
  isLast?: boolean;
  onPress: () => void;
}) {
  const renderStatus = () => {
    if (!applicationStatus) {
      return (
        <Text className="text-xs text-[#8E98A8] leading-4" numberOfLines={1}>
          {defaultSubtitle}
        </Text>
      );
    }

    if (applicationStatus === 'pending') {
      return (
        <View className="flex-row items-center gap-1 mt-0.5">
          <View className="rounded-full bg-amber-100 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-amber-800">
              ⏳ Solicitud en revisión
            </Text>
          </View>
        </View>
      );
    }

    if (applicationStatus === 'approved') {
      return (
        <View className="flex-row items-center gap-1 mt-0.5">
          <View className="rounded-full bg-emerald-100 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-emerald-800">
              ✅ Aprobada
            </Text>
          </View>
        </View>
      );
    }

    if (applicationStatus === 'rejected') {
      return (
        <View className="flex-row items-center gap-1 mt-0.5">
          <View className="rounded-full bg-red-100 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-red-800">
              ⚠️ Requiere atención
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between py-3.5 active:opacity-70 ${
        isLast ? '' : 'border-b border-slate-100'
      }`}
    >
      <View className="flex-1 flex-row items-center gap-3 pr-2">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF7E6] border border-amber-100">
          <Text className="text-lg">{icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-[#1C2433]">{title}</Text>
          {renderStatus()}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </Pressable>
  );
}
