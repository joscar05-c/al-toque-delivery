import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect } from 'react';

import {
  isBackgroundDriverTrackingRunning,
  startBackgroundDriverTracking,
  stopBackgroundDriverTracking,
  syncBackgroundTrackingSession,
} from '@/lib/backgroundLocation';
import { getDriverActiveStatus, saveDriverLocation } from '@/lib/driverLocations';
import { useAuthStore } from '@/store/authStore';
import { useDriverStore } from '@/store/driverStore';

/** Tabs del repartidor. El guard de sesión/rol vive en (driver)/_layout.tsx. */
export default function DriverTabsLayout() {
  const driverId = useAuthStore((state) => state.session?.user.id);
  const isOnline = useDriverStore((state) => state.isOnline);
  const setIsOnline = useDriverStore((state) => state.setIsOnline);
  const setBackgroundTrackingActive = useDriverStore(
    (state) => state.setBackgroundTrackingActive,
  );
  const setCoords = useDriverStore((state) => state.setCoords);

  // Carga inicial del estado online del repartidor
  useEffect(() => {
    if (!driverId) return;
    getDriverActiveStatus(driverId)
      .then((active) => setIsOnline(active))
      .catch((err) => console.warn('[driver-status] Error obteniendo estado:', err));
  }, [driverId, setIsOnline]);

  // Sincroniza estado En Línea con el tracking GPS en segundo plano
  useEffect(() => {
    if (!driverId) {
      void stopBackgroundDriverTracking();
      return;
    }

    let cancelled = false;
    const syncBg = async () => {
      await syncBackgroundTrackingSession(driverId, isOnline);
      if (isOnline) {
        const active = await startBackgroundDriverTracking(driverId, {
          promptPermission: false,
        });
        if (!cancelled) {
          setBackgroundTrackingActive(active);
        }
      } else {
        await stopBackgroundDriverTracking();
        if (!cancelled) {
          setBackgroundTrackingActive(false);
        }
      }
    };

    void syncBg().catch((err) => {
      console.warn('[driver-bg-gps] Error sincronizando segundo plano:', err);
    });

    return () => {
      cancelled = true;
    };
  }, [driverId, isOnline, setBackgroundTrackingActive]);

  // Al salir del grupo de repartidor (p. ej. logout), detener tracking en segundo plano
  useEffect(() => {
    return () => {
      void stopBackgroundDriverTracking();
    };
  }, []);

  // Tracking en primer plano para refresco inmediato de UI y mapa
  useEffect(() => {
    if (!driverId) return;

    let disposed = false;
    let subscription: Location.LocationSubscription | null = null;
    let writeQueue = Promise.resolve();

    const startTracking = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted || disposed) return;

      const bgRunning = await isBackgroundDriverTrackingRunning();
      if (!disposed) setBackgroundTrackingActive(bgRunning);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 8_000,
          distanceInterval: 8,
        },
        ({ coords }) => {
          if (disposed) return;
          setCoords({
            latitude: coords.latitude,
            longitude: coords.longitude,
            heading: coords.heading,
            speed: coords.speed,
            accuracy: coords.accuracy,
          });

          if (useDriverStore.getState().isOnline) {
            writeQueue = writeQueue
              .then(async () => {
                if (disposed) return;
                await saveDriverLocation({
                  driverId,
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  heading: coords.heading,
                  speed: coords.speed,
                  accuracy: coords.accuracy,
                  isActive: true,
                });
              })
              .catch((error: unknown) => {
                console.warn('[driver-location] No se pudo guardar:', error);
              });
          }
        },
      );

      if (disposed) subscription.remove();
    };

    void startTracking().catch((error: unknown) => {
      console.warn('[driver-location] No se pudo iniciar GPS:', error);
    });

    return () => {
      disposed = true;
      subscription?.remove();
    };
  }, [driverId, setCoords, setBackgroundTrackingActive]);


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#208AEF',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Disponibles',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'flash' : 'flash-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'map' : 'map-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
