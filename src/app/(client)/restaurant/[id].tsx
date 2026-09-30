import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SectionList,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MenuItemCard } from '@/components/MenuItemCard';
import { formatMinutes, formatPrice } from '@/lib/format';
import {
  fetchRestaurantById,
  fetchRestaurantMenu,
  type MenuSection,
  type RestaurantDetail,
} from '@/lib/restaurants';
import {
  selectTotalItems,
  selectTotalPrice,
  useCartStore,
} from '@/store/cartStore';
import type { Enums, MenuItem } from '@/types/database.types';

type DeliveryType = Enums<'restaurant_delivery_config_delivery_type_enum'>;

const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  platform: 'Delivery por la plataforma',
  restaurant_own: 'Delivery del restaurante',
  pickup_only: 'Solo recojo en tienda',
};

/**
 * Detalle de restaurante: datos + config de entrega + menú por categorías.
 * El usuario arma su carrito aquí (un solo restaurante por pedido).
 */
export default function RestaurantMenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cartRestaurantId = useCartStore((state) => state.restaurantId);
  const lines = useCartStore((state) => state.lines);
  const addItem = useCartStore((state) => state.addItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const clearCart = useCartStore((state) => state.clear);
  const totalItems = useCartStore(selectTotalItems);
  const totalPrice = useCartStore(selectTotalPrice);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const [detail, menu] = await Promise.all([
          fetchRestaurantById(id),
          fetchRestaurantMenu(id),
        ]);
        setRestaurant(detail);
        setSections(menu);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'Error cargando el restaurante',
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (!id) {
    return <Redirect href="/(client)/(tabs)" />;
  }

  const handleAdd = (item: MenuItem) => {
    // Regla de negocio: un pedido pertenece a un solo restaurante.
    if (cartRestaurantId && cartRestaurantId !== id && totalItems > 0) {
      Alert.alert(
        '¿Vaciar carrito?',
        'Tu carrito tiene platos de otro restaurante. Solo puedes pedir de un restaurante a la vez.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Vaciar y agregar',
            style: 'destructive',
            onPress: () => {
              clearCart();
              addItem(id, item);
            },
          },
        ],
      );
      return;
    }
    addItem(id, item);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#208AEF" />
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-white px-8">
        <Ionicons name="alert-circle-outline" size={40} color="#94A3B8" />
        <Text className="text-center text-sm text-slate-500">
          {error ?? 'No se encontró el restaurante.'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="rounded-xl bg-primary px-6 py-3 active:opacity-80"
        >
          <Text className="font-semibold text-white">Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const config = restaurant.restaurant_delivery_config;
  const categoryName = restaurant.restaurant_categories?.name;
  const deliveryEnabled =
    config !== null && config.is_delivery_enabled && config.delivery_type !== 'pickup_only';

  const header = (
    <View>
      {/* Imagen de portada con botón atrás superpuesto */}
      <View>
        {restaurant.image_url ? (
          <Image
            source={{ uri: restaurant.image_url }}
            style={{ width: '100%', height: 200 }}
            contentFit="cover"
          />
        ) : (
          <View className="h-48 w-full items-center justify-center bg-slate-200">
            <Ionicons name="restaurant-outline" size={56} color="#94A3B8" />
          </View>
        )}
        <Pressable
          onPress={() => router.back()}
          className="absolute left-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
      </View>

      {/* Datos del restaurante */}
      <View className="gap-2 border-b border-slate-100 px-4 py-4">
        <Text className="text-2xl font-bold text-slate-900">
          {restaurant.name}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="location-outline" size={14} color="#64748B" />
          <Text className="flex-1 text-sm text-slate-500" numberOfLines={1}>
            {restaurant.address}
          </Text>
        </View>

        {/* Badges de entrega */}
        <View className="mt-1 flex-row flex-wrap gap-2">
          {categoryName && (
            <View className="rounded-full bg-primary/10 px-3 py-1">
              <Text className="text-xs font-medium text-primary">
                {categoryName}
              </Text>
            </View>
          )}
          <View className="flex-row items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
            <Ionicons name="time-outline" size={12} color="#475569" />
            <Text className="text-xs font-medium text-slate-600">
              {formatMinutes(restaurant.average_prep_time)} prep.
            </Text>
          </View>
          {config && (
            <View className="flex-row items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
              <Ionicons
                name={deliveryEnabled ? 'bicycle-outline' : 'storefront-outline'}
                size={12}
                color="#475569"
              />
              <Text className="text-xs font-medium text-slate-600">
                {deliveryEnabled
                  ? config.delivery_fee === 0
                    ? 'Delivery gratis'
                    : `Delivery ${formatPrice(config.delivery_fee)}`
                  : DELIVERY_TYPE_LABELS[config.delivery_type]}
              </Text>
            </View>
          )}
          {config && deliveryEnabled && (
            <View className="flex-row items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
              <Ionicons name="rocket-outline" size={12} color="#475569" />
              <Text className="text-xs font-medium text-slate-600">
                ~{formatMinutes(config.estimated_delivery_time)} entrega
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderSectionHeader={({ section }) => (
          <View className="bg-white px-4 pb-1 pt-5">
            <Text className="text-lg font-bold text-slate-900">
              {section.category?.name ?? 'Más platos'}
            </Text>
            {section.category?.description && (
              <Text className="text-sm text-slate-500">
                {section.category.description}
              </Text>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <MenuItemCard
            item={item}
            quantity={lines[item.id]?.quantity ?? 0}
            onAdd={() => handleAdd(item)}
            onDecrement={() => decrementItem(item.id)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center gap-2 px-8 py-16">
            <Ionicons name="fast-food-outline" size={40} color="#94A3B8" />
            <Text className="text-center text-sm text-slate-500">
              Este restaurante aún no tiene platos disponibles.
            </Text>
          </View>
        }
      />

      {/* Resumen del carrito (la navegación al checkout llega en la Fase 3) */}
      {cartRestaurantId === id && totalItems > 0 && (
        <View className="absolute inset-x-4 bottom-6 flex-row items-center justify-between rounded-2xl bg-primary px-5 py-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="cart" size={20} color="#fff" />
            <Text className="font-semibold text-white">
              {totalItems} {totalItems === 1 ? 'plato' : 'platos'}
            </Text>
          </View>
          <Text className="text-base font-bold text-white">
            {formatPrice(totalPrice)}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
