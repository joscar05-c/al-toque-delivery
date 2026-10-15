# Migración de direcciones (PostGIS)

## Problema

La columna `location` de la tabla `addresses` es de tipo `geography(Point, 4326)` de PostGIS. El código anterior intentaba insertar un string WKT `POINT(-78.531 -5.639)` directamente, lo cual PostGIS rechaza. Por eso al presionar "Guardar dirección" aparecía el error **"No se puede guardar. Intentalo de nuevo."**.

## Solución

Se creó una función RPC `create_address` que recibe `latitude` y `longitude` por separado y usa `ST_Point(longitude, latitude)::geography` internamente para insertar correctamente el punto geográfico.

## Pasos para aplicar la migración

### Opción 1: Supabase Dashboard (recomendado)

1. Entra al [Dashboard de Supabase](https://supabase.com/dashboard) → tu proyecto
2. Ve a **SQL Editor** (ícono de base de datos en la barra lateral)
3. Click en **New query**
4. Copia y pega el contenido de [`supabase/migrations/202610140003_create_address_rpc.sql`](../migrations/202610140003_create_address_rpc.sql)
5. Click en **Run** (o `Ctrl+Enter`)
6. Deberías ver: `Success. No rows returned`

Para verificar que se creó correctamente:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'create_address';
```

### Opción 2: Supabase CLI

```bash
npx supabase db push
```

> Esto aplica todas las migraciones pendientes en `supabase/migrations/` a tu proyecto vinculado.

## Archivos involucrados

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/202610140003_create_address_rpc.sql` | Nueva función RPC `create_address` con PostGIS |
| `packages/shared/types/database.types.ts` | Tipos TypeScript para la nueva función |
| `apps/mobile/src/lib/addresses.ts` | `createAddress()` ahora usa `supabase.rpc('create_address', ...)` |
| `apps/mobile/src/app/(client)/new-address.tsx` | Pasa `latitude` / `longitude` en vez de string WKT |

## Nota sobre `reference` vacío

La función RPC acepta `p_reference TEXT` sin `NOT NULL`, así que si el usuario no llena la referencia, se envía un string vacío (`''`) desde el cliente. Si tu columna `reference` en Supabase permite `NULL`, podrías preferir enviar `null` en ese caso — pero con `TEXT` vacío también funciona.

## Nota sobre RLS

La función usa `SECURITY DEFINER`, así que se ejecuta con permisos del owner y salta RLS. Si prefieres que respete RLS, cambia a `SECURITY INVOKER`. En ese caso asegúrate de tener una política INSERT en `addresses` que permita al usuario insertar donde `user_id = auth.uid()`.
