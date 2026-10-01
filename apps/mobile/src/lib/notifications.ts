import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/** Solicita permisos y devuelve token Expo solo en dispositivos físicos. */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
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

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const response = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return response.data;
}

/** Registra o token para el usuario autenticado; el índice único evita duplicados. */
export async function registerDeviceTokenForUser(userId: string): Promise<void> {
  const token = await registerForPushNotificationsAsync();
  if (!token || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;

  const { error } = await supabase.from('device_tokens').upsert(
    {
      user_id: userId,
      token,
      platform: Platform.OS,
      isActive: true,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,token' },
  );

  if (error) throw error;
}
