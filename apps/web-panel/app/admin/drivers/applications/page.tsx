import { redirect } from 'next/navigation';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';
import DriverApplicationsList from './DriverApplicationsList';
import { DriverApplicationItem } from './DriverApplicationRow';

export default async function AdminDriverApplicationsPage() {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) redirect('/dashboard-redirect');

  const { data: rawApplications, error } = await access.supabase
    .from('driver_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AdminDriverApplicationsPage] Error cargando postulaciones:', error);
    return (
      <div className="section-card p-5" style={{ color: 'var(--danger)' }}>
        <p className="font-semibold text-sm">Error al cargar las solicitudes de repartidores</p>
        <p className="text-xs mt-1 opacity-80">{error.message}</p>
      </div>
    );
  }

  const applications = (rawApplications ?? []) as unknown as DriverApplicationItem[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Solicitudes de Repartidores</h1>
        <p className="page-subtitle">
          Audita y valida documentos de identidad, licencias de conducir y vehículos para autorizar a nuevos repartidores.
        </p>
      </div>

      <DriverApplicationsList applications={applications} />
    </div>
  );
}
