import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatPrice } from '@/lib/format';
import { createOrder } from '@/lib/orders';
import { fetchActivePaymentMethods } from '@/lib/payments';
import {
  fetchRestaurantById,
  type RestaurantDetail,
} from '@/lib/restaurants';
import { useAuthStore } from '@/store/authStore';
import {
  selectTotalItems,
  selectTotalPrice,
  useCartStore,
} from '@/store/cartStore';
import { useCheckoutStore } from '@/store/checkoutStore';
import type { PaymentMethod } from '@delivery/shared';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Icono según el código del método de pago.
function paymentIcon(code: string): IconName {
  const c = code.toLowerCase();
  if (c.includes('cash') || c.includes('efectivo')) return 'cash-outline';
  if (c.includes('yape') || c.includes('plin')) return 'phone-portrait-outline';
  if (c.includes('card') || c.includes('tarjeta')) return 'card-outline';
  return 'wallet-outline';
}

/**
 * Checkout: dirección + método de pago + resumen (subtotal + delivery_fee).
 * Tarea 3 conectará "Confirmar Pedido" con el INSERT real.
 */
export default function CheckoutScreen() {
  const { session } = useAuthStore();

  const restaurantId = useCartStore((state) => state.restaurantId);
  const lines = useCartStore((state) => state.lines);
  const addItem = useCartStore((state) => state.addItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const clearCart = useCartStore((state) => state.clear);
  const totalItems = useCartStore(selectTotalItems);
  const subtotal = useCartStore(selectTotalPrice);

  const selectedAddress = useCheckoutStore((state) => state.selectedAddress);
  const selectedPaymentMethod = useCheckoutStore(
    (state) => state.selectedPaymentMethod,
  );
  const setPaymentMethod = useCheckoutStore((state) => state.setPaymentMethod);
  const resetCheckout = useCheckoutStore((state) => state.reset);

  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Config de entrega del restaurante del carrito + métodos de pago activos.
  useEffect(() => {
    let cancelled = false;
    if (!restaurantId) return;

    Promise.all([
      fetchRestaurantById(restaurantId),
      fetchActivePaymentMethods(),
    ])
      .then(([detail, methods]) => {
        if (cancelled) return;
        setRestaurant(detail);
        setPaymentMethods(methods);
        setError(null);
        // Preselecciona el primer método si no hay ninguno elegido.
        if (
          !useCheckoutStore.getState().selectedPaymentMethod &&
          methods.length > 0
        ) {
          setPaymentMethod(methods[0]);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Error cargando');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId, setPaymentMethod]);

  // Carrito vacío -> no hay nada que confirmar.
  if (!restaurantId || totalItems === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-[#F3F4F6] px-8">
        <Ionicons name="cart-outline" size={48} color="#8E98A8" />
        <Text className="text-center text-base text-[#1C2433]">
          Tu carrito está vacío
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F3F4F6]">
        <ActivityIndicator size="large" color="#F29F30" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-[#F3F4F6] px-8">
        <Ionicons name="alert-circle-outline" size={40} color="#8E98A8" />
        <Text className="text-center text-sm text-[#8E98A8]">{error}</Text>
        <Pressable
          onPress={() => router.back()}
          className="rounded-full bg-primary px-6 py-3 active:opacity-70"
        >
          <Text className="font-semibold text-white">Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Subtotal + delivery_fee (con umbral de delivery gratis) = total.
  const config = restaurant?.restaurant_delivery_config ?? null;
  const deliveryFee =
    config && config.is_delivery_enabled && config.delivery_type !== 'pickup_only'
      ? config.free_delivery_threshold !== null &&
        subtotal >= config.free_delivery_threshold
        ? 0
        : config.delivery_fee
      : 0;
  const total = subtotal + deliveryFee;

  const canConfirm =
    !!selectedAddress && !!selectedPaymentMethod && totalItems > 0;

  const onConfirm = async () => {
    if (!session || !selectedAddress || !selectedPaymentMethod) return;

    setIsSubmitting(true);
    try {
      // INSERT: orders -> order_items -> order_payments.
      await createOrder({
        clientId: session.user.id,
        restaurantId,
        address: selectedAddress,
        paymentMethod: selectedPaymentMethod,
        lines: Object.values(lines),
        subtotal,
        deliveryFee,
        total,
      });

      // Pedido creado: limpiar carrito + checkout y salir a "Mis pedidos".
      clearCart();
      resetCheckout();
      router.replace('/(client)/(tabs)/orders');
    } catch (e) {
      Alert.alert(
        'No se pudo crear el pedido',
        e instanceof Error ? e.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-[#F3F4F6]">
      {/* Cabecera */}
      <View className="flex-row items-center justify-between bg-white px-5 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="chevron-back" size={24} color="#C4CAD3" />
        </Pressable>
        <Text className="text-lg font-semibold text-[#1C2433]">
          Confirm Order
        </Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}
      >
        {/* Dirección de entrega */}
        <View className="overflow-hidden rounded-3xl bg-white">
          <View className="border-b border-[#F0F1F3] px-5 py-4">
            <Text className="text-lg font-semibold text-[#1C2433]">
              Delivery to
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(client)/addresses')}
            accessibilityRole="button"
            className="flex-row items-center gap-3 p-5 active:opacity-70"
          >
            <View className="relative h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#F3F4F6]">
              <View className="absolute h-24 w-2 rotate-45 bg-white" />
              <View className="absolute h-2 w-24 -rotate-12 bg-white" />
              <View className="absolute h-16 w-1 -rotate-12 bg-white" />
              <Ionicons name="location" size={30} color="#10B981" />
            </View>
            <View className="flex-1 gap-1">
              {selectedAddress ? (
                <>
                  <Text
                    className="text-base font-semibold text-[#1C2433]"
                    numberOfLines={1}
                  >
                    {selectedAddress.street}
                  </Text>
                  <Text className="text-sm text-[#1C2433]" numberOfLines={2}>
                    {selectedAddress.city}
                  </Text>
                  {selectedAddress.reference ? (
                    <Text className="text-xs text-[#8E98A8]" numberOfLines={1}>
                      {selectedAddress.reference}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text className="text-base font-medium text-[#8E98A8]">
                  Selecciona una dirección
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8E98A8" />
          </Pressable>
        </View>

        {/* Restaurante, productos y resumen */}
        <View className="overflow-hidden rounded-3xl bg-white">
          <View className="px-5 pb-2 pt-5">
            <Text className="text-lg font-semibold text-[#1C2433]">
              {restaurant?.name ?? 'Tu pedido'}
            </Text>
          </View>

          {Object.entries(lines).map(([lineKey, line]) => (
            <View
              key={lineKey}
              className="flex-row items-center gap-3 border-b border-[#F0F1F3] px-5 py-4"
            >
              <View className="h-[72px] w-[72px] overflow-hidden rounded-2xl bg-[#F3F4F6]">
                {line.item.image_url ? (
                  <Image
                    source={{ uri: line.item.image_url }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <Ionicons name="fast-food-outline" size={26} color="#8E98A8" />
                  </View>
                )}
              </View>

              <View className="min-w-0 flex-1 gap-1">
                <Text
                  className="text-base font-medium text-[#1C2433]"
                  numberOfLines={1}
                >
                  {line.item.name}
                </Text>

                {line.selectedOptions && line.selectedOptions.length > 0 && (
                  <Text className="text-xs text-[#8E98A8]">
                    {line.selectedOptions.map((o) => o.optionName).join(', ')}
                  </Text>
                )}

                <View className="flex-row flex-wrap items-center gap-2 mt-1">
                  <View className="flex-row items-center gap-2 rounded-full bg-[#F3F4F6] px-2 py-1">
                    <Pressable
                      onPress={() => decrementItem(lineKey)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar ${line.item.name}`}
                    >
                      <Ionicons
                        name="remove-circle"
                        size={21}
                        color="#C4CAD3"
                      />
                    </Pressable>
                    <Text className="min-w-4 text-center text-sm font-medium text-[#1C2433]">
                      {line.quantity}
                    </Text>
                    <Pressable
                      onPress={() =>
                        addItem(restaurantId, line.item, 1, line.selectedOptions)
                      }
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Agregar otro ${line.item.name}`}
                    >
                      <Ionicons
                        name="add-circle"
                        size={21}
                        color="#F29F30"
                      />
                    </Pressable>
                  </View>
                  <Text className="text-sm font-semibold text-primary">
                    {formatPrice(line.unitPrice * line.quantity)}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          <View className="gap-4 px-5 py-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-[#1C2433]">
                Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </Text>
              <Text className="text-sm font-medium text-[#1C2433]">
                {formatPrice(subtotal)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-[#1C2433]">Delivery</Text>
              <Text className="text-sm font-medium text-[#1C2433]">
                {deliveryFee === 0 ? 'Gratis' : formatPrice(deliveryFee)}
              </Text>
            </View>
            <View className="h-px bg-[#F0F1F3]" />
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-[#1C2433]">
                Total
              </Text>
              <Text className="text-lg font-semibold text-primary">
                {formatPrice(total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Métodos de pago existentes */}
        <View className="gap-3">
          <Text className="px-1 text-lg font-semibold text-[#1C2433]">
            Payment method
          </Text>
          {paymentMethods.length === 0 ? (
            <View className="rounded-3xl bg-white p-5">
              <Text className="text-sm text-[#8E98A8]">
                No hay métodos de pago disponibles.
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {paymentMethods.map((method) => {
                const isSelected = selectedPaymentMethod?.id === method.id;
                return (
                  <Pressable
                    key={method.id}
                    onPress={() => setPaymentMethod(method)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    className={`w-[48.5%] min-h-[104px] justify-center rounded-3xl border p-4 active:opacity-70 ${
                      isSelected
                        ? 'border-primary bg-[#FFF9F1]'
                        : 'border-transparent bg-white'
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className={`h-10 w-10 items-center justify-center rounded-xl ${
                          isSelected ? 'bg-primary/10' : 'bg-[#F3F4F6]'
                        }`}
                      >
                        <Ionicons
                          name={paymentIcon(method.code)}
                          size={21}
                          color={isSelected ? '#F29F30' : '#8E98A8'}
                        />
                      </View>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={19}
                          color="#10B981"
                        />
                      ) : null}
                    </View>
                    <Text className="mt-3 text-sm font-semibold text-[#1C2433]">
                      {method.name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-[#8E98A8]">
                      {formatPrice(total)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Acción fija de confirmación */}
      <View className="bg-white px-5 pb-3 pt-4">
        <Pressable
          onPress={onConfirm}
          disabled={!canConfirm || isSubmitting}
          accessibilityRole="button"
          className={`h-[52px] flex-row items-center justify-center gap-2 rounded-full ${
            canConfirm && !isSubmitting
              ? 'bg-primary active:opacity-70'
              : 'bg-[#C4CAD3]'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">Submit</Text>
          )}
        </Pressable>
        {!canConfirm && (
          <Text className="mt-2 text-center text-xs text-[#8E98A8]">
            Selecciona dirección y método de pago para continuar.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
