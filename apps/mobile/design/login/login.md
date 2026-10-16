# Login Screen \- Especificaciones de Diseño

## Referencia Global

Este componente debe heredar estrictamente las variables de diseño (colores, tipografías, espaciados y estilos de botón) definidas en el archivo principal `apps\mobile\design\ui-rules.md`.

## Imágenes de Referencia

- `apps\mobile\design\login\6 - Phone Number Login.png`

## Estructura General (Layout)

La vista de login debe estar envuelta en un `SafeAreaView` y un `KeyboardAvoidingView` para manejar la aparición del teclado. El contenido principal se centra verticalmente en la pantalla.

### 1\. Encabezado (Top)

- **Logo:** Logo principal de la aplicación ("Al Toque Delivery") centrado en la parte superior. (Nota: Según la imagen de referencia, es un círculo con fondo color "Primary Light" y el ícono/texto dentro).  
- **Título:** Estilo **H1** (`Text Primary`, 24px-28px, Bold). Texto: "Get started with Al Toque". Centrado, con un margen superior respecto al logo.  
- **Subtítulo:** Estilo **Body** (`Text Secondary`, 14px, Regular). Texto: "Enter your phone number" (o su equivalente en español). Centrado debajo del título.

### 2\. Formulario (Middle)

- **Input de Teléfono:**  
  - Contenedor con fondo `#F3F4F6` y `borderRadius: 12`.  
  - Etiqueta superior ("Phone Number") opcional dentro o fuera del input, color `Text Secondary`, tamaño pequeño (Caption).  
  - Lado izquierdo: Selector de código de país (bandera peruana o texto "+51") con un ícono de flecha hacia abajo.  
  - Centro: Campo `TextInput` para el número, sin bordes, texto en color `Text Primary` o gris oscuro.  
  - Lado derecho (opcional): Ícono de verificación (checkmark en círculo gris claro) cuando el número tiene la longitud correcta.

### 3\. Controles (Bottom)

- **Botón Principal:**  
  - Botón Primario de ancho completo (respetando el padding lateral).  
  - Texto: "Next" o "Enviar código por SMS".  
  - Color de fondo: `Primary`.  
- **Botón "Saltar y explorar" (Opcional según lógica del negocio):**  
  - Ubicado debajo del botón principal.  
  - Estilo de botón secundario (borde gris claro, texto gris, o solo texto sin fondo).  
  - Permite al usuario entrar a la app en modo "explorar" sin registrarse.  
- **Términos y Condiciones (Opcional):** Texto legal pequeño (`Caption`) en la parte inferior sobre tarifas de SMS.

## Comportamiento e Interacciones

1. **Validación:** El ícono de checkmark en el input se activa solo cuando el número alcanza la longitud correcta (ej. 9 dígitos para Perú).  
2. **Estado de Carga:** El botón principal debe mostrar un indicador de carga (spinner) y deshabilitarse mientras se envía el SMS.  
3. **Navegación "Saltar":** El botón secundario redirige directamente a las tabs principales (`/(public)/(tabs)`) sin autenticar.  
4. **Teclado:** El teclado debe abrirse en modo numérico (`phone-pad`).