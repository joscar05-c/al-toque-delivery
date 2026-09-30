import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

/** Tabs del repartidor. El guard de sesión/rol vive en (driver)/_layout.tsx. */
export default function DriverTabsLayout() {
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
