import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryChip } from '@/components/CategoryChip';
import { RestaurantCard } from '@/components/RestaurantCard';
import {
  fetchActiveRestaurants,
  fetchRestaurantCategories,
  type RestaurantWithCategory,
} from '@/lib/restaurants';
import type { RestaurantCategory } from '@delivery/shared';

type CategoryOption = { id: string | null; name: string };
type FilterTab = 'Cercanos' | 'Ventas' | 'Calificación' | 'Rápido';

const FILTER_TABS: FilterTab[] = ['Cercanos', 'Ventas', 'Calificación', 'Rápido'];

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

export default function PublicHomeScreen() {
  const [categories, setCategories] = useState<RestaurantCategory[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantWithCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<FilterTab>('Cercanos');
  const [showAllPartners, setShowAllPartners] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (categoryId?: string) => {
    const [cats, rests] = await Promise.all([
      fetchRestaurantCategories(),
      fetchActiveRestaurants(categoryId),
    ]);
    return { cats, rests };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadData()
      .then(({ cats, rests }) => {
        if (cancelled) return;
        setCategories(cats);
        setRestaurants(rests);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(errorMessage(e, 'Error cargando los datos'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const reload = (categoryId: string | null, kind: 'loading' | 'refresh') => {
    const setBusy = kind === 'loading' ? setIsLoading : setIsRefreshing;
    setBusy(true);
    setError(null);

    loadData(categoryId ?? undefined)
      .then(({ cats, rests }) => {
        setCategories(cats);
        setRestaurants(rests);
      })
      .catch((e: unknown) => {
        setError(errorMessage(e, 'Error cargando los datos'));
      })
      .finally(() => setBusy(false));
  };

  const onSelectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    reload(categoryId, 'loading');
  };

  const onRefresh = () => reload(selectedCategory, 'refresh');
  const onRetry = () => reload(selectedCategory, 'loading');

  const onResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTab('Cercanos');
    reload(null, 'loading');
  };

  // Filtrado reactivo por texto y ordenamiento por pestaña activa
  const processedRestaurants = useMemo(() => {
    let list = [...restaurants];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const nameMatch = r.name.toLowerCase().includes(q);
        const categoryMatch = r.restaurant_categories?.name?.toLowerCase().includes(q) ?? false;
        const addressMatch = r.address ? r.address.toLowerCase().includes(q) : false;
        return nameMatch || categoryMatch || addressMatch;
      });
    }

    if (selectedTab === 'Rápido') {
      list.sort((a, b) => (a.average_prep_time || 0) - (b.average_prep_time || 0));
    } else if (selectedTab === 'Calificación') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedTab === 'Ventas') {
      list.sort((a, b) => (b.average_prep_time || 0) - (a.average_prep_time || 0));
    }

    return list;
  }, [restaurants, searchQuery, selectedTab]);

  const categoryOptions: CategoryOption[] = [
    { id: null, name: 'Todas' },
    ...categories,
  ];

  const partnersList = useMemo(() => {
    return showAllPartners ? restaurants : restaurants.slice(0, 3);
  }, [restaurants, showAllPartners]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#F8F9FA]">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F29F30" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Ionicons name="cloud-offline-outline" size={40} color="#8E98A8" />
          <Text className="text-center text-sm text-[#8E98A8]">{error}</Text>
          <Pressable
            onPress={onRetry}
            className="rounded-full bg-primary px-6 py-3 active:opacity-70"
          >
            <Text className="font-semibold text-white">Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={processedRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RestaurantCard restaurant={item} />}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 24,
            flexGrow: 1,
          }}
          ListHeaderComponent={
            <View className="gap-6 pb-6">
              {/* Búsqueda y acceso de invitado */}
              <View className="gap-4 pt-3">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 flex-1 flex-row items-center gap-2.5 rounded-full bg-[#F3F4F6] px-4">
                    <Ionicons name="search-outline" size={20} color="#8E98A8" />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Buscar en Al Toque..."
                      placeholderTextColor="#8E98A8"
                      className="flex-1 text-sm font-medium text-[#1C2433]"
                      returnKeyType="search"
                      clearButtonMode="while-editing"
                    />
                    {searchQuery.length > 0 && (
                      <Pressable
                        onPress={() => setSearchQuery('')}
                        hitSlop={8}
                        accessibilityLabel="Borrar búsqueda"
                      >
                        <Ionicons name="close-circle" size={18} color="#8E98A8" />
                      </Pressable>
                    )}
                  </View>

                  <Pressable
                    onPress={onResetFilters}
                    hitSlop={8}
                    className={`h-12 w-12 items-center justify-center rounded-full ${
                      selectedCategory !== null || searchQuery !== '' || selectedTab !== 'Cercanos'
                        ? 'bg-primary'
                        : 'bg-[#F3F4F6]'
                    } active:opacity-70`}
                    accessibilityLabel="Restablecer filtros"
                  >
                    <Ionicons
                      name="options-outline"
                      size={21}
                      color={
                        selectedCategory !== null || searchQuery !== '' || selectedTab !== 'Cercanos'
                          ? '#FFFFFF'
                          : '#1C2433'
                      }
                    />
                  </Pressable>
                </View>

                {/* Banner de invitación para iniciar sesión */}
                <View className="flex-row items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                    <Ionicons name="person-outline" size={18} color="#F29F30" />
                  </View>
                  <Pressable
                    onPress={() => router.push('/(auth)/login')}
                    className="flex-1 flex-row items-center justify-between gap-2 active:opacity-70"
                  >
                    <Text className="flex-1 text-sm font-medium leading-5 text-[#1C2433]">
                      Inicia sesión para hacer pedidos y ver tu historial
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#F29F30" />
                  </Pressable>
                </View>
              </View>

              {/* Categorías con botón interactivo */}
              <View className="gap-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xl font-semibold text-[#1C2433]">
                    Categorías
                  </Text>
                  <Pressable
                    onPress={() => onSelectCategory(null)}
                    hitSlop={8}
                    className="active:opacity-70"
                  >
                    <Text className={`text-sm font-medium ${selectedCategory === null ? 'text-[#8E98A8]' : 'text-primary font-semibold'}`}>
                      {selectedCategory !== null ? 'Limpiar filtro' : 'Ver todo'}
                    </Text>
                  </Pressable>
                </View>
                <FlatList
                  horizontal
                  data={categoryOptions}
                  keyExtractor={(item) => item.id ?? 'all'}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 20 }}
                  renderItem={({ item }) => (
                    <CategoryChip
                      label={item.name}
                      selected={
                        item.id === null
                          ? selectedCategory === null
                          : selectedCategory === item.id
                      }
                      onPress={() => onSelectCategory(item.id ?? null)}
                    />
                  )}
                />
              </View>

              {/* Mejores socios con carrusel horizontal */}
              {restaurants.length > 0 && (
                <View className="gap-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xl font-semibold text-[#1C2433]">
                      Mejores socios
                    </Text>
                    {restaurants.length > 2 && (
                      <Pressable
                        onPress={() => setShowAllPartners((prev) => !prev)}
                        hitSlop={8}
                        className="active:opacity-70"
                      >
                        <Text className="text-sm font-medium text-primary">
                          {showAllPartners ? 'Ver menos' : 'Ver todo'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <FlatList
                    horizontal
                    data={partnersList}
                    keyExtractor={(item) => `partner-${item.id}`}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: '/(client)/restaurant/[id]',
                            params: { id: item.id },
                          })
                        }
                        className="mr-4 w-[260px] overflow-hidden rounded-2xl bg-white active:opacity-90 shadow-sm"
                      >
                        {item.image_url ? (
                          <Image
                            source={{ uri: item.image_url }}
                            style={{ width: '100%', height: 126 }}
                            contentFit="cover"
                            transition={200}
                          />
                        ) : (
                          <View className="h-[126px] items-center justify-center bg-[#F3F4F6]">
                            <Ionicons
                              name="restaurant-outline"
                              size={40}
                              color="#8E98A8"
                            />
                          </View>
                        )}
                        <View className="gap-2 p-3">
                          <View className="flex-row items-center gap-1.5">
                            <Text
                              className="text-lg font-semibold text-[#1C2433]"
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#10B981"
                            />
                          </View>
                          <View className="flex-row items-center gap-2">
                            <Text className="text-sm font-medium text-[#10B981]">
                              Disponible
                            </Text>
                            {item.restaurant_categories?.name ? (
                              <>
                                <Text className="text-[#C4CAD3]">·</Text>
                                <Text
                                  className="flex-1 text-sm text-[#8E98A8]"
                                  numberOfLines={1}
                                >
                                  {item.restaurant_categories.name}
                                </Text>
                              </>
                            ) : null}
                          </View>
                          <View className="flex-row items-center gap-1.5">
                            <Ionicons name="time" size={14} color="#F59E0B" />
                            <Text className="text-xs font-medium text-[#1C2433]">
                              {item.average_prep_time} min
                            </Text>
                            <Text className="mx-1 text-[#C4CAD3]">·</Text>
                            <Text className="text-xs text-[#8E98A8]">
                              Entrega a domicilio
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    )}
                  />
                </View>
              )}

              {/* Tabs interactivos de filtro y ordenamiento */}
              <View className="flex-row items-center justify-between rounded-2xl bg-white px-2 shadow-sm">
                {FILTER_TABS.map((tab) => {
                  const isActive = selectedTab === tab;
                  return (
                    <Pressable
                      key={tab}
                      onPress={() => setSelectedTab(tab)}
                      className={`items-center px-2 py-3 ${
                        isActive ? 'border-b-2 border-primary' : ''
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          isActive
                            ? 'font-bold text-[#1C2433]'
                            : 'font-medium text-[#8E98A8]'
                        }`}
                      >
                        {tab}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#F29F30"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-3 py-16">
              <Ionicons name="storefront-outline" size={44} color="#8E98A8" />
              <Text className="text-base font-semibold text-[#1C2433]">
                {searchQuery
                  ? `No hay resultados para "${searchQuery}"`
                  : 'No hay restaurantes disponibles'}
              </Text>
              <Text className="text-center text-sm text-[#8E98A8] px-4">
                {searchQuery || selectedCategory
                  ? 'Intenta buscar con otro término o limpia los filtros.'
                  : 'Vuelve a intentarlo más tarde.'}
              </Text>
              {(searchQuery || selectedCategory) && (
                <Pressable
                  onPress={onResetFilters}
                  className="mt-2 rounded-full bg-primary px-5 py-2.5 active:opacity-70"
                >
                  <Text className="text-sm font-semibold text-white">Limpiar filtros</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
