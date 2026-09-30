import { Pressable, Text } from 'react-native';

interface CategoryChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Chip seleccionable para el carrusel horizontal de categorías. */
export function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 rounded-full border px-4 py-2 ${
        selected
          ? 'border-primary bg-primary'
          : 'border-slate-200 bg-white active:bg-slate-100'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          selected ? 'text-white' : 'text-slate-600'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
