import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { formatPrice } from '@/lib/format';
import type { MenuItem } from '@delivery/shared';

interface MenuItemCardProps {
  item: MenuItem;
  /** Cantidad actual de este plato en el carrito (0 = no agregado). */
  quantity: number;
  onAdd: () => void;
  onDecrement: () => void;
}

/** Fila de plato del menú con imagen, precio y control para armar el carrito. */
export function MenuItemCard({
  item,
  quantity,
  onAdd,
  onDecrement,
}: MenuItemCardProps) {
  return (
    <View className="flex-row gap-3 border-b border-slate-100 bg-white px-4 py-4">
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-slate-900">
          {item.name}
        </Text>
        {item.description && (
          <Text numberOfLines={2} className="text-sm leading-5 text-slate-500">
            {item.description}
          </Text>
        )}
        <Text className="mt-1 text-base font-bold text-primary">
          {formatPrice(item.price)}
        </Text>
      </View>

      <View className="w-28 gap-2">
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: 112, height: 96, borderRadius: 12 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-24 w-28 items-center justify-center rounded-xl bg-slate-100">
            <Ionicons name="fast-food-outline" size={28} color="#94A3B8" />
          </View>
        )}

        {quantity === 0 ? (
          <Pressable
            onPress={onAdd}
            className="flex-row items-center justify-center gap-1 rounded-full bg-primary py-2 active:opacity-80"
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text className="text-sm font-semibold text-white">Agregar</Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center justify-between rounded-full bg-primary px-1 py-1">
            <Pressable onPress={onDecrement} hitSlop={8} className="px-2">
              <Ionicons name="remove" size={18} color="#fff" />
            </Pressable>
            <Text className="text-sm font-bold text-white">{quantity}</Text>
            <Pressable onPress={onAdd} hitSlop={8} className="px-2">
              <Ionicons name="add" size={18} color="#fff" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
