# Compilar Android en Windows

Guía para instalar y ejecutar la app móvil desde este monorepo en una PC Windows. Los comandos se ejecutan desde la **raíz del repositorio** (`al-toque-delivery`), salvo que se indique otra cosa.

## Versiones usadas por este proyecto

El proyecto utiliza Expo SDK 57 y React Native 0.86.3. La configuración Android comprobada es:

| Componente | Versión |
| --- | --- |
| Node.js | 22.13 o posterior |
| Java para Gradle | JDK compatible con Gradle 9.3.1; se recomienda el JDK de Android Studio |
| Android SDK Platform | 36 |
| Android SDK Build-Tools | 36.0.0 |
| Android NDK | 27.1.12297006, seleccionado por Expo/React Native |
| CMake | 3.30.5, fijado en `app.json` con `expo-build-properties` |
| Arquitectura del emulador | `x86_64` |

No hace falta agregar `ndkVersion` a `expo-build-properties` para esta configuración. Después de `prebuild`, Gradle informa el NDK seleccionado; en esta app es `27.1.12297006`.

## Preparación de una PC nueva

1. Instala Node.js 22.13 o posterior y Android Studio.
2. En Android Studio abre **Tools → SDK Manager → SDK Platforms** e instala Android SDK Platform 36.
3. En **SDK Tools**, instala o verifica:
   - Android SDK Build-Tools 36.0.0
   - Android SDK Command-line Tools (latest)
   - Android Emulator y Android SDK Platform-Tools
   - CMake 3.30.5
   - NDK (Side by side) 27.1.12297006
4. En **Tools → Device Manager**, crea o inicia un emulador Android x86_64.
5. Desde la raíz del repositorio instala las dependencias:

   ```powershell
   npm ci
   ```

6. Configura los archivos locales que necesita el proyecto antes de compilar:
   - `.env` en la raíz del monorepo, con las variables requeridas por la app.
   - `apps/mobile/google-services.json`, para Firebase en Android.

   No copies valores secretos a este documento ni los subas al repositorio.

## Compilar e instalar en el emulador

Inicia el emulador en Device Manager y comprueba que ADB lo vea como `device`:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices -l
```

La fila del emulador debe terminar en `device`, por ejemplo:

```text
emulator-5554    device
```

En una instalación inicial, o después de cambiar la configuración nativa en `app.json`, regenera Android:

```powershell
npm exec --workspace=apps/mobile -- expo prebuild --platform android --clean
```

`--clean` elimina y vuelve a generar `apps/mobile/android`. No lo ejecutes si conservas cambios manuales dentro de esa carpeta que no estén definidos mediante `app.json` o plugins.

Después compila, instala y abre la app:

```powershell
npm exec --workspace=apps/mobile -- expo run:android
```

En el primer build Gradle puede tardar varios minutos. El resultado esperado incluye `BUILD SUCCESSFUL`, la instalación de `app-debug.apk` y el inicio de Metro.

## Compilar sin iniciar un emulador

Para comprobar el ensamblado Android sin instalar ni abrir la app, usa Gradle desde la raíz con `-p` apuntando al proyecto nativo:

```powershell
.\apps\mobile\android\gradlew.bat -p .\apps\mobile\android app:assembleDebug -x lint -x test --no-configure-on-demand -PreactNativeArchitectures=x86_64
```

El APK debug se genera en:

```text
apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

`x86_64` debe escribirse completo. `x86_6` no es un ABI válido.

## Si ADB muestra el emulador como `offline`

Que la ventana del emulador esté abierta no garantiza que ADB esté conectado. Reinicia ADB:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb kill-server
& $adb start-server
& $adb devices -l
```

Si sigue como `offline`, abre **Android Studio → Device Manager**, selecciona el emulador y usa **Cold Boot Now**. Confirma que después aparezca como `device` y vuelve a ejecutar `expo run:android`.

## Si vuelve el error de CMake/Prefab

Los errores de `fbjniConfig.cmake` o `ReactAndroidConfig.cmake` ocurren durante la configuración C++ de `react-native-worklets` o `react-native-screens`. Para esta app:

1. Comprueba que `apps/mobile/app.json` conserve `cmakeVersion: "3.30.5"` dentro del plugin `expo-build-properties`.
2. Verifica en Android Studio SDK Manager que CMake 3.30.5 y NDK 27.1.12297006 estén instalados.
3. Regenera el proyecto nativo y prueba primero el ensamblado sin emulador:

   ```powershell
   npm exec --workspace=apps/mobile -- expo prebuild --platform android --clean
   .\apps\mobile\android\gradlew.bat -p .\apps\mobile\android app:assembleDebug -x lint -x test --no-configure-on-demand -PreactNativeArchitectures=x86_64
   ```

4. Si falla, conserva el **primer** error `CMake Error` y la línea `CMAKE_FIND_ROOT_PATH`; las advertencias de Kotlin, la advertencia Gradle sobre futuras versiones y los mensajes de DevTools no sustituyen ese error principal.

## Avisos que no necesariamente indican un fallo

- `Waiting for a DevTools connection` o `No compatible apps connected` se refieren al depurador JavaScript. Si la app se abrió y funciona, no impiden la compilación.
- `expo run:android` necesita que ADB detecte el emulador para instalar y abrir la app. `gradlew app:assembleDebug` permite compilar sin emulador.
