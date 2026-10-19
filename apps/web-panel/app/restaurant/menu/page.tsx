'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/utils/firebase/session';
import { redirect } from 'next/navigation';
import CategoryForm from './CategoryForm';
import OptionGroupsManager from './OptionGroupsManager';
import MenuItemForm from './MenuItemForm';
import MenuGrid from './MenuGrid';
import RestaurantSelector from '@/components/RestaurantSelector';

interface PageProps {
  searchParams: Promise<{ restaurantId?: string }>;
}

export default async function RestaurantMenuPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;

  const { data: restaurants, error: restError } = await supabase
    .from('restaurants')
    .select('id, name, image_url')
    .eq('owner_id', user.id)
    .order('name');

  if (restError || !restaurants || restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--ink-secondary)' }}>No se encontró un restaurante asociado a tu cuenta.</p>
      </div>
    );
  }

  const restaurant =
    (resolvedParams?.restaurantId
      ? restaurants.find((r) => r.id === resolvedParams.restaurantId)
      : null) || restaurants[0];

  // 1. Categorías activas
  const { data: categories, error: catError } = await supabase
    .from('menu_categories')
    .select('id, name, description, sortOrder, isActive')
    .eq('restaurant_id', restaurant.id)
    .eq('isActive', true)
    .order('sortOrder', { ascending: true })
    .order('name');

  if (catError) {
    console.error('Error fetching categories:', catError);
    return <div style={{ color: 'var(--danger)' }}>Error al cargar categorías: {catError.message}</div>;
  }

  // 2. Platos
  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select('id, name, description, price, image_url, is_active, menu_category_id')
    .eq('restaurant_id', restaurant.id)
    .order('name', { ascending: true });

  if (itemsError) {
    console.error('Error fetching menu items:', itemsError);
    return <div style={{ color: 'var(--danger)' }}>Error al cargar platos: {itemsError.message}</div>;
  }

  // 3. Grupos de opciones y sus opciones
  const { data: rawOptionGroups, error: optError } = await supabase
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
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: true });

  if (optError) {
    console.error('Error fetching option groups:', optError);
  }

  const optionGroups = (rawOptionGroups ?? []).map((g) => ({
    ...g,
    options: (g.options ?? []).map((o) => ({
      ...o,
      extraPrice: Number(o.extraPrice) || 0,
    })),
  }));

  // 4. Relación platos y grupos de opciones
  const itemIds = (items ?? []).map((i) => i.id);
  const { data: itemOptionGroups } =
    itemIds.length > 0
      ? await supabase
          .from('menu_item_option_groups')
          .select('menu_item_id, group_id')
          .in('menu_item_id', itemIds)
      : { data: [] };

  const itemGroupMap = new Map<string, string[]>();
  (itemOptionGroups ?? []).forEach((rel) => {
    const list = itemGroupMap.get(rel.menu_item_id) ?? [];
    list.push(rel.group_id);
    itemGroupMap.set(rel.menu_item_id, list);
  });

  const itemsWithOptionGroups = (items ?? []).map((item) => ({
    ...item,
    optionGroupIds: itemGroupMap.get(item.id) ?? [],
  }));

  // Contar platos por categoría
  const categoryCounts = new Map<string, number>();
  (items ?? []).forEach((item) => {
    if (item.menu_category_id) {
      categoryCounts.set(
        item.menu_category_id,
        (categoryCounts.get(item.menu_category_id) || 0) + 1,
      );
    }
  });

  const categoriesWithCounts = (categories ?? []).map((cat) => ({
    ...cat,
    itemCount: categoryCounts.get(cat.id) || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Gestión de Menú</h1>
          <p className="page-subtitle">Categorías, opciones y platos de {restaurant.name}</p>
        </div>
        <RestaurantSelector restaurants={restaurants} currentId={restaurant.id} />
      </div>

      {/* 1. Categorías */}
      <section className="section-card p-6">
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '16px' }}>
          Categorías de Menú
        </h2>
        <CategoryForm restaurantId={restaurant.id} categories={categoriesWithCounts} />
      </section>

      {/* 2. Grupos de Opciones y Adicionales (Punto E) */}
      <section className="section-card p-6">
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
          Grupos de Opciones y Adicionales
        </h2>
        <OptionGroupsManager
          restaurantId={restaurant.id}
          optionGroups={optionGroups}
        />
      </section>

      {/* 3. Agregar Plato */}
      <section className="section-card p-6">
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '16px' }}>
          Agregar Plato
        </h2>
        <MenuItemForm
          restaurantId={restaurant.id}
          categories={categories ?? []}
          optionGroups={optionGroups}
        />
      </section>

      {/* 4. Catálogo de Platos */}
      <section className="section-card p-6">
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '16px' }}>
          Catálogo de Platos
        </h2>
        <MenuGrid
          items={itemsWithOptionGroups}
          categories={categories ?? []}
          optionGroups={optionGroups}
          restaurantId={restaurant.id}
        />
      </section>
    </div>
  );
}
