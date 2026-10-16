import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SectionList,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MenuItemCard } from '@/components/MenuItemCard';
import { MenuItemDetailSheet } from '@/components/MenuItemDetailSheet';
import { PopularMenuItemCard } from '@/components/PopularMenuItemCard';
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
import type { Enums, MenuItem } from '@delivery/shared';

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
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedDetailTab, setSelectedDetailTab] = useState<'delivery' | 'review'>(
    'delivery',
  );

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

  const handleAdd = (item: MenuItem, quantity = 1) => {
    const addQuantity = () => {
      for (let index = 0; index < quantity; index += 1) {
        addItem(id, item);
      }
    };

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
              addQuantity();
            },
          },
        ],
      );
      return;
    }
    addQuantity();
  };

  const openMenuItem = (item: MenuItem) => {
    setSelectedQuantity(1);
    setSelectedMenuItem(item);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F29F30" />
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-[#F8F9FA] px-8">
        <Ionicons name="alert-circle-outline" size={40} color="#8E98A8" />
        <Text className="text-center text-sm text-[#8E98A8]">
          {error ?? 'No se encontró el restaurante.'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="rounded-full bg-primary px-6 py-3 active:opacity-70"
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
  const popularItems = sections.flatMap((section) => section.data).slice(0, 5);

  const deliveryLabel = !config
    ? 'Consultar delivery'
    : deliveryEnabled
      ? config.delivery_fee === 0
        ? 'Envío gratis'
        : `Envío ${formatPrice(config.delivery_fee)}`
      : DELIVERY_TYPE_LABELS[config.delivery_type];

  const header = (
    <View className="bg-white">
      {/* Portada del restaurante */}
      <View className="relative h-[250px] w-full bg-[#F3F4F6]">
        {restaurant.image_url ? (
          <Image
            source={{ uri: restaurant.image_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="restaurant-outline" size={60} color="#8E98A8" />
          </View>
        )}

        <View className="absolute inset-x-0 top-0 flex-row items-center justify-between px-5 pt-3">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            className="h-11 w-11 items-center justify-center rounded-full bg-white/95 active:opacity-70"
          >
            <Ionicons name="chevron-back" size={22} color="#1C2433" />
          </Pressable>
          <View
            accessibilityLabel="Favoritos disponible próximamente"
            className="h-11 w-11 items-center justify-center rounded-full bg-white/95"
          >
            <Ionicons name="heart-outline" size={21} color="#F29F30" />
          </View>
        </View>
      </View>

      {/* Panel de información */}
      <View className="-mt-7 rounded-t-[28px] bg-white px-5 pb-5 pt-3">
        <View className="mb-5 h-1.5 w-10 self-center rounded-full bg-[#E5E7EB]" />

        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Text
              className="flex-1 text-2xl font-bold text-[#1C2433]"
              numberOfLines={1}
            >
              {restaurant.name}
            </Text>
            <View
              className={`rounded-full px-3 py-1.5 ${
                config?.delivery_type === 'pickup_only'
                  ? 'bg-primary/10'
                  : 'bg-[#FFF7E6]'
              }`}
            >
              <Text className="text-xs font-semibold text-primary">
                {config?.delivery_type === 'pickup_only' ? 'Recojo' : 'Delivery'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-semibold text-[#10B981]">
              {restaurant.is_active ? 'Disponible' : 'No disponible'}
            </Text>
            <Text className="text-sm text-[#C4CAD3]">·</Text>
            <Ionicons name="location-outline" size={15} color="#8E98A8" />
            <Text
              className="flex-1 text-sm text-[#8E98A8]"
              numberOfLines={1}
            >
              {restaurant.address}
            </Text>
          </View>

          {categoryName ? (
            <View className="self-start rounded-full bg-primary/10 px-3 py-1">
              <Text className="text-xs font-medium text-primary">
                {categoryName}
              </Text>
            </View>
          ) : null}

          <View className="mt-1 h-px bg-[#F0F1F3]" />

          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-2 pt-1">
            <View className="flex-row items-center gap-1 rounded-xl bg-primary px-2.5 py-1.5">
              <Ionicons name="star" size={14} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white">—</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="time" size={17} color="#C4CAD3" />
              <Text className="text-sm font-medium text-[#1C2433]">
                {formatMinutes(restaurant.average_prep_time)}
              </Text>
            </View>
            <Text className="text-sm text-[#C4CAD3]">·</Text>
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name={deliveryEnabled ? 'bicycle' : 'storefront-outline'}
                size={17}
                color="#C4CAD3"
              />
              <Text className="text-sm font-medium text-[#1C2433]">
                {deliveryLabel}
              </Text>
            </View>
          </View>

          {/* Espacio visual de promociones, listo para conectarse a la API. */}
          <View className="mt-2 min-h-12 flex-row items-center gap-3 rounded-2xl bg-[#F3F4F6] px-4 py-3">
            <Ionicons name="pricetag" size={19} color="#F29F30" />
            <Text className="flex-1 text-sm text-[#1C2433]">
              Las promociones aparecerán aquí
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#8E98A8" />
          </View>
        </View>
      </View>

      {/* Pestañas de contenido */}
      <View className="flex-row border-y border-[#F0F1F3] bg-white px-5">
        {([
          ['delivery', 'Delivery'],
          ['review', 'Review'],
        ] as const).map(([tab, label]) => {
          const isSelected = selectedDetailTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setSelectedDetailTab(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              className={`mr-8 min-w-[120px] items-center border-b-2 py-4 ${
                isSelected ? 'border-primary' : 'border-transparent'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isSelected ? 'text-primary' : 'text-[#1C2433]'
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedDetailTab === 'delivery' && popularItems.length > 0 ? (
        <View className="border-b border-[#F0F1F3] bg-white pb-5 pt-6">
          <View className="mb-4 flex-row items-center justify-between px-5">
            <Text className="text-lg font-semibold text-[#1C2433]">
              Popular Items
            </Text>
            <Text className="text-sm font-medium text-[#8E98A8]">Ver menú</Text>
          </View>
          <FlatList
            data={popularItems}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <PopularMenuItemCard
                item={item}
                quantity={lines[item.id]?.quantity ?? 0}
                onSelect={() => openMenuItem(item)}
                onAdd={() => handleAdd(item)}
                onDecrement={() => decrementItem(item.id)}
              />
            )}
            keyExtractor={(item) => `popular-${item.id}`}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-[#F8F9FA]">
      <SectionList
        sections={selectedDetailTab === 'delivery' ? sections : []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 136, backgroundColor: '#FFFFFF' }}
        renderSectionHeader={({ section }) => (
          <View className="bg-white px-5 pb-1 pt-6">
            <Text className="text-lg font-semibold text-[#1C2433]">
              {section.category?.name ?? 'Más platos'}
            </Text>
            {section.category?.description && (
              <Text className="mt-1 text-sm text-[#8E98A8]">
                {section.category.description}
              </Text>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <MenuItemCard
            item={item}
            quantity={lines[item.id]?.quantity ?? 0}
            onSelect={() => openMenuItem(item)}
            onAdd={() => handleAdd(item)}
            onDecrement={() => decrementItem(item.id)}
          />
        )}
        ListEmptyComponent={
          selectedDetailTab === 'review' ? (
            <View className="items-center gap-3 px-8 py-16">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Ionicons name="chatbubbles-outline" size={30} color="#F29F30" />
              </View>
              <Text className="text-base font-semibold text-[#1C2433]">
                Reseñas próximamente
              </Text>
              <Text className="text-center text-sm leading-5 text-[#8E98A8]">
                Estamos preparando este espacio para las opiniones de nuestros clientes.
              </Text>
            </View>
          ) : (
            <View className="items-center gap-2 px-8 py-16">
              <Ionicons name="fast-food-outline" size={40} color="#8E98A8" />
              <Text className="text-center text-sm text-[#8E98A8]">
                Este restaurante aún no tiene platos disponibles.
              </Text>
            </View>
          )
        }
      />

      {/* Barra del carrito: navega al checkout */}
      {cartRestaurantId === id && totalItems > 0 && (
        <Pressable
          onPress={() => router.push('/(client)/checkout')}
          className="absolute inset-x-4 bottom-4 flex-row items-center justify-between rounded-full bg-primary px-5 py-4 active:opacity-70"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="cart" size={20} color="#fff" />
            <Text className="font-semibold text-white">
              {totalItems} {totalItems === 1 ? 'plato' : 'platos'}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-white">
              {formatPrice(totalPrice)}
            </Text>
            <Text className="text-sm font-semibold text-white/80">
              Ir a pagar
            </Text>
          </View>
        </Pressable>
      )}

      <MenuItemDetailSheet
        item={selectedMenuItem}
        visible={selectedMenuItem !== null}
        quantity={selectedQuantity}
        onClose={() => setSelectedMenuItem(null)}
        onIncrease={() => setSelectedQuantity((quantity) => quantity + 1)}
        onDecrease={() =>
          setSelectedQuantity((quantity) => Math.max(1, quantity - 1))
        }
        onAddToOrder={(quantity) => {
          if (selectedMenuItem) {
            handleAdd(selectedMenuItem, quantity);
            setSelectedMenuItem(null);
          }
        }}
      />
    </SafeAreaView>
  );
}
