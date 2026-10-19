'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/utils/firebase/session';
import { redirect } from 'next/navigation';
import ApplicationsList from './ApplicationsList';
import { ApplicationItem } from './ApplicationRow';

export default async function AdminApplicationsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  const { data: rawApplications, error } = await supabase
    .from('restaurant_applications')
    .select(`
      id,
      business_name,
      business_phone,
      business_email,
      address,
      city,
      owner_name,
      owner_dni,
      additional_comments,
      status,
      admin_notes,
      reviewed_at,
      created_at,
      category:restaurant_categories(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return (
      <div className="section-card p-5" style={{ color: 'var(--danger)' }}>
        <p className="font-semibold text-sm">Error al cargar las solicitudes</p>
        <p className="text-xs mt-1 opacity-80">{error.message}</p>
      </div>
    );
  }

  const applications = (rawApplications ?? []) as unknown as ApplicationItem[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Solicitudes de Restaurantes</h1>
        <p className="page-subtitle">
          Revisa, aprueba o rechaza solicitudes de afiliación comercial a la plataforma.
        </p>
      </div>

      <ApplicationsList applications={applications} />
    </div>
  );
}
