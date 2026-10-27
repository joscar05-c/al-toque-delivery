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

## Android (Configurado)

La clave configurada en `.env` es `AIzaSyB3xurYrIbP0ii-h9udnY8iEbF46J4UMuI`.

Para que Google Maps funcione tanto en desarrollo local como en la app descargada desde Play Store, la clave en Google Cloud Console debe tener registradas **ambas huellas SHA-1**:

1. Ve a [APIs y servicios](https://console.cloud.google.com/apis) → Proyecto `al-toque-delivery` → Asegúrate de tener habilitado **Maps SDK for Android**.
2. Ve a [Credenciales](https://console.cloud.google.com/apis/credentials) → Tu clave de Android → **Restricciones de aplicación**:
   - Tipo: **Aplicaciones de Android**
   - Agrega dos elementos con el paquete `com.deliverygofast1.app`:
     - **Elemento 1 (Build Local / Subida):**
       - Paquete: `com.deliverygofast1.app`
       - SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
     - **Elemento 2 (Producción Google Play Store):**
       - Paquete: `com.deliverygofast1.app`
       - SHA-1: `82:36:62:05:7F:ED:21:87:71:7D:18:E7:36:92:8A:46:91:6F:4C:02`
3. En **Restricciones de API**, selecciona **Restringir clave** y marca únicamente **Maps SDK for Android**.

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
