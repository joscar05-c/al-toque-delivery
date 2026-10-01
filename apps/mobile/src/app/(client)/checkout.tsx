import { Ionicons } from '@expo/vector-icons';
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
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-white px-8">
        <Ionicons name="cart-outline" size={48} color="#94A3B8" />
        <Text className="text-center text-base text-slate-600">
          Tu carrito está vacío
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#208AEF" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-white px-8">
        <Ionicons name="alert-circle-outline" size={40} color="#94A3B8" />
        <Text className="text-center text-sm text-slate-500">{error}</Text>
        <Pressable
          onPress={() => router.back()}
          className="rounded-xl bg-primary px-6 py-3 active:opacity-80"
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
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      {/* Cabecera */}
      <View className="flex-row items-center gap-3 bg-white px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">
            Confirmar pedido
          </Text>
          {restaurant && (
            <Text className="text-xs text-slate-500" numberOfLines={1}>
              {restaurant.name}
            </Text>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Dirección de entrega */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-700">
            Dirección de entrega
          </Text>
          <Pressable
            onPress={() => router.push('/(client)/addresses')}
            className={`flex-row items-center gap-3 rounded-2xl border bg-white p-4 active:opacity-80 ${
              selectedAddress ? 'border-primary' : 'border-slate-200'
            }`}
          >
            <View
              className={`h-11 w-11 items-center justify-center rounded-full ${
                selectedAddress ? 'bg-primary/10' : 'bg-slate-100'
              }`}
            >
              <Ionicons
                name="location"
                size={20}
                color={selectedAddress ? '#208AEF' : '#64748B'}
              />
            </View>
            <View className="flex-1">
              {selectedAddress ? (
                <>
                  <Text
                    className="text-base font-semibold text-slate-900"
                    numberOfLines={1}
                  >
                    {selectedAddress.street}
                  </Text>
                  <Text className="text-sm text-slate-500" numberOfLines={1}>
                    {selectedAddress.city}
                    {selectedAddress.reference
                      ? ` · ${selectedAddress.reference}`
                      : ''}
                  </Text>
                </>
              ) : (
                <Text className="text-base font-medium text-slate-500">
                  Selecciona una dirección
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>
        </View>

        {/* Método de pago */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-700">
            Método de pago
          </Text>
          {paymentMethods.length === 0 ? (
            <View className="rounded-2xl border border-slate-200 bg-white p-4">
              <Text className="text-sm text-slate-500">
                No hay métodos de pago disponibles.
              </Text>
            </View>
          ) : (
            paymentMethods.map((method) => {
              const isSelected = selectedPaymentMethod?.id === method.id;
              return (
                <Pressable
                  key={method.id}
                  onPress={() => setPaymentMethod(method)}
                  className={`flex-row items-center gap-3 rounded-2xl border bg-white p-4 active:opacity-80 ${
                    isSelected ? 'border-primary' : 'border-slate-200'
                  }`}
                >
                  <View
                    className={`h-11 w-11 items-center justify-center rounded-full ${
                      isSelected ? 'bg-primary/10' : 'bg-slate-100'
                    }`}
                  >
                    <Ionicons
                      name={paymentIcon(method.code)}
                      size={20}
                      color={isSelected ? '#208AEF' : '#64748B'}
                    />
                  </View>
                  <Text className="flex-1 text-base font-semibold text-slate-900">
                    {method.name}
                  </Text>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isSelected ? '#208AEF' : '#CBD5E1'}
                  />
                </Pressable>
              );
            })
          )}
        </View>

        {/* Resumen del pedido */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-700">
            Resumen ({totalItems} {totalItems === 1 ? 'plato' : 'platos'})
          </Text>
          <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            {Object.values(lines).map((line) => (
              <View key={line.item.id} className="flex-row items-center gap-2">
                <Text className="w-8 text-sm font-bold text-primary">
                  {line.quantity}x
                </Text>
                <Text className="flex-1 text-sm text-slate-700" numberOfLines={1}>
                  {line.item.name}
                </Text>
                <Text className="text-sm font-medium text-slate-900">
                  {formatPrice(line.item.price * line.quantity)}
                </Text>
              </View>
            ))}

            <View className="my-1 h-px bg-slate-100" />

            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-500">Subtotal</Text>
              <Text className="text-sm font-medium text-slate-900">
                {formatPrice(subtotal)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-500">Delivery</Text>
              <Text className="text-sm font-medium text-slate-900">
                {deliveryFee === 0 ? 'Gratis' : formatPrice(deliveryFee)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-base font-bold text-slate-900">Total</Text>
              <Text className="text-base font-bold text-primary">
                {formatPrice(total)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Confirmar */}
      <View className="bg-white p-4">
        <Pressable
          onPress={onConfirm}
          disabled={!canConfirm || isSubmitting}
          className={`flex-row items-center justify-center gap-2 rounded-xl py-4 ${
            canConfirm && !isSubmitting
              ? 'bg-primary active:opacity-80'
              : 'bg-slate-300'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">
              Confirmar Pedido · {formatPrice(total)}
            </Text>
          )}
        </Pressable>
        {!canConfirm && (
          <Text className="mt-2 text-center text-xs text-slate-400">
            Selecciona dirección y método de pago para continuar.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
