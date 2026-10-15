import { supabase } from '@/lib/supabase';
import type { Address, TablesInsert } from '@delivery/shared';

/** Direcciones del usuario (RLS: user_id = auth.uid()). Default primero. */
export async function fetchUserAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Crea una dirección. Si es default, la función RPC limpia el default anterior. */
export async function createAddress(
  input: Omit<TablesInsert<'addresses'>, 'location'> & {
    latitude: number;
    longitude: number;
  },
): Promise<Address> {
  const { data, error } = await supabase.rpc('create_address', {
    p_user_id: input.user_id ?? '',
    p_street: input.street,
    p_city: input.city,
    p_postal_code: input.postal_code,
    p_reference: input.reference ?? '',
    p_type: input.type ?? 'home',
    p_is_default: input.is_default ?? false,
    p_latitude: input.latitude,
    p_longitude: input.longitude,
  });

  if (error) {
    throw new Error(
      `Error ${error.code}: ${error.message}${error.details ? `\nDetalles: ${error.details}` : ''}${error.hint ? `\n${error.hint}` : ''}`,
    );
  }
  
  if (!data || data.length === 0) {
    throw new Error('No se pudo crear la dirección (sin datos retornados)');
  }

  return data[0];
}
