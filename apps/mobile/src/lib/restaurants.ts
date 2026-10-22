import { supabase } from '@/lib/supabase';
import type {
  MenuCategory,
  MenuItem,
  Restaurant,
  RestaurantCategory,
  RestaurantDeliveryConfig,
} from '@delivery/shared';

/** Restaurante con categoría, configuración de delivery y platos embebidos. */
export type RestaurantWithCategory = Restaurant & {
  restaurant_categories: Pick<RestaurantCategory, 'name'> | null;
  restaurant_delivery_config: RestaurantDeliveryConfig | null;
  menu_items?: { name: string }[];
};

/** Detalle de restaurante + categoría + configuración de delivery (join 1:1). */
export type RestaurantDetail = Restaurant & {
  restaurant_categories: Pick<RestaurantCategory, 'name'> | null;
  restaurant_delivery_config: RestaurantDeliveryConfig | null;
};

export interface OptionItem {
  id: string;
  name: string;
  extraPrice: number;
  isActive: boolean;
}

export interface OptionGroup {
  id: string;
  name: string;
  description: string | null;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: OptionItem[];
}

export type MenuItemWithOptions = MenuItem & {
  option_groups?: OptionGroup[];
};

/** Sección del menú lista para SectionList. category=null agrupa platos sin categoría. */
export interface MenuSection {
  category: MenuCategory | null;
  data: MenuItemWithOptions[];
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
    .select('*, restaurant_categories(name), restaurant_delivery_config(*), menu_items(name)')
    .eq('is_active', true)
    .order('name');

  if (categoryId) {
    query = query.eq('restaurant_category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as RestaurantWithCategory[];
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
 * Menú de un restaurante: categorías activas con sus platos activos y sus
 * grupos de opciones y adicionales (Punto E).
 */
export async function fetchRestaurantMenu(
  restaurantId: string,
): Promise<MenuSection[]> {
  const [categoriesRes, itemsRes, groupsRes, relationsRes] = await Promise.all([
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
    supabase
      .from('menu_option_groups')
      .select(`
        id,
        name,
        description,
        minSelect,
        maxSelect,
        isRequired,
        options:menu_options(id, name, extraPrice, isActive)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at'),
    supabase
      .from('menu_item_option_groups')
      .select('menu_item_id, group_id'),
  ]);

  if (categoriesRes.error) throw categoriesRes.error;
  if (itemsRes.error) throw itemsRes.error;

  // Mapa de grupos por ID
  const groupMap = new Map<string, OptionGroup>();
  for (const g of groupsRes.data ?? []) {
    groupMap.set(g.id, {
      id: g.id,
      name: g.name,
      description: g.description,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      isRequired: g.isRequired,
      options: (g.options ?? [])
        .filter((o) => o.isActive)
        .map((o) => ({
          id: o.id,
          name: o.name,
          extraPrice: Number(o.extraPrice) || 0,
          isActive: o.isActive,
        })),
    });
  }

  // Mapa de platos con sus grupos de opciones asociados
  const itemGroupsMap = new Map<string, OptionGroup[]>();
  for (const rel of relationsRes.data ?? []) {
    const grp = groupMap.get(rel.group_id);
    if (grp) {
      const list = itemGroupsMap.get(rel.menu_item_id) ?? [];
      list.push(grp);
      itemGroupsMap.set(rel.menu_item_id, list);
    }
  }

  // Agrupar platos por categoría de menú
  const itemsByCategory = new Map<string, MenuItemWithOptions[]>();
  const uncategorized: MenuItemWithOptions[] = [];

  for (const rawItem of itemsRes.data ?? []) {
    const item: MenuItemWithOptions = {
      ...rawItem,
      option_groups: itemGroupsMap.get(rawItem.id) ?? [],
    };

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
