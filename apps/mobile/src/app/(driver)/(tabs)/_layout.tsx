import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect } from 'react';

import { saveDriverLocation } from '@/lib/driverLocations';
import { useAuthStore } from '@/store/authStore';

/** Tabs del repartidor. El guard de sesión/rol vive en (driver)/_layout.tsx. */
export default function DriverTabsLayout() {
  const driverId = useAuthStore((state) => state.session?.user.id);

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
          timeInterval: 10_000,
          distanceInterval: 10,
        },
        ({ coords }) => {
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
              });
            })
            .catch((error: unknown) => {
              console.warn('[driver-location] No se pudo guardar:', error);
            });
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
  }, [driverId]);

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
