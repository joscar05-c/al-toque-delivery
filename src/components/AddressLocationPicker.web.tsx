import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import type { Coordinates } from './AddressLocationPicker';

interface AddressLocationPickerProps {
  coordinates: Coordinates;
  onCoordinatesChange: (coordinates: Coordinates) => void;
}

export function AddressLocationPicker({ coordinates }: AddressLocationPickerProps) {
  return (
    <View className="h-[250px] items-center justify-center gap-2 bg-slate-100">
      <Ionicons name="location" size={28} color="#208AEF" />
      <Text className="text-sm font-medium text-slate-700">
        {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
      </Text>
    </View>
  );
}
