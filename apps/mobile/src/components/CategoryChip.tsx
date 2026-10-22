import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

const FALLBACK_CATEGORY_ICONS: Record<string, ComponentProps<typeof Ionicons>['name']> = {
  todas: 'grid-outline',
  pollos: 'flame-outline',
  pollo: 'flame-outline',
  polleria: 'flame-outline',
  pizza: 'pizza-outline',
  hamburguesas: 'fast-food-outline',
  hamburguesa: 'fast-food-outline',
  bebidas: 'cafe-outline',
  postres: 'ice-cream-outline',
  chifa: 'restaurant-outline',
};

// Regex para detectar emojis y caracteres pictográficos (soporta emojis compuestos)
const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

interface CategoryChipProps {
  label: string;
  icon?: string | null;
  selected: boolean;
  onPress: () => void;
}

/** Chip seleccionable para el carrusel horizontal de categorías. */
export function CategoryChip({ label, icon, selected, onPress }: CategoryChipProps) {
  const trimmedIcon = icon?.trim();

  const renderIcon = () => {
    // 1. Emoji configurado en panel admin (ej: 🍔, 🍗, 🍜, 🍕, 🍦, etc.)
    if (trimmedIcon && EMOJI_REGEX.test(trimmedIcon)) {
      return (
        <Text
          style={{
            fontSize: 28,
            textAlign: 'center',
            includeFontPadding: false,
          }}
        >
          {trimmedIcon}
        </Text>
      );
    }

    // 2. URL de imagen externa
    if (trimmedIcon && (trimmedIcon.startsWith('http://') || trimmedIcon.startsWith('https://'))) {
      return (
        <Image
          source={{ uri: trimmedIcon }}
          style={{ width: 28, height: 28 }}
          resizeMode="contain"
        />
      );
    }

    // 3. Icono de Ionicons explícito (ej: 'grid-outline' para Todas) o fallback por nombre
    const isKnownIonicon =
      trimmedIcon &&
      typeof Ionicons.glyphMap === 'object' &&
      trimmedIcon in Ionicons.glyphMap;

    const ioniconName: ComponentProps<typeof Ionicons>['name'] = isKnownIonicon
      ? (trimmedIcon as ComponentProps<typeof Ionicons>['name'])
      : FALLBACK_CATEGORY_ICONS[label.trim().toLocaleLowerCase()] ?? 'restaurant-outline';

    return (
      <Ionicons
        name={ioniconName}
        size={28}
        color={selected ? '#F29F30' : '#1C2433'}
      />
    );
  };

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
        {renderIcon()}
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
