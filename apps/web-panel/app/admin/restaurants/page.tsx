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
      <div className="space-y-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold">
          No se pudieron cargar los datos para crear el restaurante.
        </p>
        <p>{detail}</p>
      </div>
    );
  }

  const owners = ownersResult.data ?? [];
  const categories = categoriesResult.data ?? [];

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Crear restaurante</h1>
        <p className="mt-1 text-gray-600">
          Asigna el restaurante a una cuenta existente. Al crearlo, esa cuenta
          recibirá el rol de propietario.
        </p>
      </header>

      {owners.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No hay cuentas disponibles. El propietario debe iniciar sesión con su
          teléfono al menos una vez para que Firebase cree su perfil.
        </p>
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
