import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Platform, requireOptionalNativeModule } from 'expo-modules-core';
import type * as TaskManagerTypes from 'expo-task-manager';

import { saveDriverLocation } from '@/lib/driverLocations';
import { useDriverStore } from '@/store/driverStore';

export const DRIVER_LOCATION_TASK = 'al-toque-driver-background-location';
const TRACKING_SESSION_KEY = '@al_toque:driver_bg_tracking';

interface TrackingSession {
  driverId: string;
  isOnline: boolean;
}

interface LocationTaskPayload {
  locations?: Location.LocationObject[];
}

function getTaskManager(): typeof TaskManagerTypes | null {
  if (Platform.OS === 'web') return null;
  try {
    const nativeModule = requireOptionalNativeModule('ExpoTaskManager');
    if (!nativeModule) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-task-manager') as typeof TaskManagerTypes;
  } catch {
    return null;
  }
}

const TaskManager = getTaskManager();

if (TaskManager) {
  try {
    TaskManager.defineTask<LocationTaskPayload>(
      DRIVER_LOCATION_TASK,
      async ({ data, error }) => {
        if (error) {
          console.warn('[bg-location] Error en tarea GPS:', error.message);
          return;
        }

        const latest = data?.locations?.[data.locations.length - 1];
        if (!latest) return;

        try {
          const raw = await AsyncStorage.getItem(TRACKING_SESSION_KEY);
          if (!raw) return;

          const session = JSON.parse(raw) as Partial<TrackingSession>;
          if (!session.driverId || !session.isOnline) return;

          useDriverStore.getState().setCoords({
            latitude: latest.coords.latitude,
            longitude: latest.coords.longitude,
            heading: latest.coords.heading,
            speed: latest.coords.speed,
            accuracy: latest.coords.accuracy,
          });

          await saveDriverLocation({
            driverId: session.driverId,
            latitude: latest.coords.latitude,
            longitude: latest.coords.longitude,
            heading: latest.coords.heading,
            speed: latest.coords.speed,
            accuracy: latest.coords.accuracy,
            isActive: true,
          });
        } catch (taskErr) {
          console.warn('[bg-location] Error procesando ubicación:', taskErr);
        }
      },
    );
  } catch (err) {
    console.warn('[bg-location] No se pudo registrar la tarea en segundo plano:', err);
  }
}

export async function syncBackgroundTrackingSession(
  driverId: string | null,
  isOnline: boolean,
): Promise<void> {
  if (!driverId) {
    await AsyncStorage.removeItem(TRACKING_SESSION_KEY);
    return;
  }
  const payload: TrackingSession = { driverId, isOnline };
  await AsyncStorage.setItem(TRACKING_SESSION_KEY, JSON.stringify(payload));
}

export async function isBackgroundDriverTrackingRunning(): Promise<boolean> {
  if (!TaskManager) return false;
  try {
    return await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  } catch {
    return false;
  }
}

export async function startBackgroundDriverTracking(
  driverId: string,
  options?: { promptPermission?: boolean },
): Promise<boolean> {
  await syncBackgroundTrackingSession(driverId, true);

  if (!TaskManager) {
    useDriverStore.getState().setBackgroundTrackingActive(false);
    return false;
  }

  const fg = await Location.getForegroundPermissionsAsync();
  if (!fg.granted) {
    const requestedFg = options?.promptPermission
      ? await Location.requestForegroundPermissionsAsync()
      : fg;
    if (!requestedFg.granted) {
      useDriverStore.getState().setBackgroundTrackingActive(false);
      return false;
    }
  }

  let bg = await Location.getBackgroundPermissionsAsync();
  if (!bg.granted && options?.promptPermission) {
    bg = await Location.requestBackgroundPermissionsAsync();
  }

  if (!bg.granted) {
    useDriverStore.getState().setBackgroundTrackingActive(false);
    return false;
  }

  try {
    const alreadyRunning = await isBackgroundDriverTrackingRunning();
    if (!alreadyRunning) {
      await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10_000,
        distanceInterval: 15,
        deferredUpdatesInterval: 10_000,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Al Toque Repartidor En Línea',
          notificationBody: 'Compartiendo tu ubicación GPS durante tus entregas.',
          notificationColor: '#208AEF',
        },
      });
    }

    useDriverStore.getState().setBackgroundTrackingActive(true);
    return true;
  } catch (error) {
    console.warn('[bg-location] No se pudo iniciar ubicación en segundo plano:', error);
    useDriverStore.getState().setBackgroundTrackingActive(false);
    return false;
  }
}

export async function stopBackgroundDriverTracking(): Promise<void> {
  try {
    if (TaskManager) {
      const running = await isBackgroundDriverTrackingRunning();
      if (running) {
        await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
      }
    }
  } catch (error) {
    console.warn('[bg-location] Error deteniendo tarea GPS:', error);
  } finally {
    await AsyncStorage.removeItem(TRACKING_SESSION_KEY).catch(() => {});
    useDriverStore.getState().setBackgroundTrackingActive(false);
  }
}

