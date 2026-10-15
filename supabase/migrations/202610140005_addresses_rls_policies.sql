-- Políticas RLS para la tabla addresses
--
-- Importante: este proyecto usa Firebase Auth con Third-Party Auth de Supabase.
-- auth.uid() castea a UUID y Firebase UIDs NO son UUIDs válidos, por eso
-- devuelve NULL. Usamos auth.jwt() ->> 'sub' que sí devuelve el Firebase UID como texto.

-- Permitir al usuario ver SUS PROPIAS direcciones
CREATE POLICY "addresses_select_own"
  ON addresses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

-- Permitir al usuario crear SUS PROPIAS direcciones
CREATE POLICY "addresses_insert_own"
  ON addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Permitir al usuario actualizar SUS PROPIAS direcciones
CREATE POLICY "addresses_update_own"
  ON addresses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Permitir al usuario eliminar SUS PROPIAS direcciones
CREATE POLICY "addresses_delete_own"
  ON addresses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');
