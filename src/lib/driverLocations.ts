import { supabase } from '@/lib/supabase';

export interface DriverLocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
}

/** driver_locations has no unique driver_id; update the latest row or insert. */
export async function saveDriverLocation(location: DriverLocationUpdate) {
  const { data: existing, error: lookupError } = await supabase
    .from('driver_locations')
    .select('id')
    .eq('driver_id', location.driverId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;

  const values = {
    driver_id: location.driverId,
    latitude: location.latitude,
    longitude: location.longitude,
    heading: location.heading,
    speed: location.speed,
    accuracy: location.accuracy,
    isActive: true,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from('driver_locations')
      .update(values)
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('driver_locations').insert(values);
  if (error) throw error;
}
