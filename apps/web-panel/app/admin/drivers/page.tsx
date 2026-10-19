import { redirect } from 'next/navigation';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';
import DriversManager from './DriversManager';
import { DriverItem } from './DriverRow';

export default async function AdminDriversPage() {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) redirect('/dashboard-redirect');

  // Query drivers (users with role_id = 2) and count of pending applications in parallel
  const [driversResult, locationsResult, applicationsCountResult] = await Promise.all([
    access.supabase
      .from('users')
      .select('id, name, email, phone, phone_verified, is_active, created_at')
      .eq('role_id', 2)
      .order('created_at', { ascending: false }),
    access.supabase
      .from('driver_locations')
      .select('driver_id, latitude, longitude, speed, heading, isActive, updated_at')
      .order('updated_at', { ascending: false }),
    access.supabase
      .from('driver_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  if (driversResult.error) {
    console.error('[AdminDriversPage] Error cargando repartidores:', driversResult.error);
    return (
      <div className="section-card p-5" style={{ color: 'var(--danger)' }}>
        <p className="font-semibold text-sm">Error al cargar repartidores</p>
        <p className="text-xs mt-1 opacity-80">{driversResult.error.message}</p>
      </div>
    );
  }

  // Map locations by driver_id (taking the latest location)
  const locationMap = new Map<string, any>();
  if (locationsResult.data) {
    for (const loc of locationsResult.data) {
      if (!locationMap.has(loc.driver_id)) {
        locationMap.set(loc.driver_id, loc);
      }
    }
  }

  const rawDrivers = driversResult.data ?? [];
  const drivers: DriverItem[] = rawDrivers.map((u) => ({
    ...u,
    location: locationMap.get(u.id) || null,
  }));

  const pendingCount = applicationsCountResult.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Repartidores y Flota</h1>
        <p className="page-subtitle">
          Supervisa el estado de la flota de motorizados, su última ubicación GPS y habilita o suspende cuentas.
        </p>
      </div>

      <DriversManager
        drivers={drivers}
        pendingApplicationsCount={pendingCount}
      />
    </div>
  );
}
