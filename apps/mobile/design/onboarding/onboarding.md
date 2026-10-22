# Onboarding Screens - Especificaciones de Diseño

## Referencia Global
Este componente debe heredar estrictamente las variables de diseño (colores, tipografías, espaciados y estilos de botón) definidas en el archivo principal `apps\mobile\design\ui-rules.md`.

## Imágenes de Referencia
- `apps\mobile\design\onboarding\1 - Onboarding.png`
- `apps\mobile\design\onboarding\2 - Onboarding.png`
- `apps\mobile\design\onboarding\3 - Onboarding.png`

## Estructura General (Layout)
La vista de onboarding es un **carrusel a pantalla completa** (ej. usando `react-native-pager-view` o un `FlatList` horizontal con `pagingEnabled`). Consta de tres secciones verticales principales:

### 1. Área de Ilustración (Top)
- Ocupa aproximadamente el **55% - 60%** superior de la pantalla.
- Las imágenes deben estar centradas vertical y horizontalmente (`alignItems: 'center', justifyContent: 'center'`).
- Las ilustraciones tienen un fondo circular suave incorporado en el diseño; asegurar que el contenedor no corte estos bordes.

### 2. Área de Texto (Middle)
- **Título:** Utiliza el estilo **H1** (`Text Primary`, 24px-28px, Bold). Debe estar centrado (`textAlign: 'center'`). Margen inferior pequeño (aprox 12px-16px).
- **Descripción:** Utiliza el estilo **Body** (`Text Secondary`, 14px, Regular). Debe estar centrado con un ancho máximo (aprox. 80%) para que el texto salte a la segunda línea de forma armónica.

### 3. Área de Controles (Bottom)
- **Paginador (Dots):**
  - Ubicado debajo de la descripción (margen superior de aprox. 32px).
  - Centrado horizontalmente.
  - **Dot Inactivo:** Círculo perfecto (ej. `width: 8, height: 8`), color gris claro (ej. `#E5E7EB`).
  - **Dot Activo:** Forma de píldora (ej. `width: 24, height: 8`), color **Primary** (`#F29F30`).
  - Espaciado entre dots: 8px.
- **Botón de Acción (Call to Action):**
  - Botón Primario de ancho completo (respetando el **Screen Padding** de 20px en los lados).
  - Texto: "Get started".
  - Anclado a la parte inferior de la pantalla, respetando el *Safe Area* de los dispositivos (mínimo 24px-32px de margen desde el borde inferior de la pantalla).

## Comportamiento e Interacciones
1. **Swipe:** El usuario puede deslizar horizontalmente para cambiar entre las 3 pantallas de contenido.
2. **Botón Fijo:** El botón "Get started" debe mantenerse fijo en la misma posición en la parte inferior mientras se desliza el carrusel superior (o repetirse de forma idéntica en cada slide).
3. **Navegación:** Al presionar "Get started", la aplicación debe finalizar el onboarding (idealmente guardando un flag en `AsyncStorage` o estado global) y navegar a la pantalla de Login o Home.