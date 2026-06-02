# DESIGN.md — Sistema de diseño de MacroAr

Identidad visual: **celeste argentino**, sobria y orientada a datos. Sensación de
panel financiero confiable, no de SaaS genérico. Cuando dudes, restá: si un elemento
no se gana sus píxeles, va afuera.

## Principios

1. **Identidad celeste.** El celeste de la bandera (`--teal #74ACDF`) es el acento
   de marca; el fondo oscuro es un celeste oscuro (`--navy #1c3c63`), no un negro-azul.
2. **El dato es el héroe.** Los números y los gráficos mandan. El cromo (bordes,
   sombras, decoración) se mantiene al mínimo.
3. **Sin "AI slop".** Nada de grids de 3 columnas con íconos en círculos, violetas/
   magentas al azar, ni todo centrado. La paleta de gráficos vive en la familia
   celeste/azul/teal con acentos cálidos solo donde son semánticos.
4. **Contraste real.** Texto de cuerpo ≥ 4.5:1. El texto tenue sobre fondo oscuro
   nunca baja de ~70% de opacidad.
5. **Accesible por defecto.** Logo y tarjetas navegables por teclado, gráficos con
   `aria-label`, foco visible.

## Paleta

### Tokens base (`:root` en `style.css`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--navy` | `#1c3c63` | Fondo oscuro (navbar, hero, footer) |
| `--navy-2` | `#21436f` | Fin del degradado del hero |
| `--teal` | `#74ACDF` | Acento de marca (celeste bandera) |
| `--teal-dark` | `#5a96cf` | Hover del acento |
| `--sol` | `#F6B40E` | *(reservado)* sol de mayo, acento cálido futuro |
| `--bg` | `#f0f4f8` | Fondo de página (claro) |
| `--card` | `#ffffff` | Fondo de tarjetas |
| `--text` | `#1e293b` | Texto principal |
| `--muted` | `#5b6675` | Texto secundario (pasa 4.5:1 sobre `--bg`) |
| `--border` | `#e2e8f0` | Bordes y divisores |

### Acento sobre fondo oscuro
El celeste `--teal` pasa contraste como texto grande. Para texto chico sobre el hero
usar un celeste más claro (`#9fc6ea`, ver `.hero-eyebrow`). El texto blanco tenue va
a 70-75% de opacidad, nunca menos.

## Paleta de gráficos (colores de las series)

Familia celeste/azul/teal como base; cálidos solo con significado.
Definida por indicador en el array `SERIES` de `app.js` (campo `color`).

| Familia | Colores | Para |
|---------|---------|------|
| Azules / celestes | `#2563eb` `#0ea5e9` `#0284c7` `#0369a1` `#1e40af` `#3b82f6` | Tipo de cambio, reservas, base monetaria, agregados |
| Teal / cyan | `#0e7490` `#0891b2` `#0d9488` `#14b8a6` `#06b6d4` | Actividad (EMAE), comercio, Merval, tasas |
| Verdes | `#10b981` `#059669` `#15803d` | Crecimiento (PIB), resultado fiscal |
| Rojos (inflación) | `#dc2626` `#b91c1c` `#ef4444` `#f87171` | IPC, riesgo país, expectativas de precios |
| Cálidos (acento) | `#ea580c` `#d97706` `#ca8a04` `#f59e0b` | Confianza, oro, tasas |
| Neutro | `#64748b` | Desocupación |

**Regla:** rojo = precios/inflación/riesgo (intuitivo). Oro `#d97706` = commodity oro.
**Prohibido:** violeta, magenta, fucsia (`#7c3aed`, `#8b5cf6`, `#d946ef` y similares) —
chocan con el celeste y disparan el patrón "AI slop".

## Tipografía

- **Display / títulos:** `Poppins` (600-800). El logo va en 800.
- **Cuerpo / UI:** `Inter` (400-600).
- **Números:** `Poppins` (humanista, redondeada). Se probó monospace y se descartó
  por sentirse demasiado geométrico.
- Cuerpo ≥ 16px. Nunca usar la stack del sistema como fuente principal.

## Layout y espaciado

- Contenedor central: `max-width: 1200px`, padding lateral `1.5rem`.
- Navbar fijo (`sticky`, alto 64px), fondo blanco con borde inferior celeste de 2px.
- Grid de tarjetas: `repeat(auto-fill, minmax(320px, 1fr))`, gap `1.25rem`.
- Tarjetas: radio `12px`, borde `1px` + borde superior `3px` del color de la serie,
  sombra suave. Hover: `translateY(-2px)` + sombra más marcada.
- Radios: `6px` (botones/inputs), `12-16px` (tarjetas/modales), `999px` (chips/píldoras).

## Componentes clave

- **Hero:** degradado celeste oscuro (`--navy` → `--navy-2`), glow sutil del sol arriba
  a la derecha. Eyebrow en mayúsculas + celeste claro, H1 en Poppins, "Argentina" en celeste.
- **Hero stats:** tarjetas semitransparentes con borde superior celeste; valor en Poppins.
- **Tarjeta de indicador:** título (uppercase, muted) + badge con el valor (color de serie),
  meta de fecha, gráfico. Clickeable a `detalle.html?id=`.
- **Menú de categorías (Datos):** barra sticky de chips horizontal scrolleable; el chip
  de la categoría visible se resalta (`.cat-chip.active`, fondo navy).
- **Botones:** primario = sol/celeste; ghost = borde tenue. Foco y teclado siempre activos.

## Responsive

- Mobile: hero stats en 2 columnas, tarjetas apiladas (1 col), menú de categorías scroll
  horizontal con el dedo. Touch targets ≥ 44px.

## Accesibilidad (no negociable)

- Gráficos `<canvas>` con `role="img"` y `aria-label` (nombre + último valor).
- Tarjetas clickeables: `role="link"`, `tabindex="0"`, activan con Enter/Espacio.
- Logo es un `<a href="index.html">` (vuelve al inicio desde cualquier página).
- Contraste de cuerpo ≥ 4.5:1; texto grande ≥ 3:1.

## Marca

- Nombre: **MacroAr** ("Ar" en celeste).
- Tono: claro, directo, en español rioplatense. Sin jerga corporativa.
