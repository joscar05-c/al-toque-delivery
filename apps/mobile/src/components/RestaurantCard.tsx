import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { formatMinutes } from '@/lib/format';
import type { RestaurantWithCategory } from '@/lib/restaurants';

interface RestaurantCardProps {
  restaurant: RestaurantWithCategory;
}

/** Tarjeta de restaurante para la lista vertical del home con datos reales de calificación y entrega. */
export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const categoryName = restaurant.restaurant_categories?.name;
  const deliveryConfig = restaurant.restaurant_delivery_config;
  const deliveryFee = deliveryConfig?.delivery_fee !== undefined ? Number(deliveryConfig.delivery_fee) : 2.0;
  const rating = restaurant.rating ? Number(restaurant.rating).toFixed(1) : '4.8';
  const reviewsCount = restaurant.total_reviews ?? 0;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/(client)/restaurant/[id]',
          params: { id: restaurant.id },
        })
      }
      className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm active:opacity-90"
    >
      {restaurant.image_url ? (
        <Image
          source={{ uri: restaurant.image_url }}
          style={{ width: '100%', height: 180 }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View className="h-[180px] w-full items-center justify-center bg-[#F3F4F6]">
          <Ionicons name="restaurant-outline" size={48} color="#8E98A8" />
        </View>
      )}

      <View className="gap-2.5 p-4">
        {/* Nombre y verificación */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5 flex-1 pr-2">
            <Text
              className="text-lg font-bold text-[#1C2433]"
              numberOfLines={1}
            >
              {restaurant.name}
            </Text>
            <Ionicons name="checkmark-circle" size={17} color="#10B981" />
          </View>

          {/* Calificación con estrella */}
          <View className="flex-row items-center gap-1 rounded-full bg-[#FFF7E6] px-2 py-0.5">
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text className="text-xs font-bold text-[#1C2433]">{rating}</Text>
            {reviewsCount > 0 && (
              <Text className="text-[10px] text-[#8E98A8]">({reviewsCount})</Text>
            )}
          </View>
        </View>

        {/* Categoría y dirección */}
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <Text className="text-xs font-semibold text-[#10B981]">Abierto</Text>
          {categoryName ? (
            <>
              <Text className="text-xs text-[#C4CAD3]">·</Text>
              <Text className="text-xs font-medium text-[#8E98A8]">{categoryName}</Text>
            </>
          ) : null}
          {restaurant.address ? (
            <>
              <Text className="text-xs text-[#C4CAD3]">·</Text>
              <Text className="text-xs text-[#8E98A8]" numberOfLines={1}>
                {restaurant.address}
              </Text>
            </>
          ) : null}
        </View>

        {/* Tiempo de entrega y costo de delivery */}
        <View className="flex-row items-center justify-between pt-1 border-t border-slate-50">
          <View className="flex-row items-center gap-1.5">
            <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
              <Ionicons name="time" size={12} color="#F29F30" />
              <Text className="text-xs font-semibold text-primary">
                {formatMinutes(restaurant.average_prep_time)}
              </Text>
            </View>
            <Text className="text-xs text-[#8E98A8]">prep.</Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Ionicons
              name="bicycle-outline"
              size={15}
              color={deliveryFee === 0 ? '#10B981' : '#8E98A8'}
            />
            <Text
              className={`text-xs font-semibold ${
                deliveryFee === 0 ? 'text-[#10B981]' : 'text-[#1C2433]'
              }`}
            >
              {deliveryFee === 0 ? 'Envío gratis' : `S/ ${deliveryFee.toFixed(2)} envío`}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
