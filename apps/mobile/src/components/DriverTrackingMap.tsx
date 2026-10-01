import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { View } from 'react-native';

interface DriverTrackingMapProps {
  latitude: number;
  longitude: number;
}

export function DriverTrackingMap({ latitude, longitude }: DriverTrackingMapProps) {
  return (
    <MapView
      style={{ height: 250, width: '100%' }}
      region={{
        latitude,
        longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }}
      showsUserLocation={false}
      showsCompass
      toolbarEnabled={false}
    >
      <Marker coordinate={{ latitude, longitude }} title="Repartidor">
        <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-primary shadow-md">
          <Ionicons name="bicycle" size={23} color="#fff" />
        </View>
      </Marker>
    </MapView>
  );
}
