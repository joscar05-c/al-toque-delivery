# Home Screen (Public) \- Especificaciones de Diseño

## Referencia Global

Este componente hereda estrictamente las variables de diseño definidas en `apps\mobile\design\ui-rules.md` (colores `Primary`, `Text Primary`, `Text Secondary`, fondos, bordes redondeados).

## Imágenes de Referencia

- `apps\mobile\design\home\16 - Home_V1.png` (Vista principal con lista vertical)  
- `apps\mobile\design\home\17 - Home_V2.png` (Alternativa con grilla de restaurantes)

## ⚠️ REGLA CRÍTICA DE LÓGICA Y ESTADO

**PROHIBIDO ELIMINAR LA LÓGICA DE DATOS.** Debes mantener los `useState`, los `useEffect` de carga (`fetchActiveRestaurants`, `fetchRestaurantCategories`), el `RefreshControl`, los estados de `isLoading` / `error`, y la cabecera condicional que invita al usuario a "Iniciar sesión" (ya que es la vista pública). Solo vas a reestructurar el Layout y cambiar las clases visuales de Tailwind/NativeWind para alinear el diseño con las imágenes.

## Estructura General (Layout)

La vista base es un `SafeAreaView` con fondo gris muy claro (`#F8F9FA` o `bg-slate-50`).

### 1\. Cabecera (Top Section)

En el diseño original hay una barra de búsqueda y una dirección de entrega. Como esta es la **vista pública sin autenticar**, adapta la cabecera combinando el diseño con tu lógica actual:

- **Barra de Búsqueda (Ficticia por ahora):**  
  - Contenedor con fondo `#F3F4F6`, bordes redondeados (pill shape, `borderRadius: 9999`), ícono de lupa a la izquierda, texto de placeholder "Buscar en Al Toque".  
- **Botón de Filtro:**  
  - Al lado derecho de la barra de búsqueda o debajo. Botón gris claro con ícono de ajustes/filtro.  
- **Mensaje de Invitación (Tu código actual):**  
  - Ubica el mensaje "Inicia sesión para hacer pedidos..." (que ya tienes en código) justo debajo de la barra de búsqueda. Dale un estilo de banner sutil (fondo de un tinte muy claro del `Primary` con texto llamativo) en lugar de usar el diseño de "Delivery to..." de la imagen.

### 2\. Sección de Categorías

- **Encabezado de Sección:**  
  - Título alineado a la izquierda: "Categorías" (Estilo **H2**, `Text Primary`, SemiBold).  
  - Botón a la derecha: "Ver todo" (`Text Secondary`, 14px).  
- **Lista Horizontal (Tu FlatList actual de `categoryOptions`):**  
  - Actualiza el diseño interno del `CategoryChip`.  
  - Debe lucir como la imagen: Un contenedor circular/ovalado con fondo muy suave, una imagen/ícono grande en el centro, y el texto de la categoría debajo, centrado y en color `Text Primary` (14px, Medium).

### 3\. Sección "Mejores Socios" (Best Partners) \- *Opcional / Visual*

- La imagen muestra una lista horizontal de "Best Partners".  
- Dado que actualmente solo tienes un estado `restaurants` con una lista plana, puedes: a) Crear una interfaz estática/quemada para simular esta sección por el momento. b) O tomar los primeros 2 elementos de `restaurants` (`restaurants.slice(0, 2)`) y renderizarlos en un `FlatList` horizontal pequeño debajo de las categorías.  
  - **Estilo de la tarjeta Horizontal:** Ancha, imagen principal grande, detalles debajo con ícono de verificado, estado ("Open" en verde), calificación con estrella naranja, distancia y texto "Envío gratis".

### 4\. Lista Principal de Restaurantes (Tu FlatList actual)

- **Filtros/Tabs Superiores:**  
  - Antes de la lista vertical, hay un selector de pestañas horizontales: "Cercanos", "Ventas", "Calificación", "Rápido" (Nearby, Sales, Rate, Fast).  
  - El tab activo tiene el texto en color `Text Primary` y una línea inferior color `Primary` (naranja). Los inactivos son `Text Secondary`. (Puedes implementarlos como UI estática por ahora, ya que no tienes la lógica de filtrado).  
- **Tarjetas de Restaurante (`RestaurantCard`):**  
  - Se debe modificar el componente interno `RestaurantCard` para que coincida con la imagen `16 - Home_V1_2.jpg`.  
  - Imagen de portada grande ocupando todo el ancho del contenedor.  
  - Logo del restaurante superpuesto tipo "sticker" (borde blanco, flotando entre la imagen y el texto) *\[Opcional según disponibilidad de datos\]*.  
  - Nombre grande (H3), check verde de verificado.  
  - Subtítulo con el estado (ej. "Open" en verde `#10B981`) y etiquetas (ej. "Burger · Rice").  
  - Fila final con la estrella de calificación (`#F59E0B`), la distancia y el precio de envío.  
  - Espaciado: Margen inferior (`marginBottom: 24`) entre tarjetas.

## Notas para el Agente (Cursor/Windsurf)

- Agrupa las secciones (Búsqueda, Categorías, Best Partners, Tabs) dentro del `ListHeaderComponent` del `FlatList` principal de `restaurants`. Esto evitará errores de scroll y mantendrá el `RefreshControl` funcionando para toda la pantalla.