import { useState, useEffect, useMemo } from 'react';
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
import type { MenuItemWithOptions, OptionItem } from '@/lib/restaurants';
import type { SelectedOptionInfo } from '@/store/cartStore';

interface MenuItemDetailSheetProps {
  item: MenuItemWithOptions | null;
  quantity: number;
  visible: boolean;
  onClose: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onAddToOrder: (quantity: number, selectedOptions?: SelectedOptionInfo[]) => void;
}

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

  // Opciones seleccionadas indexadas por groupId: { [groupId]: OptionItem[] }
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, OptionItem[]>
  >({});

  // Reset al abrir un nuevo plato
  useEffect(() => {
    if (item) {
      const initial: Record<string, OptionItem[]> = {};
      // Si hay grupos obligatorios de 1 opción, podemos preseleccionar la primera
      item.option_groups?.forEach((g) => {
        if (g.isRequired && g.maxSelect === 1 && g.options.length > 0) {
          initial[g.id] = [g.options[0]];
        } else {
          initial[g.id] = [];
        }
      });
      setSelectedOptions(initial);
    }
  }, [item]);

  function handleToggleOption(groupId: string, option: OptionItem, maxSelect: number, isRequired: boolean) {
    setSelectedOptions((prev) => {
      const currentList = prev[groupId] ?? [];
      const exists = currentList.some((o) => o.id === option.id);

      if (maxSelect === 1) {
        if (exists) {
          // Si es obligatorio, no deseleccionar la única opción
          if (isRequired) return prev;
          return { ...prev, [groupId]: [] };
        }
        return { ...prev, [groupId]: [option] };
      }

      // maxSelect > 1 (multi-selección)
      if (exists) {
        return {
          ...prev,
          [groupId]: currentList.filter((o) => o.id !== option.id),
        };
      }

      if (currentList.length >= maxSelect) {
        return prev; // Ya alcanzó el límite máximo
      }

      return {
        ...prev,
        [groupId]: [...currentList, option],
      };
    });
  }

  // Comprobar si todos los grupos obligatorios cumplen con el mínimo requerido
  const validation = useMemo(() => {
    if (!item?.option_groups) return { isValid: true, message: null };

    for (const group of item.option_groups) {
      const count = (selectedOptions[group.id] ?? []).length;
      if (group.isRequired) {
        const min = group.minSelect > 0 ? group.minSelect : 1;
        if (count < min) {
          return {
            isValid: false,
            message: `Elige al menos ${min} ${min === 1 ? 'opción' : 'opciones'} en "${group.name}"`,
          };
        }
      }
    }

    return { isValid: true, message: null };
  }, [item, selectedOptions]);

  // Precio unitario efectivo sumando adicionales
  const effectiveUnitPrice = useMemo(() => {
    if (!item) return 0;
    let extra = 0;
    Object.values(selectedOptions).forEach((list) => {
      list.forEach((opt) => {
        extra += Number(opt.extraPrice) || 0;
      });
    });
    return item.price + extra;
  }, [item, selectedOptions]);

  const totalPrice = effectiveUnitPrice * quantity;

  function handleConfirm() {
    if (!item || !validation.isValid) return;

    const list: SelectedOptionInfo[] = [];
    item.option_groups?.forEach((g) => {
      const chosen = selectedOptions[g.id] ?? [];
      chosen.forEach((opt) => {
        list.push({
          groupId: g.id,
          groupName: g.name,
          optionId: opt.id,
          optionName: opt.name,
          extraPrice: opt.extraPrice,
        });
      });
    });

    onAddToOrder(quantity, list.length > 0 ? list : undefined);
  }

  return (
    <Modal
      visible={visible && item !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
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
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Foto del plato */}
              <View className="mt-3 h-[220px] w-full items-center justify-center bg-white px-5">
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={{ width: '100%', height: '100%', borderRadius: 20 }}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center rounded-2xl bg-[#F8F9FA]">
                    <Ionicons name="fast-food-outline" size={64} color="#C4CAD3" />
                  </View>
                )}
              </View>

              {/* Título y Descripción */}
              <View className="px-5 pt-5">
                <Text className="text-2xl font-bold text-[#1C2433]">
                  {item.name}
                </Text>
                {item.description ? (
                  <Text className="mt-2 text-sm leading-5 text-[#8E98A8]">
                    {item.description}
                  </Text>
                ) : null}
              </View>

              {/* Grupos de opciones y personalización (Punto E) */}
              {item.option_groups && item.option_groups.length > 0 && (
                <View className="mt-6 space-y-6 px-5">
                  {item.option_groups.map((group) => {
                    const chosen = selectedOptions[group.id] ?? [];
                    const isSingle = group.maxSelect === 1;

                    return (
                      <View
                        key={group.id}
                        className="rounded-2xl border border-[#F0F1F3] bg-[#FAFAFA] p-4"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 pr-2">
                            <Text className="text-base font-semibold text-[#1C2433]">
                              {group.name}
                            </Text>
                            <Text className="text-xs text-[#8E98A8] mt-0.5">
                              {group.description ||
                                (isSingle
                                  ? 'Selecciona 1 opción'
                                  : `Selecciona hasta ${group.maxSelect} opciones`)}
                            </Text>
                          </View>
                          <View
                            className={`rounded-full px-2.5 py-1 ${
                              group.isRequired
                                ? 'bg-primary/10'
                                : 'bg-[#E5E7EB]'
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                group.isRequired
                                  ? 'text-primary'
                                  : 'text-[#6B7280]'
                              }`}
                            >
                              {group.isRequired ? 'Obligatorio' : 'Opcional'}
                            </Text>
                          </View>
                        </View>

                        {/* Lista de opciones del grupo */}
                        <View className="mt-3 space-y-2">
                          {group.options.map((opt) => {
                            const isSelected = chosen.some(
                              (o) => o.id === opt.id,
                            );

                            return (
                              <Pressable
                                key={opt.id}
                                onPress={() =>
                                  handleToggleOption(
                                    group.id,
                                    opt,
                                    group.maxSelect,
                                    group.isRequired,
                                  )
                                }
                                className={`flex-row items-center justify-between rounded-xl p-3 border ${
                                  isSelected
                                    ? 'border-primary bg-white shadow-xs'
                                    : 'border-transparent bg-white/60'
                                }`}
                              >
                                <View className="flex-row items-center gap-3">
                                  <View
                                    className={`h-5 w-5 items-center justify-center ${
                                      isSingle ? 'rounded-full' : 'rounded-md'
                                    } border ${
                                      isSelected
                                        ? 'border-primary bg-primary'
                                        : 'border-[#D1D5DB] bg-white'
                                    }`}
                                  >
                                    {isSelected && (
                                      <Ionicons
                                        name={isSingle ? 'ellipse' : 'checkmark'}
                                        size={isSingle ? 8 : 14}
                                        color="#FFFFFF"
                                      />
                                    )}
                                  </View>
                                  <Text
                                    className={`text-sm ${
                                      isSelected
                                        ? 'font-semibold text-[#1C2433]'
                                        : 'text-[#374151]'
                                    }`}
                                  >
                                    {opt.name}
                                  </Text>
                                </View>

                                <Text
                                  className={`text-sm font-medium ${
                                    isSelected
                                      ? 'text-primary'
                                      : 'text-[#6B7280]'
                                  }`}
                                >
                                  {Number(opt.extraPrice) > 0
                                    ? `+${formatPrice(opt.extraPrice)}`
                                    : 'Gratis'}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Contador de cantidad */}
              <View className="items-center px-5 pb-2 pt-6">
                <View className="flex-row items-center gap-8">
                  <Pressable
                    onPress={onDecrease}
                    disabled={quantity <= 1}
                    accessibilityRole="button"
                    accessibilityLabel="Disminuir cantidad"
                    className={`h-12 w-12 items-center justify-center rounded-full ${
                      quantity > 1 ? 'bg-[#FFF0B8]' : 'bg-[#F3F4F6]'
                    }`}
                  >
                    <Ionicons
                      name="remove"
                      size={24}
                      color={quantity > 1 ? '#F29F30' : '#C4CAD3'}
                    />
                  </Pressable>

                  <Text className="min-w-8 text-center text-xl font-semibold text-[#1C2433]">
                    {quantity}
                  </Text>

                  <Pressable
                    onPress={onIncrease}
                    accessibilityRole="button"
                    accessibilityLabel="Aumentar cantidad"
                    className="h-12 w-12 items-center justify-center rounded-full bg-[#FFF0B8]"
                  >
                    <Ionicons name="add" size={24} color="#F29F30" />
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            {/* Barra inferior: Precio y Confirmar */}
            <View
              className="border-t border-[#F0F1F3] bg-white px-5 pt-3"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              {validation.message && (
                <Text className="text-xs text-[#DC2626] font-medium text-center pb-2">
                  ⚠️ {validation.message}
                </Text>
              )}

              <View className="flex-row items-center gap-4">
                <View className="min-w-[90px]">
                  <Text className="text-xs text-[#8E98A8]">Total</Text>
                  <Text className="text-xl font-bold text-primary">
                    {formatPrice(totalPrice)}
                  </Text>
                </View>

                <Pressable
                  onPress={handleConfirm}
                  disabled={!validation.isValid || quantity <= 0}
                  accessibilityRole="button"
                  className={`h-13 flex-1 items-center justify-center rounded-2xl ${
                    validation.isValid && quantity > 0
                      ? 'bg-primary active:opacity-80'
                      : 'bg-[#D1D5DB]'
                  }`}
                >
                  <Text className="text-base font-semibold text-white">
                    Agregar al pedido
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
