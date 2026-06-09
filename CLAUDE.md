# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Generar JSONs de datos desde archivos Excel:**
```bash
python subir_datos.py
```
Genera archivos `data/{indicador}.json` (ICC, EI, REM) en el directorio `data/`. No requiere credenciales.

**Traer datos de mercado (Merval) desde Yahoo Finance:**
```bash
python fetch_mercados.py
```
Genera `data/merval.json`. Se usa porque Yahoo Finance bloquea CORS desde el browser.

**Traer ICC y EI (UTDT) automáticamente desde la web:**
```bash
python fetch_utdt.py
```
Scrapea la página de "Serie Histórica" de UTDT (ICC y EI), extrae el link de descarga `download.php?fname=...xls` (cambia cuando suben datos nuevos) y genera `data/icc.json` y `data/ei.json`. Requiere User-Agent de navegador (UTDT tiene anti-bot). Corre solo cada mes vía `.github/workflows/update-utdt.yml` (día 22). Reemplaza la carga manual de ICC/EI; los **REM** del BCRA siguen siendo manuales con `subir_datos.py`.

**Instalar dependencias Python:**
```bash
pip install -r requirements.txt
```

**Generar las páginas SEO por indicador:**
```bash
node generar-paginas.js
```
Lee el array `SERIES` de `app.js` y genera una página estática por indicador en `indicador/{slug}.html` (con `<title>`, `description`, `canonical` y Open Graph propios), y regenera `sitemap.xml`. Correr cada vez que se agreguen o cambien indicadores (slug/título/descripción).

**El frontend no tiene build step de bundling** — es HTML/CSS/JS estático. Abrí `index.html` directamente o servilo con cualquier servidor estático. Las URLs limpias (`/indicador/<slug>`, `/datos`) funcionan en Vercel vía `cleanUrls`.

**Correr los tests:**
```bash
node --test
```
Cubren las funciones puras de `lib.js` (formatFecha, agregarDatos, transformarEmae). Usan `node:test`, sin dependencias. Corren en CI con cada push (`.github/workflows/test.yml`).

## Arquitectura

### Frontend (HTML + JS estático)
- **`app.js`** es el núcleo de toda la lógica del frontend — se carga en todas las páginas y controla el fetch de datos, el renderizado de gráficos y la UI. No hay auth ni backend: el sitio es 100% estático.
- **`SERIES`** (array en `app.js`) es la fuente de verdad de todos los indicadores: define fuente, IDs de API, colores, unidades, y si son `premium`.
- La página activa se detecta con clases CSS en `<body>` (`page-datos`, `page-detalle`) — `app.js` usa estas flags para alterar su comportamiento (controles extra, historial ampliado, etc.).
- **Páginas por indicador (SEO):** cada indicador tiene una página estática pre-generada en `indicador/<slug>.html` (URL limpia `/indicador/<slug>`), con título/descripción/canonical/OG propios. El `<body>` trae `data-serie-id` horneado; `app.js` lo lee y renderiza el gráfico ampliado. Se generan con `node generar-paginas.js`. El viejo `detalle.html?id=` sigue funcionando por compatibilidad y canonicaliza hacia la URL limpia.
- Cada serie de `SERIES` tiene `slug` (URL) y `descripcion` (meta SEO) — son la fuente de verdad que consume el generador.
- **Laboratorio (`/laboratorio`):** página que correlaciona dos indicadores. Reusa `obtenerDatosSerie` (fetch sin render, extraído de `cargarSerie`) y las funciones puras de `lib.js` (`agregarDatos`, `alinearSeries`, `normalizar`, `pearson`, `crossCorrelation`). Pipeline: fetch → `agregarDatos(freq)` → `alinearSeries` (intersección por fecha) → `normalizar` (índice/niveles/variación) → correlación + lead/lag. `laboratorio.js` es el controller; `app.js` aporta `SERIES`/`obtenerDatosSerie` y hace no-op en `loadAll()` para `page-laboratorio`. Series REM excluidas (son proyecciones). Lead/lag solo se afirma si la correlación es ≥ moderada y no cae en el borde del rango.

### Fuentes de datos (todas consumidas en el browser)
| Fuente | Qué provee | Cómo |
|---|---|---|
| **Bluelytics** | Dólar oficial y blue | REST público |
| **BCRA v4.0** | Reservas, base monetaria, BADLAR, TC mayorista | `/estadisticas/v4.0/monetarias/{id}` |
| **INDEC / datos.gob.ar** | IPC, EMAE | `/series/api/series/?ids=` |
| **JSON local** | ICC Di Tella, EI Di Tella, indicadores REM, Merval, Oro | `data/{id}.json` generados por `subir_datos.py` y `fetch_mercados.py` |
| **ArgentinaDatos** | Riesgo País (EMBI+) | REST público con CORS, `api.argentinadatos.com` |

**Nota CORS:** Yahoo Finance (Merval `^MERV`, Oro `GC=F`) bloquea CORS desde el browser. Por eso ambos se traen del lado servidor con `fetch_mercados.py` a `data/merval.json` y `data/oro.json`, y se consumen con `fuente: 'local'` + `ventana: true`. El oro es el futuro COMEX en USD/oz directo.

### Datos locales (ICC, EI, REM, Merval, Oro)
- `subir_datos.py` parsea los Excel de UTDT (ICC, EI) y BCRA (REM) y genera `data/{id}.json`.
- Cada JSON es un array de `{ fecha: "YYYY-MM-DD", valor: number }` ordenado por fecha.
- `app.js` los carga con `fetch('data/{id}.json')` (`fuente: 'local'`) — sin dependencias externas ni base de datos.
- Por defecto se carga el historial completo; las series de mercado (oro, merval) se acotan a su ventana con `ventana: true`.
- Para actualizar: bajá el Excel nuevo, corrés `python subir_datos.py`, y deployás.

## Agregar un nuevo indicador

1. Agregarlo al array `SERIES` en `app.js` con su `fuente` correspondiente.
2. Si la fuente es `local`, generar el `data/{id}.json` con `subir_datos.py` (o `fetch_mercados.py` para datos de mercado).
3. Si la fuente es `bcra`, usar el ID numérico de variable de la API v4.0 del BCRA.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
