import MapView, { Marker } from 'react-native-maps';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AddressLocationPickerProps {
  coordinates: Coordinates;
  onCoordinatesChange: (coordinates: Coordinates) => void;
}

export function AddressLocationPicker({
  coordinates,
  onCoordinatesChange,
}: AddressLocationPickerProps) {
  return (
    <MapView
      style={{ height: 250, width: '100%' }}
      region={{
        ...coordinates,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }}
      showsUserLocation
      showsMyLocationButton
      toolbarEnabled={false}
    >
      <Marker
        coordinate={coordinates}
        draggable
        title="Dirección de entrega"
        onDragEnd={({ nativeEvent }) => onCoordinatesChange(nativeEvent.coordinate)}
      />
    </MapView>
  );
}
