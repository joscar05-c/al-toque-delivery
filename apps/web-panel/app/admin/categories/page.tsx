'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import CategoryForm from './CategoryForm';
import CategoryRow from './CategoryRow';

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: categories, error } = await supabase
    .from('restaurant_categories')
    .select('id, name, isActive')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return <div className="text-red-600">Error al cargar categorías: {error.message}</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Categorías Globales</h1>
        <p className="mt-1 text-gray-600">Gestión de categorías de restaurantes</p>
      </div>

      <CategoryForm />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No hay categorías registradas
                </td>
              </tr>
            ) : (
              categories?.map((cat) => <CategoryRow key={cat.id} category={cat} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}