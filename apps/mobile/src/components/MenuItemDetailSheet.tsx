import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { formatPrice } from '@/lib/format';
import type { MenuItem } from '@delivery/shared';

interface MenuItemDetailSheetProps {
  item: MenuItem | null;
  quantity: number;
  visible: boolean;
  onClose: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onAddToOrder: (quantity: number) => void;
}

/** Ficha visual del plato; la selección usa el carrito existente, sin variantes. */
export function MenuItemDetailSheet({
  item,
  quantity,
  visible,
  onClose,
  onIncrease,
  onDecrease,
  onAddToOrder,
}: MenuItemDetailSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible && item !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/35">
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar detalle del producto"
          className="absolute inset-0"
        />

        {item ? (
          <View className="max-h-[92%] overflow-hidden rounded-t-[32px] bg-white">
            <View className="items-center px-5 pt-3">
              <View className="h-1.5 w-12 rounded-full bg-[#E5E7EB]" />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              <View className="items-center px-5 pt-7">
                <Text className="text-center text-2xl font-semibold text-[#1C2433]">
                  {item.name}
                </Text>
                {item.description ? (
                  <Text className="mt-3 max-w-[340px] text-center text-base leading-6 text-[#8E98A8]">
                    {item.description}
                  </Text>
                ) : null}
              </View>

              <View className="mt-5 h-[300px] w-full items-center justify-center bg-white">
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                    transition={200}
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center bg-[#F8F9FA]">
                    <Ionicons name="fast-food-outline" size={72} color="#C4CAD3" />
                  </View>
                )}
              </View>

              <View className="items-center px-5 pb-6 pt-4">
                <View className="flex-row items-center gap-8">
                  <Pressable
                    onPress={onDecrease}
                    disabled={quantity <= 1}
                    accessibilityRole="button"
                    accessibilityLabel="Disminuir cantidad"
                    className={`h-14 w-14 items-center justify-center rounded-full ${
                      quantity > 1 ? 'bg-[#FFF0B8]' : 'bg-[#F3F4F6]'
                    }`}
                  >
                    <Ionicons
                      name="remove"
                      size={30}
                      color={quantity > 1 ? '#F29F30' : '#C4CAD3'}
                    />
                  </Pressable>

                  <Text className="min-w-8 text-center text-2xl font-medium text-[#1C2433]">
                    {quantity}
                  </Text>

                  <Pressable
                    onPress={onIncrease}
                    accessibilityRole="button"
                    accessibilityLabel="Aumentar cantidad"
                    className="h-14 w-14 items-center justify-center rounded-full bg-[#FFF0B8]"
                  >
                    <Ionicons name="add" size={30} color="#F29F30" />
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            <View
              className="flex-row items-center gap-4 border-t border-[#F0F1F3] bg-white px-5 pt-4"
              style={{ paddingBottom: Math.max(insets.bottom, 20) }}
            >
              <View className="min-w-[100px]">
                <Text className="text-sm font-medium text-[#1C2433]">Precio</Text>
                <Text className="mt-1 text-2xl font-semibold text-primary">
                  {formatPrice(item.price)}
                </Text>
              </View>
              <Pressable
                onPress={() => onAddToOrder(quantity)}
                disabled={quantity <= 0}
                accessibilityRole="button"
                className={`h-14 flex-1 items-center justify-center rounded-full ${
                  quantity > 0 ? 'bg-primary active:opacity-70' : 'bg-primary/50'
                }`}
              >
                <Text className="text-base font-semibold text-white">
                  Agregar al pedido
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
