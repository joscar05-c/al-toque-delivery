'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/utils/firebase/session';
import ApplicationRow from './ApplicationRow';
import { redirect } from 'next/navigation';

export default async function AdminApplicationsPage() {
  const supabase = await createClient();

  const user = await getSessionUser();

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
      <div style={{ color: 'var(--danger)' }}>
        Error al cargar solicitudes: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Solicitudes Pendientes</h1>
        <p className="page-subtitle">
          {applications?.length ?? 0} solicitud{applications?.length === 1 ? '' : 'es'} esperando revisión
        </p>
      </div>

      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="panel-table w-full">
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Ciudad</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {applications?.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: '14px' }}>
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
    </div>
  );
}
