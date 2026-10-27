import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect } from 'react';

import { getDriverActiveStatus, saveDriverLocation } from '@/lib/driverLocations';
import { useAuthStore } from '@/store/authStore';
import { useDriverStore } from '@/store/driverStore';

/** Tabs del repartidor. El guard de sesión/rol vive en (driver)/_layout.tsx. */
export default function DriverTabsLayout() {
  const driverId = useAuthStore((state) => state.session?.user.id);
  const isOnline = useDriverStore((state) => state.isOnline);
  const setIsOnline = useDriverStore((state) => state.setIsOnline);
  const setCoords = useDriverStore((state) => state.setCoords);

  // Carga inicial del estado online del repartidor
  useEffect(() => {
    if (!driverId) return;
    getDriverActiveStatus(driverId)
      .then((active) => setIsOnline(active))
      .catch((err) => console.warn('[driver-status] Error obteniendo estado:', err));
  }, [driverId, setIsOnline]);

  useEffect(() => {
    if (!driverId) return;

    let disposed = false;
    let subscription: Location.LocationSubscription | null = null;
    let writeQueue = Promise.resolve();

    const startTracking = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted || disposed) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 8_000,
          distanceInterval: 8,
        },
        ({ coords }) => {
          if (disposed) return;
          // Actualiza coordenadas en memoria para la UI del mapa
          setCoords({
            latitude: coords.latitude,
            longitude: coords.longitude,
            heading: coords.heading,
            speed: coords.speed,
            accuracy: coords.accuracy,
          });

          // Solo sincroniza con base de datos si el repartidor está en línea
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
  }, [driverId, setCoords]);


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
