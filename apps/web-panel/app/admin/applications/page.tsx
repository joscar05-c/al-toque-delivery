'use server';

import { createClient } from '@/utils/supabase/server';
import ApplicationRow from './ApplicationRow';
import { redirect } from 'next/navigation';

export default async function AdminApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: applications, error } = await supabase
    .from('restaurant_applications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return (
      <div className="text-red-600">
        Error al cargar solicitudes: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Solicitudes Pendientes</h1>
        <p className="mt-1 text-gray-600">
          {applications?.length ?? 0} solicitud{applications?.length === 1 ? '' : 'es'} esperando revisión
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Negocio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dirección
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ciudad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No hay solicitudes pendientes
                </td>
              </tr>
            ) : (
              applications?.map((app) => (
                <ApplicationRow key={app.id} application={app} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}