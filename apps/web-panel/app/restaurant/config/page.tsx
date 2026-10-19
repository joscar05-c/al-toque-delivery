import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/utils/firebase/session';
import { redirect } from 'next/navigation';
import DeliveryConfigForm from './DeliveryConfigForm';
import DriverForm from './DriverForm';
import DriverList from './DriverList';
import RestaurantCoverForm from './RestaurantCoverForm';
import RestaurantProfileForm from './RestaurantProfileForm';
import RestaurantSelector from '@/components/RestaurantSelector';

interface PageProps {
  searchParams: Promise<{ restaurantId?: string }>;
}

export default async function RestaurantConfigPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;

  // 1. Obtener todos los restaurantes del dueño
  const { data: restaurants, error: restError } = await supabase
    .from('restaurants')
    .select('id, name, phone, address, city, image_url, average_prep_time, is_active, restaurant_category_id')
    .eq('owner_id', user.id)
    .order('name');

  if (restError || !restaurants || restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--ink-secondary)' }}>No se encontró un restaurante asociado a tu cuenta.</p>
      </div>
    );
  }

  // 2. Determinar restaurante activo
  const restaurant =
    (resolvedParams?.restaurantId
      ? restaurants.find((r) => r.id === resolvedParams.restaurantId)
      : null) || restaurants[0];

  // 3. Obtener categorías gastronómicas disponibles
  const { data: categories } = await supabase
    .from('restaurant_categories')
    .select('id, name')
    .eq('isActive', true)
    .order('name');

  // 4. Obtener configuración de delivery
  const { data: config, error: configError } = await supabase
    .from('restaurant_delivery_config')
    .select('delivery_fee, free_delivery_threshold, min_order_amount, max_delivery_distance, estimated_delivery_time, is_delivery_enabled, delivery_type')
    .eq('restaurant_id', restaurant.id)
    .maybeSingle();

  if (configError) {
    console.error('Error fetching delivery config:', configError);
  }

  // 5. Obtener repartidores propios vinculados
  const { data: drivers, error: driversError } = await supabase
    .from('restaurant_drivers')
    .select('driver_id, is_active, created_at, users:driver_id (id, email, phone, name)')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true);

  if (driversError) {
    console.error('Error fetching drivers:', driversError);
  }

  return (
    <div className="space-y-6">
      {/* Cabecera y Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Configuración del Restaurante</h1>
          <p className="page-subtitle">
            Horarios, datos del negocio, cobertura de delivery y repartidores
          </p>
        </div>
        <RestaurantSelector restaurants={restaurants} currentId={restaurant.id} />
      </div>

      {/* Sección 1: Datos Operativos y Comerciales del Restaurante */}
      <section className="section-card p-6">
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '16px' }}>
          Operación y Datos del Local
        </h2>
        <RestaurantProfileForm
          restaurant={restaurant}
          categories={categories ?? []}
        />
      </section>

      {/* Sección 2: Portada del Restaurante */}
      <section className="section-card p-6">
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '16px' }}>
          Foto de Portada del Restaurante
        </h2>
        <RestaurantCoverForm
          restaurantId={restaurant.id}
          initialImageUrl={restaurant.image_url}
        />
      </section>

      {/* Sección 3: Tarifas y Políticas de Delivery */}
      <section className="section-card p-6">
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '16px' }}>
          Políticas y Cobertura de Delivery
        </h2>
        <DeliveryConfigForm
          restaurantId={restaurant.id}
          config={config ?? null}
        />
      </section>

      {/* Sección 4: Flota de Repartidores Propios (Solo aplica para Flota Propia) */}
      {config?.is_delivery_enabled && config?.delivery_type === 'restaurant_own' && (
        <section className="section-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>
              Mi Flota de Repartidores Propios
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Modo Flota Propia
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--ink-secondary)' }}>
            Vincula a los repartidores motorizados de tu negocio mediante su correo o teléfono registrado en Al Toque para despachar órdenes.
          </p>
          <DriverForm restaurantId={restaurant.id} />
          <DriverList drivers={drivers ?? []} restaurantId={restaurant.id} />
        </section>
      )}
    </div>
  );
}
