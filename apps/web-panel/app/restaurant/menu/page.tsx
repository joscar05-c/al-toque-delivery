'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/utils/firebase/session';
import { redirect } from 'next/navigation';
import CategoryForm from './CategoryForm';
import MenuItemForm from './MenuItemForm';
import MenuGrid from './MenuGrid';

export default async function RestaurantMenuPage() {
  const supabase = await createClient();

  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (restError || !restaurant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró un restaurante asociado a tu cuenta.</p>
      </div>
    );
  }

  const { data: categories, error: catError } = await supabase
    .from('menu_categories')
    .select('id, name')
    .eq('restaurant_id', restaurant.id)
    .eq('isActive', true)
    .order('name');

  if (catError) {
    console.error('Error fetching categories:', catError);
    return <div className="text-red-600">Error al cargar categorías: {catError.message}</div>;
  }

  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select('id, name, description, price, image_url, is_active, menu_category_id')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false });

  if (itemsError) {
    console.error('Error fetching menu items:', itemsError);
    return <div className="text-red-600">Error al cargar platos: {itemsError.message}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Menú</h1>
        <p className="mt-1 text-gray-600">Categorías y platos de tu restaurante</p>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorías de Menú</h2>
        <CategoryForm restaurantId={restaurant.id} />
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Agregar Plato</h2>
        <MenuItemForm restaurantId={restaurant.id} categories={categories ?? []} />
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platos del Menú</h2>
        <MenuGrid items={items ?? []} />
      </section>
    </div>
  );
}