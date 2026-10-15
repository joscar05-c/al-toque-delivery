# Configuración de Google Maps (react-native-maps)

Guía para las claves de Google Maps usadas por los componentes `AddressLocationPicker` y `DriverTrackingMap`.

## Por qué ocurrió el crash

En Android, `react-native-maps` renderiza un `MapView` de **Google Maps**, que exige una API key declarada en el `AndroidManifest.xml`:

```xml
<meta-data android:name="com.google.android.geo.API_KEY" android:value="TU_CLAVE" />
```

Este proyecto usa **Continuous Native Generation** (no existe carpeta `android/`, se genera en cada build), así que el manifiesto se crea a partir de `app.json`. Si la clave no está configurada ahí, el manifiesto sale sin la clave y la app crashea con:

```
java.lang.IllegalStateException: API key not found.
```

al abrir cualquier pantalla con un mapa (p. ej. "+ Agregar nueva dirección").

> Nota: en **Expo Go** los mapas funcionan sin clave (Expo Go trae la suya), pero en un **development build** (`expo-dev-client`) la clave es obligatoria.

## Dónde están las claves

Las claves viven en `apps/mobile/.env` (este archivo está en `.gitignore`, **no se sube al repositorio**):

```bash
# apps/mobile/.env
GOOGLE_MAPS_API_KEY_ANDROID=AIzaSy...   # ✅ ya configurada
GOOGLE_MAPS_API_KEY_IOS=REEMPLAZAR_CON_TU_API_KEY_IOS   # ⏳ pendiente
```

`apps/mobile/app.config.js` las inyecta al build nativo mediante el config plugin de `react-native-maps` (se hace en config dinámica porque la sintaxis `"process.env.X"` como string dentro de `app.json` **no se expande** y termina literal en el manifiesto):

```js
// apps/mobile/app.config.js
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', {
      androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID ?? '',
      iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS ?? '',
    }],
  ],
});
```

⚠️ **Cada vez que cambies una clave debes regenerar el build nativo** (`npx expo run:android` / `run:ios`). Recargar Metro no aplica cambios del manifiesto.

## Android (ya configurado)

La clave actual es ``. Para que funcione correctamente en Google Cloud Console:

1. Ve a [APIs y servicios](https://console.cloud.google.com/apis) → tu proyecto → **Habilitar el "Maps SDK for Android"**.
2. Ve a [Credenciales](https://console.cloud.google.com/apis/credentials) → tu clave → **Restricciones de aplicación**:
   - Tipo: **Aplicaciones de Android**
   - Nombre del paquete: `com.joscar.al_toque_delivery` (el de `app.json`)
   - SHA-1: el fingerprint del keystore con el que firmas el build (ver abajo).
3. Restringe las API a **Maps SDK for Android**.

### Obtener tu SHA-1 (build de desarrollo local)

Los dev builds locales se firman con el keystore de debug. En Windows PowerShell:

```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Copia el valor **SHA1** y agrégalo a la restricción de la clave en Google Cloud.

Si en algún momento ves el mapa con marca de agua *"For development purposes only"*, significa que la clave es válida pero las restricciones (paquete/SHA-1) no coinciden o el Maps SDK for Android no está habilitado.

### Reconstruir

```bash
cd apps/mobile
npx expo run:android
```

## iOS (pendiente: solo falta la clave)

Todo lo demás ya está configurado (`iosGoogleMapsApiKey` en `app.json`, `PROVIDER_GOOGLE` en los mapas). Cuando consigas la clave:

1. En [Google Cloud Console](https://console.cloud.google.com/apis) habilita el **"Maps SDK for iOS"** en el mismo proyecto.
2. En [Credenciales](https://console.cloud.google.com/apis/credentials) → **Crear credenciales → Clave de API** (o reutiliza la de Android editando sus restricciones):
   - Restricciones de aplicación: **Aplicaciones de iOS**
   - Bundle identifier: `com.joscar.al-toque-delivery` (el de `app.json`)
   - Restricciones de API: **Maps SDK for iOS**
3. Pega la clave en `apps/mobile/.env`:

   ```bash
   GOOGLE_MAPS_API_KEY_IOS=AIzaSy...tu_clave_ios...
   ```

4. Reconstruye:

   ```bash
   cd apps/mobile
   npx expo run:ios
   ```

⚠️ Mientras `GOOGLE_MAPS_API_KEY_IOS` tenga el placeholder, **no compiles para iOS**: los mapas usan `PROVIDER_GOOGLE` y crashearían igual que en Android sin clave.

## Builds con EAS (producción)

`.env` está en `.gitignore`, por lo que EAS Build no lo recibe automáticamente. Opciones:

- Crea un `.easignore` en `apps/mobile/` que **no** excluya `.env`, o
- Define `GOOGLE_MAPS_API_KEY_ANDROID` / `GOOGLE_MAPS_API_KEY_IOS` como **secretos de EAS** (`eas secret:create`) y referéncialos en `eas.json`.

Para producción, la restricción SHA-1 de Android debe usar el fingerprint del **keystore de subida de Play Store** (Google Play Console → Integridad de la app → Firma de aplicaciones de Play), no el de debug.

## Archivos relacionados

- `apps/mobile/.env` — claves (no se versiona)
- `apps/mobile/app.config.js` — config plugin `react-native-maps` (inyecta las claves al manifiesto)
- `apps/mobile/src/components/AddressLocationPicker.tsx` — mapa del selector de dirección
- `apps/mobile/src/components/DriverTrackingMap.tsx` — mapa de seguimiento del repartidor
