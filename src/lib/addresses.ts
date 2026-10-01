import { supabase } from '@/lib/supabase';
import type { Address, TablesInsert } from '@/types/database.types';

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

/** Crea una dirección. Si es default, limpia el default anterior del usuario. */
export async function createAddress(
  input: TablesInsert<'addresses'>,
): Promise<Address> {
  if (input.is_default && input.user_id) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', input.user_id);
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}
