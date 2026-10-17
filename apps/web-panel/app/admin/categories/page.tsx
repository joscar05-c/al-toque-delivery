'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/utils/firebase/session';
import { redirect } from 'next/navigation';
import CategoryForm from './CategoryForm';
import CategoryRow from './CategoryRow';

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const user = await getSessionUser();

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
        <h1 className="page-title">Categorías Globales</h1>
        <p className="page-subtitle">Gestión de categorías de restaurantes</p>
      </div>

      <CategoryForm />

      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="panel-table w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories?.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: '14px' }}>
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
    </div>
  );
}
