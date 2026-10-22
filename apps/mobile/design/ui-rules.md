# Sistema de Diseño - Al Toque Delivery

Este documento define las reglas estrictas de UI/UX para la aplicación. Los agentes de código deben usar estas directrices como fuente de la verdad para cualquier componente visual.

## 1. Stack de UI
- **Framework:** React Native / Expo
- **Estilos:** (Ajustar según preferencia del desarrollador: NativeWind/Tailwind CSS o StyleSheet nativo).
- **Iconos:** Preferiblemente usar íconos con estilo redondeado y relleno sólido/lineal (ej. Feather, Ionicons o MaterialCommunityIcons).

## 2. Paleta de Colores (Tokens)
Basado en la paleta oficial y los componentes de la interfaz.

### Colores de Marca
- **Primary (Naranja):** `#F29F30` (Uso: Botones principales, íconos activos, sliders, estrellas de calificación).
- **Primary Light:** Fondo semitransparente para badges o tags seleccionados.

### Neutrales (Fondos y Textos)
- **Background App:** `#F8F9FA` o `#FFFFFF` (Fondo general de pantallas como Home y Login).
- **Background Input/Card:** `#F3F4F6` (Gris muy claro para campos de texto, barras de búsqueda y fondos de tabs).
- **Text Primary:** `#1C2433` (Gris oscuro/Azul marino para títulos y textos principales).
- **Text Secondary:** `#8E98A8` (Gris medio para descripciones, placeholders, direcciones y textos secundarios).

### Semánticos
- **Success (Verde):** `#10B981` (Uso: Texto "Open", checkmarks de verificación).
- **Warning/Rating:** `#F59E0B` (Uso: Estrellas de reseñas).

## 3. Tipografía
- **Fuente:** Sistema por defecto (San Francisco en iOS, Roboto en Android) con pesos claros.
- **H1 (Títulos de Pantalla):** 24px - 28px, Bold (ej. "Welcome Back").
- **H2 (Títulos de Sección):** 18px - 20px, SemiBold (ej. "Category", "Best Partners").
- **H3 (Nombres de Items):** 16px, SemiBold (ej. Nombres de restaurantes como "Burger King", "Subway").
- **Body (Texto General):** 14px, Regular (ej. Nombres de inputs, texto de reseñas).
- **Caption (Textos pequeños):** 12px, Regular (ej. Distancia "1.5km", tags "Coffee", "Fastfood").

## 4. Espaciado y Layout (Grid de 8pt)
- **Screen Padding:** 20px (Margen horizontal estándar en todas las pantallas).
- **Gap (Espaciado entre elementos):** 
  - Pequeño: 8px (Entre un título y su subtítulo, o entre un ícono y su texto).
  - Medio: 16px (Entre tarjetas, inputs de un formulario).
  - Grande: 24px - 32px (Entre diferentes secciones horizontales en el Home).
- **Border Radius (Redondeo):**
  - Botones principales y barras de búsqueda: `borderRadius: 9999` (Totalmente redondeados / Pill shape).
  - Tarjetas de restaurantes, modales y botones sociales: `borderRadius: 16`.
  - Inputs de texto regulares: `borderRadius: 12`.

## 5. Componentes Globales y Reglas de Construcción

### Botones
- **Botón Primario:** Fondo `Primary`, texto blanco (16px, SemiBold), altura de 48px-52px, totalmente redondeado. Siempre debe tener efecto de opacidad al presionar (`activeOpacity={0.7}`).
- **Botón Social (Google/Facebook):** Fondo `#F3F4F6` o `#FFFFFF`, texto `Text Primary`, altura 48px, ícono alineado a la izquierda.

### Inputs y Formularios
- **Campo de Texto:** Fondo `#F3F4F6`, sin borde visible. Altura de 48px-52px. Placeholder en color `Text Secondary`. Los íconos (ej. checkmark o "ver contraseña") van alineados a la derecha con padding interno.
- **Barra de Búsqueda:** Similar al input pero con ícono de lupa a la izquierda, sombra muy sutil o fondo gris claro.

### Tarjetas (Cards)
- **Restaurantes (Verticales):** Imagen superior ocupando el 60% de la tarjeta, esquinas superiores redondeadas, esquinas inferiores redondeadas. Contenido interno con padding de 12px.
- **Categorías (Horizontales):** Contenedor circular con fondo muy claro (tintes de amarillo/verde/naranja) para la imagen del alimento, texto de categoría debajo centrado.

### Navegación
- **Bottom Tab Bar:** Fondo `#FFFFFF` puro o `#F8F9FA` claro. Ícono activo en color `Primary`, íconos inactivos en color `Text Secondary`. Sin etiquetas de texto, solo íconos centrados.
- **Modales (Bottom Sheets):** Esquinas superiores muy redondeadas (`borderRadius: 24` o `32`), pequeño indicador visual (pill gris) en la parte superior central para indicar que se puede arrastrar.

## 6. Comportamientos Interactivos
- No usar el componente `<Button>` estándar de React Native. Usar siempre `<TouchableOpacity>` o `<Pressable>`.
- Las listas horizontales (Categorías, Best Partners) deben ocultar la barra de desplazamiento (`showsHorizontalScrollIndicator={false}`).