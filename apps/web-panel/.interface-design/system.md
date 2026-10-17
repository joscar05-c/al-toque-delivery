# Al Toque Delivery — Panel Design System

## Dirección: Cocina en Vivo 🔥

Cálido, operativo, culinario. Inspirado en una cocina profesional real.

### Responsive Design

#### Breakpoints
- **Mobile (<768px)**: Sidebar colapsable con toggle, contenido full-width
- **Tablet (768-1023px)**: Sidebar 72px solo íconos, tooltips en hover
- **Desktop (≥1024px)**: Sidebar 240px completo con texto

#### Mobile-first
- Sidebar con botón hamburguesa fijo (44x44px)
- RealtimeBoard: Tabs horizontales scrolleables en móvil (kanban → tabs)
- Tablas: overflow-x-auto con scroll horizontal
- Grids: 1 columna en móvil, 2 en tablet, 3-4 en desktop
- Forms: full-width en móvil, max-w-2xl en desktop
- Page titles: 20px en móvil, 24px en desktop
- Inputs: font-size 16px en móvil (previene zoom iOS)

#### Patrones responsive
- `.sidebar-desktop`: Desktop/tablet (oculto en móvil)
- `.sidebar-mobile`: Mobile (overlay con animación)
- `.mobile-menu-toggle`: Botón hamburguesa (solo móvil)
- `.content-mobile`: Main content con margin adaptativo
- `.grid-responsive-*`: Clases para grids adaptativos

### Tokens

#### Surfaces
- `--canvas`: #FFFBF5 (crema cálido, fondo principal)
- `--surface`: #FFFFFF (tarjetas)
- `--surface-raised`: #FFFFFF
- `--surface-inset`: #FDF6EE (inputs, order cards)
- `--surface-sidebar`: #1C1917 (sidebar oscuro)

#### Text hierarchy
- `--ink`: #1C1917 (texto principal)
- `--ink-secondary`: #57534E (texto secundario)
- `--ink-muted`: #A8A29E (metadata, labels)
- `--ink-on-dark`: #E7E5E4 (texto en sidebar oscuro)
- `--ink-muted-on-dark`: #A8A29E (texto secundario en sidebar)

#### Borders (warm, barely visible)
- `--border`: rgba(120, 80, 40, 0.08)
- `--border-strong`: rgba(120, 80, 40, 0.15)
- `--border-on-dark`: rgba(255, 255, 255, 0.08)

#### Brand
- `--brand`: #EA580C (naranja quemado)
- `--brand-hover`: #C2410C
- `--brand-soft`: rgba(234, 88, 12, 0.1)
- `--brand-on-dark`: #FB923C

#### Semantic
- `--success`: #16A34A / soft: rgba(22, 163, 74, 0.1)
- `--danger`: #DC2626 / soft: rgba(220, 38, 38, 0.08)
- `--warning`: #D97706 / soft: rgba(217, 119, 6, 0.1)
- `--info`: #2563EB / soft: rgba(37, 99, 235, 0.08)

#### Kitchen status
- `--kitchen-pending`: #F59E0B (amarillo)
- `--kitchen-accepted`: #3B82F6 (azul)
- `--kitchen-preparing`: #EA580C (naranja)
- `--kitchen-ready`: #16A34A (verde)

### Depth strategy
Borders sutiles + sombras cálidas muy suaves.
Cards: `border: 1px solid var(--border)` + `box-shadow: 0 1px 2px rgba(120, 80, 40, 0.04)`
Radius: 12px cards, 10px inner elements, 8px inputs/botones

### Typography
- Font: Geist Sans (var(--font-geist-sans))
- Type scale: 11px labels → 13px body-small → 14px body → 16px section-title → 24px page-title
- Weight: 600 para labels/titles, 500 para body emphasis, 400 para body
- Letterspacing: -0.025em en títulos grandes, 0.05em en labels uppercase
- `font-variant-numeric: tabular-nums` en todos los datos dinámicos

### Layout
- Sidebar: 240px (w-60), fondo oscuro, brand con icono rayo naranja
- Content padding: 32px (p-8)
- Section spacing: 24px (space-y-6)
- Card padding: 24px (p-6)

### Component patterns

#### Panel card
`.section-card` → bg white, border var(--border), radius 12px, shadow sutil

#### Panel input
`.panel-input` → 8px 12px padding, border 1px solid var(--border-strong), radius 8px, focus: brand color ring

#### Primary button
`.panel-btn-primary` → 8px 16px padding, bg var(--brand), radius 8px, active: scale(0.97)

#### Secondary button
`.panel-btn-secondary` → 6px 12px padding, border var(--border-strong), radius 8px, active: scale(0.97)

#### Table
`.panel-table` → header bg var(--surface-inset), 11px uppercase labels, hover: var(--surface-inset)

#### Badge
`.badge` → 2px 10px padding, radius 100px, 12px font, weight 500
Variants: `.badge-success`, `.badge-danger`, `.badge-warning`, `.badge-info`, `.badge-neutral`, `.badge-brand`

#### Page title
`.page-title` → 24px/700, tracking -0.025em, color var(--ink)
`.page-subtitle` → 14px/400, color var(--ink-secondary), margin-top 4px

#### Sidebar link
`.sidebar-link` → 8px 12px padding, radius 8px, color ink-muted-on-dark
Hover: bg rgba(255,255,255,0.06), color ink-on-dark
Active: data-active="true" → bg brand-soft, color brand-on-dark

#### Sidebar signout
`.sidebar-signout` → 8px 12px padding, radius 8px, hover: bg danger-soft, color #FCA5A5
