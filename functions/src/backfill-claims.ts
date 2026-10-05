import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Script de una sola vez: asigna el custom claim `role: 'authenticated'`
 * a TODOS los usuarios Firebase existentes. Necesario para que Supabase
 * Postgres les aplique el rol `authenticated` (y RLS con auth.uid()).
 *
 * Uso:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run backfill:claims
 */
initializeApp();

async function backfillClaims(): Promise<void> {
  const auth = getAuth();
  let nextPageToken: string | undefined;
  let total = 0;

  do {
    const result = await auth.listUsers(1000, nextPageToken);
    nextPageToken = result.pageToken;

    await Promise.all(
      result.users.map(async (user) => {
        try {
          await auth.setCustomUserClaims(user.uid, { role: 'authenticated' });
          total += 1;
        } catch (error) {
          console.error('[backfill] Falló para uid', user.uid, error);
        }
      }),
    );
  } while (nextPageToken);

  console.log(`[backfill] Claims actualizados: ${total}`);
}

backfillClaims()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[backfill] Error fatal', error);
    process.exit(1);
  });
