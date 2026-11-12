import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import type { NotificationRow } from '@delivery/shared';

export const ANDROID_ORDERS_CHANNEL_ID = 'al-toque-orders';

let handlerConfigured = false;
let currentDeviceToken: string | null = null;

/**
 * Configura el comportamiento de notificaciones en primer plano (foreground).
 * Debe invocarse al iniciar la aplicación.
 */
export function configurePushNotifications(): void {
  if (handlerConfigured || Platform.OS === 'web') return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Solicita permisos y obtiene el token nativo FCM (vía google-services.json / Firebase)
 * con respaldo a Expo Push Token si existiera projectId configurado.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
    return null;
  }

  configurePushNotifications();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_ORDERS_CHANNEL_ID, {
      name: 'Pedidos y Entregas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F29F30',
      sound: 'default',
    });
  }

  let permissions = await Notifications.getPermissionsAsync();
  const isProvisional =
    Platform.OS === 'ios' &&
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!permissions.granted && !isProvisional) {
    permissions = await Notifications.requestPermissionsAsync();
  }

  const isAuthorized =
    permissions.granted ||
    (Platform.OS === 'ios' &&
      permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
  if (!isAuthorized) return null;

  // 1. Preferir token nativo FCM (compatible con envío directo desde Supabase Edge Function -> FCM HTTP v1)
  try {
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    if (typeof devicePushToken.data === 'string' && devicePushToken.data.trim().length > 0) {
      currentDeviceToken = devicePushToken.data.trim();
      return currentDeviceToken;
    }
  } catch (nativeTokenError) {
    console.warn('[push] getDevicePushTokenAsync falló, intentando fallback Expo:', nativeTokenError);
  }

  // 2. Fallback a Expo Push Token si existe projectId de EAS
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    return null;
  }

  const response = await Notifications.getExpoPushTokenAsync({ projectId });
  currentDeviceToken = response.data;
  return currentDeviceToken;
}

/** Registra o actualiza el token del dispositivo para el usuario autenticado. */
export async function registerDeviceTokenForUser(userId: string): Promise<void> {
  const token = await registerForPushNotificationsAsync();
  if (!token || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;

  const nowIso = new Date().toISOString();
  const { error } = await supabase.from('device_tokens').upsert(
    {
      user_id: userId,
      token,
      platform: Platform.OS,
      deviceInfo: {
        brand: Device.brand ?? null,
        modelName: Device.modelName ?? null,
        osName: Device.osName ?? Platform.OS,
        osVersion: Device.osVersion ?? null,
      },
      isActive: true,
      last_used_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: 'user_id,token' },
  );

  if (error) throw error;
}

/**
 * Desactiva el token del dispositivo actual antes de cerrar sesión para evitar
 * enviar notificaciones push a una cuenta que ya cerró sesión en el teléfono.
 */
export async function deactivateDeviceTokenForUser(userId: string): Promise<void> {
  if (!userId || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;

  try {
    const tokenToDeactivate = currentDeviceToken;
    let query = supabase
      .from('device_tokens')
      .update({
        isActive: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (tokenToDeactivate) {
      query = query.eq('token', tokenToDeactivate);
    } else {
      query = query.eq('platform', Platform.OS);
    }

    await query;
  } catch (error) {
    console.warn('[push] No se pudo desactivar el token al cerrar sesión:', error);
  }
}

/** Obtiene el historial de notificaciones del usuario (más recientes primero). */
export async function fetchUserNotifications(
  userId: string,
  limit = 50,
): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

/** Cuenta cuántas notificaciones sin leer tiene el usuario. */
export async function fetchUnreadNotificationsCount(
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
}

/** Marca una notificación individual como leída. */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

/** Marca todas las notificaciones pendientes del usuario como leídas. */
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}
