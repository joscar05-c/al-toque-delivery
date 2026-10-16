import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { formatPrice } from '@/lib/format';
import type { MenuItem } from '@delivery/shared';

interface MenuItemCardProps {
  item: MenuItem;
  /** Cantidad actual de este plato en el carrito (0 = no agregado). */
  quantity: number;
  onSelect: () => void;
  onAdd: () => void;
  onDecrement: () => void;
}

/** Fila de plato del menú con imagen, precio y control para armar el carrito. */
export function MenuItemCard({
  item,
  quantity,
  onSelect,
  onAdd,
  onDecrement,
}: MenuItemCardProps) {
  return (
    <View className="flex-row items-center gap-3 border-b border-[#F0F1F3] bg-white px-5 py-4">
      <Pressable
        onPress={onSelect}
        accessibilityRole="button"
        accessibilityLabel={`Ver ${item.name}`}
        className="flex-1 flex-row items-center gap-3 active:opacity-70"
      >
      <View className="h-[84px] w-[84px] overflow-hidden rounded-2xl bg-[#F3F4F6]">
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="fast-food-outline" size={30} color="#8E98A8" />
          </View>
        )}
      </View>

      <View className="flex-1 gap-1">
        <Text
          className="text-base font-semibold text-[#1C2433]"
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {item.description ? (
          <Text numberOfLines={1} className="text-xs text-[#8E98A8]">
            {item.description}
          </Text>
        ) : null}
        <Text className="mt-1 text-sm font-semibold text-primary">
          {formatPrice(item.price)}
        </Text>
      </View>
      </Pressable>

      <View className="w-10 items-end justify-center">
        {quantity === 0 ? (
          <Pressable
            onPress={onAdd}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Agregar ${item.name}`}
            className="h-9 w-9 items-center justify-center rounded-full bg-primary active:opacity-70"
          >
            <Ionicons name="add" size={21} color="#fff" />
          </Pressable>
        ) : (
          <View className="items-center gap-1 rounded-full bg-primary px-1 py-1">
            <Pressable
              onPress={onAdd}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Agregar otro ${item.name}`}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </Pressable>
            <Text className="text-xs font-bold text-white">{quantity}</Text>
            <Pressable
              onPress={onDecrement}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${item.name}`}
            >
              <Ionicons name="remove" size={18} color="#fff" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
