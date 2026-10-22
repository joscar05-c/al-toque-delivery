import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { formatPrice } from '@/lib/format';
import type { MenuItem } from '@delivery/shared';

interface PopularMenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onSelect: () => void;
  onAdd: () => void;
  onDecrement: () => void;
}

/** Tarjeta horizontal destacada; usa los mismos callbacks del menú y carrito. */
export function PopularMenuItemCard({
  item,
  quantity,
  onSelect,
  onAdd,
  onDecrement,
}: PopularMenuItemCardProps) {
  return (
    <View className="mr-3 w-44">
      <View className="relative overflow-hidden rounded-2xl bg-[#F4EEDF]">
        <Pressable
          onPress={onSelect}
          accessibilityRole="button"
          accessibilityLabel={`Ver ${item.name}`}
        >
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={{ width: '100%', height: 142 }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="h-[142px] items-center justify-center">
              <Ionicons name="fast-food-outline" size={38} color="#8E98A8" />
            </View>
          )}
        </Pressable>

        {quantity === 0 ? (
          <Pressable
            onPress={onAdd}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Agregar ${item.name}`}
            className="absolute bottom-2 right-2 h-9 w-9 items-center justify-center rounded-full bg-primary active:opacity-70"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View className="absolute bottom-2 right-2 flex-row items-center gap-2 rounded-full bg-primary px-2 py-1">
            <Pressable
              onPress={onDecrement}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${item.name}`}
            >
              <Ionicons name="remove" size={17} color="#FFFFFF" />
            </Pressable>
            <Text className="text-xs font-bold text-white">{quantity}</Text>
            <Pressable
              onPress={onAdd}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Agregar otro ${item.name}`}
            >
              <Ionicons name="add" size={17} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
      </View>

      <Pressable
        onPress={onSelect}
        accessibilityRole="button"
        accessibilityLabel={`Ver ${item.name}`}
        className="active:opacity-70"
      >
        <Text
          className="mt-2 text-base font-semibold leading-5 text-[#1C2433]"
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-[#10B981]">
            {formatPrice(item.price)}
          </Text>
          {item.description ? (
            <>
              <Text className="text-xs text-[#C4CAD3]">·</Text>
              <Text className="flex-1 text-xs text-[#8E98A8]" numberOfLines={1}>
                {item.description}
              </Text>
            </>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
