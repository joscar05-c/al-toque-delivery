import { fetchDriverOrders, type DriverOrder } from '@/lib/driverOrders';
import { supabase } from '@/lib/supabase';
import type { DriverProfile, DriverTypeCode } from '@delivery/shared';

export interface LinkedRestaurantSummary {
  id: string;
  name: string;
  address: string;
  city: string | null;
}

export interface DriverDeliveryStats {
  deliveredToday: number;
  deliveredThisMonth: number;
  totalDelivered: number;
  totalCancelled: number;
  totalDeliveredAmount: number;
}

export interface DriverFullProfile {
  profile: DriverProfile | null;
  driverTypeCode: DriverTypeCode;
  driverTypeLabel: string;
  linkedRestaurants: LinkedRestaurantSummary[];
  stats: DriverDeliveryStats;
  recentHistory: DriverOrder[];
}

export async function fetchDriverFullProfile(
  driverId: string,
): Promise<DriverFullProfile> {
  const [profileRes, linksRes, historyRes] = await Promise.all([
    supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', driverId)
      .maybeSingle(),
    supabase
      .from('restaurant_drivers')
      .select('restaurant_id, restaurants(id, name, address, city)')
      .eq('driver_id', driverId)
      .eq('is_active', true),
    fetchDriverOrders(driverId, true),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (linksRes.error) throw linksRes.error;

  const driverTypeCode: DriverTypeCode =
    profileRes.data?.driver_type_code === 'restaurant_own'
      ? 'restaurant_own'
      : 'platform';

  const driverTypeLabel =
    driverTypeCode === 'restaurant_own'
      ? 'Flota Propia de Restaurante'
      : 'Red Al Toque (Plataforma)';

  const linkedRestaurants: LinkedRestaurantSummary[] = (linksRes.data ?? [])
    .map((row) => {
      const r = Array.isArray(row.restaurants)
        ? row.restaurants[0]
        : row.restaurants;
      return r as LinkedRestaurantSummary | null;
    })
    .filter((r): r is LinkedRestaurantSummary => Boolean(r));

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).getTime();

  let deliveredToday = 0;
  let deliveredThisMonth = 0;
  let totalDelivered = 0;
  let totalCancelled = 0;
  let totalDeliveredAmount = 0;

  for (const order of historyRes.orders) {
    if (order.status === 'delivered') {
      totalDelivered += 1;
      totalDeliveredAmount += Number(order.total || 0);
      const updatedMs = new Date(order.updated_at).getTime();
      if (updatedMs >= startOfToday) deliveredToday += 1;
      if (updatedMs >= startOfMonth) deliveredThisMonth += 1;
    } else if (order.status === 'cancelled') {
      totalCancelled += 1;
    }
  }

  return {
    profile: profileRes.data,
    driverTypeCode,
    driverTypeLabel,
    linkedRestaurants,
    stats: {
      deliveredToday,
      deliveredThisMonth,
      totalDelivered,
      totalCancelled,
      totalDeliveredAmount,
    },
    recentHistory: historyRes.orders,
  };
}

