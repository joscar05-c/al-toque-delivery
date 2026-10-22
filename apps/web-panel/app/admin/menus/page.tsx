import { redirect } from 'next/navigation';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';
import MenuAdminView, { MenuItemData } from './MenuAdminView';

export const dynamic = 'force-dynamic';

export default async function AdminMenusPage({
  searchParams,
}: {
  searchParams: Promise<{ restaurantId?: string }>;
}) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) redirect('/dashboard-redirect');

  const params = await searchParams;

  // 1. Fetch all restaurants
  const { data: restaurants, error: restError } = await access.supabase
    .from('restaurants')
    .select('id, name, city')
    .order('name');

  if (restError) {
    console.error('[AdminMenusPage] Error cargando restaurantes:', restError);
    return (
      <div className="section-card p-5" style={{ color: 'var(--danger)' }}>
        <p className="font-semibold text-sm">Error al cargar restaurantes</p>
        <p className="text-xs mt-1 opacity-80">{restError.message}</p>
      </div>
    );
  }

  const restaurantList = restaurants ?? [];
  const selectedRestId = params.restaurantId || restaurantList[0]?.id || '';

  // 2. Fetch categories and items for the selected restaurant
  let categories: Array<{ id: string; name: string }> = [];
  let items: MenuItemData[] = [];

  if (selectedRestId) {
    const [categoriesResult, itemsResult] = await Promise.all([
      access.supabase
        .from('menu_categories')
        .select('id, name')
        .eq('restaurant_id', selectedRestId)
        .order('sortOrder'),
      access.supabase
        .from('menu_items')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          is_active,
          restaurant_id,
          menu_category_id,
          category:menu_categories(id, name)
        `)
        .eq('restaurant_id', selectedRestId)
        .order('name'),
    ]);

    categories = categoriesResult.data ?? [];
    items = (itemsResult.data ?? []) as unknown as MenuItemData[];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Supervisión de Menús y Catálogo</h1>
        <p className="page-subtitle">
          Audita la carta de productos, precios y disponibilidad de cualquier restaurante de la plataforma.
        </p>
      </div>

      {restaurantList.length === 0 ? (
        <div className="section-card p-8 text-center text-gray-500">
          No hay restaurantes dados de alta para auditar sus cartas.
        </div>
      ) : (
        <MenuAdminView
          restaurants={restaurantList}
          selectedRestaurantId={selectedRestId}
          categories={categories}
          items={items}
        />
      )}
    </div>
  );
}
