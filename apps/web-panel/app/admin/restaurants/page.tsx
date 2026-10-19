import { redirect } from 'next/navigation';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';
import RestaurantsManager from './RestaurantsManager';
import { RestaurantItem } from './RestaurantEditModal';

const CITIES = [
  { value: 'bagua', label: 'Bagua' },
  { value: 'jaen', label: 'Jaén' },
  { value: 'chachapoyas', label: 'Chachapoyas' },
  { value: 'other', label: 'Otra ciudad' },
] as const;

export default async function AdminRestaurantsPage() {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) redirect('/dashboard-redirect');

  const [restaurantsResult, ownersResult, categoriesResult] = await Promise.all([
    access.supabase
      .from('restaurants')
      .select(`
        id,
        name,
        address,
        phone,
        city,
        image_url,
        average_prep_time,
        is_active,
        rating,
        total_reviews,
        is_partner,
        sales_count,
        created_at,
        owner_id,
        restaurant_category_id,
        category:restaurant_categories(id, name),
        owner:users!owner_id(id, name, phone, email)
      `)
      .order('created_at', { ascending: false }),
    access.supabase.rpc('admin_list_restaurant_owner_candidates', {}),
    access.supabase
      .from('restaurant_categories')
      .select('id, name')
      .eq('isActive', true)
      .order('name'),
  ]);

  if (restaurantsResult.error) {
    console.error('[AdminRestaurantsPage] Error cargando restaurantes:', restaurantsResult.error);
    return (
      <div className="section-card p-5" style={{ color: 'var(--danger)' }}>
        <p className="font-semibold text-sm">No se pudieron cargar los restaurantes</p>
        <p className="text-xs mt-1 opacity-80">{restaurantsResult.error.message}</p>
      </div>
    );
  }

  const restaurants = (restaurantsResult.data ?? []) as unknown as RestaurantItem[];
  const owners = ownersResult.data ?? [];
  const categories = categoriesResult.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Restaurantes</h1>
        <p className="page-subtitle">
          Supervisa los comercios afiliados, gestiona su estado activo/pausado y edita sus perfiles.
        </p>
      </div>

      <RestaurantsManager
        restaurants={restaurants}
        owners={owners}
        categories={categories}
        cities={CITIES}
      />
    </div>
  );
}
