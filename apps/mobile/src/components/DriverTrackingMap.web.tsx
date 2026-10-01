import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface DriverTrackingMapProps {
  latitude: number;
  longitude: number;
}

export function DriverTrackingMap({ latitude, longitude }: DriverTrackingMapProps) {
  return (
    <View className="h-[250px] items-center justify-center gap-2 bg-slate-100">
      <Ionicons name="bicycle" size={28} color="#208AEF" />
      <Text className="text-xs text-slate-500">
        {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </Text>
    </View>
  );
}
