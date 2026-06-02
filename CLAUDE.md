# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Correr el chat IA (Streamlit):**
```bash
streamlit run streamlit_app.py
```

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

**Instalar dependencias Python:**
```bash
pip install -r requirements.txt
```

**El frontend no tiene build step** — es HTML/CSS/JS estático. Abrí `index.html` directamente en el navegador o servilo con cualquier servidor estático.

## Arquitectura

### Frontend (HTML + JS estático)
- **`app.js`** es el núcleo de toda la lógica del frontend — se carga en todas las páginas y controla auth, fetch de datos, renderizado de gráficos y UI.
- **`SERIES`** (array en `app.js`) es la fuente de verdad de todos los indicadores: define fuente, IDs de API, colores, unidades, y si son `premium`.
- La página activa se detecta con clases CSS en `<body>` (`page-datos`, `page-detalle`) — `app.js` usa estas flags para alterar su comportamiento (controles extra, historial ampliado, etc.).
- `detalle.html` recibe el indicador vía query param `?id=` y renderiza el mismo componente de card pero expandido.

### Fuentes de datos (todas consumidas en el browser)
| Fuente | Qué provee | Cómo |
|---|---|---|
| **Bluelytics** | Dólar oficial y blue | REST público |
| **BCRA v4.0** | Reservas, base monetaria, BADLAR, TC mayorista | `/estadisticas/v4.0/monetarias/{id}` |
| **INDEC / datos.gob.ar** | IPC, EMAE | `/series/api/series/?ids=` |
| **JSON local** | ICC Di Tella, EI Di Tella, indicadores REM, Merval, Oro | `data/{id}.json` generados por `subir_datos.py` y `fetch_mercados.py` |
| **ArgentinaDatos** | Riesgo País (EMBI+) | REST público con CORS, `api.argentinadatos.com` |

**Nota CORS / límites:** Yahoo Finance (Merval `^MERV`, Oro `GC=F`) bloquea CORS desde el browser y Alpha Vantage tiene límite de 25 req/día compartido. Por eso ambos se traen del lado servidor con `fetch_mercados.py` a `data/merval.json` y `data/oro.json`, y se consumen con `fuente: 'local'`. El oro es el futuro COMEX en USD/oz directo.

### Datos locales (ICC, EI, REM)
- `subir_datos.py` parsea los Excel de UTDT (ICC, EI) y BCRA (REM) y genera `data/{id}.json`.
- Cada JSON es un array de `{ fecha: "YYYY-MM-DD", valor: number }` ordenado por fecha.
- `app.js` los carga con `fetch('data/{id}.json')` — sin dependencias externas.
- Para actualizar: bajá el Excel nuevo, corrés `python subir_datos.py`, y deployás.

### Chat IA
- `streamlit_app.py` es una app Streamlit independiente que usa Google Gemini (`gemini-1.5-pro-latest`) como modelo.
- Corre en `localhost:8501` y el frontend tiene un botón que abre esa URL en nueva pestaña.
- Secrets: en producción (Streamlit Cloud) lee `GEMINI_API_KEY` de `st.secrets`; localmente desde `.env`.

## Agregar un nuevo indicador

1. Agregarlo al array `SERIES` en `app.js` con su `fuente` correspondiente.
2. Si la fuente es `supabase`, agregar los datos via `subir_datos.py` con una nueva llamada a `procesar_y_subir()`.
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
