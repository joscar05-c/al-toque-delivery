import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { formatMinutes } from '@/lib/format';
import type { RestaurantWithCategory } from '@/lib/restaurants';

interface RestaurantCardProps {
  restaurant: RestaurantWithCategory;
}

/** Tarjeta de restaurante para la lista vertical del home. */
export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const categoryName = restaurant.restaurant_categories?.name;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/(client)/restaurant/[id]',
          params: { id: restaurant.id },
        })
      }
      className="mb-6 overflow-hidden rounded-2xl bg-white active:opacity-90"
    >
      {restaurant.image_url ? (
        <Image
          source={{ uri: restaurant.image_url }}
          style={{ width: '100%', height: 190 }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View className="h-[190px] w-full items-center justify-center bg-[#F3F4F6]">
          <Ionicons name="restaurant-outline" size={48} color="#8E98A8" />
        </View>
      )}

      <View className="gap-3 p-4">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-xl font-semibold text-[#1C2433]"
            numberOfLines={1}
          >
            {restaurant.name}
          </Text>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        </View>

        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <Text className="text-sm font-medium text-[#10B981]">Open</Text>
          {categoryName ? (
            <>
              <Text className="text-sm text-[#C4CAD3]">·</Text>
              <Text className="text-sm text-[#8E98A8]">{categoryName}</Text>
            </>
          ) : null}
          <Text className="text-sm text-[#C4CAD3]">·</Text>
          <Text className="text-sm text-[#8E98A8]">
            {formatMinutes(restaurant.average_prep_time)} preparación
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1 rounded-full bg-primary px-2.5 py-1">
            <Ionicons name="time" size={13} color="#FFFFFF" />
            <Text className="text-xs font-semibold text-white">
              {formatMinutes(restaurant.average_prep_time)}
            </Text>
          </View>
          <View className="h-1 w-1 rounded-full bg-[#C4CAD3]" />
          <Ionicons name="bicycle-outline" size={16} color="#8E98A8" />
          <Text className="text-sm font-medium text-[#1C2433]">
            Delivery disponible
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
