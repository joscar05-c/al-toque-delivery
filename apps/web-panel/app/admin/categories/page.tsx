'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/utils/firebase/session';
import { redirect } from 'next/navigation';
import CategoryForm from './CategoryForm';
import CategoryList from './CategoryList';
import { CategoryItem } from './CategoryEditModal';

export default async function AdminCategoriesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  const { data: rawCategories, error } = await supabase
    .from('restaurant_categories')
    .select('id, name, description, icon, isActive, created_at')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return (
      <div className="section-card p-5" style={{ color: 'var(--danger)' }}>
        <p className="font-semibold text-sm">Error al cargar categorías</p>
        <p className="text-xs mt-1 opacity-80">{error.message}</p>
      </div>
    );
  }

  const categories = (rawCategories ?? []) as unknown as CategoryItem[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Categorías Globales</h1>
          <p className="page-subtitle">
            Organiza los tipos de cocina y negocios visibles en la plataforma ({categories.length} registradas)
          </p>
        </div>

        <CategoryForm />
      </div>

      <CategoryList categories={categories} />
    </div>
  );
}
