import { supabase } from '@/lib/supabase';

export interface DriverLocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  isActive?: boolean;
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
    heading: location.heading ?? null,
    speed: location.speed ?? null,
    accuracy: location.accuracy ?? null,
    isActive: location.isActive ?? true,
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

/** Activa o desactiva la visibilidad del repartidor (en línea / desconectado). */
export async function setDriverActiveStatus(driverId: string, isActive: boolean) {
  const { data: existing, error: lookupError } = await supabase
    .from('driver_locations')
    .select('id')
    .eq('driver_id', driverId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError || !existing) return;

  const { error } = await supabase
    .from('driver_locations')
    .update({ isActive, updated_at: new Date().toISOString() })
    .eq('id', existing.id);
  if (error) throw error;
}

/** Obtiene el estado actual de conexión del repartidor. */
export async function getDriverActiveStatus(driverId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('driver_locations')
    .select('isActive')
    .eq('driver_id', driverId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return true;
  return data.isActive ?? true;
}

