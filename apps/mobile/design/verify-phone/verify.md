# Verify Screen \- Especificaciones de Diseño

## Referencia Global

Este componente debe heredar estrictamente las variables de diseño (colores, tipografías, espaciados y estilos de botón) definidas en el archivo principal `apps\mobile\design\ui-rules.md`.

## Imágenes de Referencia

- `apps\mobile\design\verify-phone\7 - Verify phone number.png`

## ⚠️ REGLA CRÍTICA DE LÓGICA

**PROHIBIDO MODIFICAR LA LÓGICA EXISTENTE.** El código actual utiliza un truco de accesibilidad con un `TextInput` invisible superpuesto sobre las casillas, maneja 6 dígitos (`OTP_LENGTH = 6`) y hace llamadas a Firebase. **Todo esto debe mantenerse intacto.** Tu único objetivo es refactorizar las clases de estilo (`className`) para que coincidan con la imagen de referencia.

## Estructura General (Layout)

Envuelto en `SafeAreaView` y `KeyboardAvoidingView`. Todo el contenido se centra verticalmente.

### 1\. Encabezado (Top)

- **Logo:** Añadir el mismo logo principal (circular con fondo "Primary Light") centrado en la parte superior, idéntico a la pantalla de Login.  
- **Título:** Estilo **H1** (`Text Primary`, 24px-28px, Bold). Texto: "Verify phone number". Centrado.  
- **Subtítulo:** Estilo **Body** (`Text Secondary`, 14px, Regular). Texto: "We have just sent a code to \[Número\]". Centrado debajo del título.

### 2\. Casillas de Código OTP (Middle)

- **Cantidad de casillas:** La imagen muestra 4, pero **DEBES MANTENER 6 CASILLAS** según la constante `OTP_LENGTH` de la lógica del negocio. Ajusta el ancho y el `gap` para que quepan las 6 en la pantalla.  
- **Estilo de la Casilla Base:**  
  - Fondo gris muy claro (`#F3F4F6` o `bg-slate-100`).  
  - Bordes redondeados (`borderRadius: 16`).  
  - Sin bordes completos (`borderWidth: 0`).  
  - Texto del dígito en estilo **H2** o más grande (`Text Primary`, Bold).  
- **Indicador Inferior (Línea):**  
  - Cada casilla tiene una pequeña línea horizontal en la parte inferior central.  
  - **Casilla Activa/Llena:** La línea inferior es de color **Primary** (`#F29F30`).  
  - **Casilla Inactiva/Vacía:** La línea inferior es gris oscuro (`Text Primary` o `slate-400`).  
- **Lógica Oculta:** Mantener el `<TextInput>` con `opacity: 0` posicionado de forma absoluta por encima del contenedor de las casillas.

### 3\. Controles (Bottom)

- **Botón Principal ("Next"):**  
  - Ejecuta la función `verifyOtp`.  
  - Botón Primario de ancho completo, totalmente redondeado.  
- **Botón Secundario ("Send again"):**  
  - Reemplaza el texto actual ("¿No recibiste el código?...") por un botón de ancho completo.  
  - Fondo gris claro (`#F3F4F6`), texto oscuro (`Text Primary`, SemiBold), totalmente redondeado.  
  - Este botón debe ejecutar la acción que el usuario tenía antes para reenviar (en tu código actual es `router.back()`).  
- **Footer Text (Opcional):**  
  - Texto pequeño en la parte inferior: "By signing up you agree to our terms of service and privacy policy." (Donde "terms of service and privacy policy" va en color **Primary**).

## Adaptación de Código Requerida

- Ocultar o eliminar el botón de "volver" (flecha superior izquierda) que tenías en tu código original, ya que el diseño lo reemplaza visualmente con el botón "Send again" en la parte inferior.