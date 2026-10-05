'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/utils/firebase/session';
import { redirect } from 'next/navigation';
import DeliveryConfigForm from './DeliveryConfigForm';
import DriverForm from './DriverForm';
import DriverList from './DriverList';

export default async function RestaurantConfigPage() {
  const supabase = await createClient();

  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (restError || !restaurant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró un restaurante asociado a tu cuenta.</p>
      </div>
    );
  }

  const { data: config, error: configError } = await supabase
    .from('restaurant_delivery_config')
    .select('delivery_fee, free_delivery_threshold')
    .eq('restaurant_id', restaurant.id)
    .single();

  if (configError && configError.code !== 'PGRST116') {
    console.error('Error fetching delivery config:', configError);
  }

  const { data: drivers, error: driversError } = await supabase
    .from('restaurant_drivers')
    .select('driver_id, is_active, created_at, users:driver_id (id, email, phone, name)')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true);

  if (driversError) {
    console.error('Error fetching drivers:', driversError);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Restaurante</h1>
        <p className="mt-1 text-gray-600">Tarifas de delivery y flota de repartidores</p>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarifas de Delivery</h2>
        <DeliveryConfigForm
          restaurantId={restaurant.id}
          initialBaseCost={config?.delivery_fee ?? 5}
          initialFreeThreshold={config?.free_delivery_threshold ?? null}
        />
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mi Flota de Repartidores</h2>
        <DriverForm restaurantId={restaurant.id} />
        <DriverList drivers={drivers ?? []} restaurantId={restaurant.id} />
      </section>
    </div>
  );
}