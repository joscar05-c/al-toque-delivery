import { supabase } from '@/lib/supabase';
import type {
  MenuCategory,
  MenuItem,
  Restaurant,
  RestaurantCategory,
  RestaurantDeliveryConfig,
} from '@delivery/shared';

/** Restaurante con el nombre de su categoría embebido (join N:1). */
export type RestaurantWithCategory = Restaurant & {
  restaurant_categories: Pick<RestaurantCategory, 'name'> | null;
};

/** Detalle de restaurante + categoría + configuración de delivery (join 1:1). */
export type RestaurantDetail = Restaurant & {
  restaurant_categories: Pick<RestaurantCategory, 'name'> | null;
  restaurant_delivery_config: RestaurantDeliveryConfig | null;
};

/** Sección del menú lista para SectionList. category=null agrupa platos sin categoría. */
export interface MenuSection {
  category: MenuCategory | null;
  data: MenuItem[];
}

/** Categorías de restaurantes activas (Pollos, Chifa, etc.), orden alfabético. */
export async function fetchRestaurantCategories(): Promise<RestaurantCategory[]> {
  const { data, error } = await supabase
    .from('restaurant_categories')
    .select('*')
    .eq('isActive', true)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

/** Restaurantes activos, opcionalmente filtrados por categoría. */
export async function fetchActiveRestaurants(
  categoryId?: string,
): Promise<RestaurantWithCategory[]> {
  let query = supabase
    .from('restaurants')
    .select('*, restaurant_categories(name)')
    .eq('is_active', true)
    .order('name');

  if (categoryId) {
    query = query.eq('restaurant_category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;
  // Cast explícito: la forma del join está documentada por nuestros DTOs
  // (los tipos se derivan del DDL, que es la fuente de verdad).
  return (data ?? []) as RestaurantWithCategory[];
}

/** Detalle completo de un restaurante, incluyendo su config de entrega (1:1). */
export async function fetchRestaurantById(id: string): Promise<RestaurantDetail> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, restaurant_categories(name), restaurant_delivery_config(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as RestaurantDetail;
}

/**
 * Menú de un restaurante: categorías activas (por sortOrder) con sus platos
 * activos ordenados por precio. La RLS de menu_items ya filtra is_active=true,
 * el .eq() es una garantía adicional a nivel de query.
 */
export async function fetchRestaurantMenu(
  restaurantId: string,
): Promise<MenuSection[]> {
  const [categoriesRes, itemsRes] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('isActive', true)
      .order('sortOrder'),
    supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('price'),
  ]);

  if (categoriesRes.error) throw categoriesRes.error;
  if (itemsRes.error) throw itemsRes.error;

  // Agrupar platos por categoría de menú.
  const itemsByCategory = new Map<string, MenuItem[]>();
  const uncategorized: MenuItem[] = [];

  for (const item of itemsRes.data ?? []) {
    if (item.menu_category_id) {
      const list = itemsByCategory.get(item.menu_category_id) ?? [];
      list.push(item);
      itemsByCategory.set(item.menu_category_id, list);
    } else {
      uncategorized.push(item);
    }
  }

  // Solo se muestran categorías que tengan al menos un plato.
  const sections: MenuSection[] = (categoriesRes.data ?? [])
    .map((category) => ({
      category,
      data: itemsByCategory.get(category.id) ?? [],
    }))
    .filter((section) => section.data.length > 0);

  if (uncategorized.length > 0) {
    sections.push({ category: null, data: uncategorized });
  }

  return sections;
}
