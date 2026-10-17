import { redirect } from 'next/navigation';

import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';

import RestaurantCreateForm from './RestaurantCreateForm';

const CITIES = [
  { value: 'bagua', label: 'Bagua' },
  { value: 'jaen', label: 'Jaén' },
  { value: 'chachapoyas', label: 'Chachapoyas' },
  { value: 'other', label: 'Otra ciudad' },
] as const;

export default async function AdminRestaurantsPage() {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) redirect('/dashboard-redirect');

  const [ownersResult, categoriesResult] = await Promise.all([
    access.supabase.rpc('admin_list_restaurant_owner_candidates', {}),
    access.supabase
      .from('restaurant_categories')
      .select('id, name')
      .eq('isActive', true)
      .order('name'),
  ]);

  const queryError = ownersResult.error ?? categoriesResult.error;
  if (queryError) {
    console.error('[AdminRestaurantsPage] Error cargando opciones:', queryError);
    const detail =
      queryError.code === 'PGRST202'
        ? 'No se encuentra el RPC de candidatos. Ejecuta la migración 202610140002_admin_restaurant_owner_candidates.sql en Supabase y vuelve a cargar.'
        : `${queryError.message} (${queryError.code})`;

    return (
      <div className="section-card p-5" style={{ color: 'var(--danger)' }}>
        <p style={{ fontSize: '14px', fontWeight: 600 }}>
          No se pudieron cargar los datos para crear el restaurante.
        </p>
        <p style={{ fontSize: '13px', marginTop: '4px', opacity: 0.8 }}>{detail}</p>
      </div>
    );
  }

  const owners = ownersResult.data ?? [];
  const categories = categoriesResult.data ?? [];

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="page-title">Crear restaurante</h1>
        <p className="page-subtitle">
          Asigna el restaurante a una cuenta existente. Al crearlo, esa cuenta
          recibirá el rol de propietario.
        </p>
      </div>

      {owners.length === 0 ? (
        <div className="section-card p-4" style={{
          background: 'var(--warning-soft)',
          borderColor: 'rgba(217, 119, 6, 0.2)',
          color: '#92400E',
          fontSize: '14px',
        }}>
          No hay cuentas disponibles. El propietario debe iniciar sesión con su
          teléfono al menos una vez para que Firebase cree su perfil.
        </div>
      ) : (
        <RestaurantCreateForm
          owners={owners}
          categories={categories}
          cities={CITIES}
        />
      )}
    </div>
  );
}
