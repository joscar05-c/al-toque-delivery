import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

const CATEGORY_ICONS: Record<string, ComponentProps<typeof Ionicons>['name']> = {
  todas: 'grid-outline',
  pollos: 'flame-outline',
  pollo: 'flame-outline',
  pizza: 'pizza-outline',
  hamburguesas: 'fast-food-outline',
  hamburguesa: 'fast-food-outline',
  bebidas: 'cafe-outline',
  postres: 'ice-cream-outline',
  chifa: 'restaurant-outline',
};

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
      className="mr-4 w-[72px] items-center active:opacity-70"
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View
        className={`h-[68px] w-[68px] items-center justify-center rounded-full ${
          selected ? 'bg-primary/15' : 'bg-[#FFF7E6]'
        }`}
      >
        <Ionicons
          name={CATEGORY_ICONS[label.trim().toLocaleLowerCase()] ?? 'restaurant-outline'}
          size={30}
          color={selected ? '#F29F30' : '#1C2433'}
        />
      </View>
      <Text
        className={`mt-2 text-center text-sm font-medium ${
          selected ? 'text-primary' : 'text-[#1C2433]'
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
