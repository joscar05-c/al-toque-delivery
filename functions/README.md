# Firebase Cloud Functions

These blocking functions create/ensure `public.users` with the Firebase UID as
`id` and add the `role: authenticated` claim. They use the Supabase
`service_role` key only on the server.

## Secrets and local files

- `SUPABASE_SERVICE_ROLE_KEY` for deployed Functions lives in Google Cloud
  Secret Manager, in the Firebase project. It is **not** stored in this repo or
  tied to one computer. If it was already set for `al-toque-delivery`, do not
  set it again unless the secret was deleted/rotated.
- `functions/.env` contains only `SUPABASE_URL`. It is local, ignored by Git,
  and Firebase CLI reads it when deploying. Recreate it on a new computer from
  `.env.example` and enter the same Supabase project URL.
- `functions/.secret.local` is only for running the Functions emulator. Put
  `SUPABASE_SERVICE_ROLE_KEY=...` there when emulating locally; it is ignored
  by Git. It is not needed for regular mobile/web use of deployed Functions.

## Configure this computer

From the repository root in PowerShell:

```powershell
Copy-Item functions\.env.example functions\.env
```

Edit `functions/.env` and replace the placeholder with the Supabase URL. Do not
put the service-role key there.

Install the standalone Functions dependencies (Functions is intentionally not
an NPM workspace):

```powershell
npm ci --prefix functions
```

Sign in to the Firebase project if needed:

```powershell
npx firebase-tools login
```

Only if the remote secret does not already exist in project
`al-toque-delivery`, create it (Firebase CLI prompts for the value):

```powershell
npx firebase-tools functions:secrets:set SUPABASE_SERVICE_ROLE_KEY --project al-toque-delivery
```

## Deploy the Node 22 runtime

The repository sets Node 22 in both `firebase.json` and `functions/package.json`.
Deploy from the repo root so Firebase CLI uses those files and this computer's
`functions/.env`:

```powershell
npx firebase-tools deploy --only functions --project al-toque-delivery
```

Verify the deployed functions use Node.js 22 and inspect logs:

```powershell
npx firebase-tools functions:log --project al-toque-delivery
```

Successful provisioning logs `[ensureProfile] Perfil asegurado`. If it fails,
the blocking sign-in now returns an error instead of silently issuing a token
without a Supabase profile. Do not paste service-role keys or OTP codes into
logs/issues.

The Firebase project must have Identity Platform enabled and both deployed
functions configured under **Authentication → Settings → Blocking functions**:
`onUserCreated` for *before user created* and `onUserSignedIn` for *before user
signed in*.
