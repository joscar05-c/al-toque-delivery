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
      className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-white active:opacity-90"
    >
      {restaurant.image_url ? (
        <Image
          source={{ uri: restaurant.image_url }}
          style={{ width: '100%', height: 160 }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View className="h-40 w-full items-center justify-center bg-slate-100">
          <Ionicons name="restaurant-outline" size={48} color="#94A3B8" />
        </View>
      )}

      <View className="gap-1 p-4">
        <Text className="text-lg font-bold text-slate-900" numberOfLines={1}>
          {restaurant.name}
        </Text>

        <View className="flex-row items-center gap-3">
          {categoryName && (
            <View className="rounded-full bg-primary/10 px-2.5 py-1">
              <Text className="text-xs font-medium text-primary">
                {categoryName}
              </Text>
            </View>
          )}
          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text className="text-xs text-slate-500">
              {formatMinutes(restaurant.average_prep_time)} de preparación
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
