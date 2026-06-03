/* global Chart */

// Detectamos si estamos en la página de herramientas interactivas
const isToolsPage = document.body.classList.contains('page-tools');
const isDatosPage = document.body.classList.contains('page-datos');
const isDetallePage = document.body.classList.contains('page-detalle');

// ─── Configuración de series ──────────────────────────────────────────────────

const SERIES = [
  {
    id:       'tc-oficial',
    titulo:   'Tipo de Cambio Oficial',
    categoria: 'Mercado Cambiario',
    fuente:   'bluelytics',
    tipo_tc:  'oficial',
    unidad:   '$/USD',
    color:    '#2563eb',
    dias:     90,
    diasFree: 30,
    premium:  false,
    principal: true,
  },
  {
    id:      'tc-blue',
    titulo:  'Dólar Blue',
    categoria: 'Mercado Cambiario',
    fuente:  'bluelytics',
    tipo_tc: 'blue',
    unidad:  '$/USD',
    color:   '#059669',
    dias:    90,
    premium: false,
  },
  {
    id:        'inflacion',
    titulo:    'Inflación Mensual (IPC)',
    categoria: 'Precios e Inflación',
    fuente:    'indec',
    serieId:   '148.3_INIVELNAL_DICI_M_26',
    unidad:    '%',
    color:     '#dc2626',
    meses:     24,
    mesesFree: 12,
    tipo:      'bar',
    variacion: true,
    premium:   false,
    principal: true,
  },
  {
    id:       'emae',
    titulo:   'Actividad Económica (EMAE)',
    categoria: 'Actividad Económica',
    fuente:   'emae',
    seriesEmae: {
      estacional: '143.3_NO_PR_2004_A_21',  // EMAE serie original, base 2004
      desest:     '143.3_NO_PR_2004_A_31',  // EMAE desestacionalizada, base 2004
    },
    anioBase: 2004,
    unidad:   'índice',
    color:    '#0e7490',
    meses:    36,
    premium:  false,
    emaeMultivista: true,
    mensual:  true,
  },
  {
    id:        'icc-ditella',
    titulo:    'Confianza del Consumidor (Var. Mensual)',
    categoria: 'Confianza y Expectativas',
    fuente:    'supabase',
    serieId:   'icc',
    unidad:    '%',
    color:     '#ea580c',
    meses:     24,
    premium:   false,
    variacion: true,
    tipo:      'bar',
  },
  {
    id:        'ei-ditella',
    titulo:    'Expectativas de Inflación (Di Tella)',
    categoria: 'Confianza y Expectativas',
    fuente:    'supabase',
    serieId:   'ei',
    unidad:    '%',
    color:     '#ca8a04',
    meses:     24,
    premium:   false,
  },
  {
    id:        'rem-ipc',
    titulo:    'Inflación General (REM)',
    categoria: 'Expectativas (REM)',
    fuente:    'supabase',
    serieId:   'rem-ipc',
    unidad:    '%',
    color:     '#f43f5e',
    meses:     24,
    premium:   false
  },
  {
    id:        'rem-ipc-nucleo',
    titulo:    'Inflación Núcleo (REM)',
    categoria: 'Expectativas (REM)',
    fuente:    'supabase',
    serieId:   'rem-ipc-nucleo',
    unidad:    '%',
    color:     '#fb7185',
    meses:     24,
    premium:   false
  },
  {
    id:        'rem-pib',
    titulo:    'Evolución del PIB (REM)',
    categoria: 'Expectativas (REM)',
    fuente:    'supabase',
    serieId:   'rem-pib',
    unidad:    '%',
    color:     '#10b981',
    meses:     24,
    premium:   false
  },
  {
    id:        'rem-tcn',
    titulo:    'Tipo de Cambio Nominal (REM)',
    categoria: 'Expectativas (REM)',
    fuente:    'supabase',
    serieId:   'rem-tcn',
    unidad:    '$/USD',
    color:     '#3b82f6',
    meses:     24,
    premium:   false
  },
  {
    id:        'rem-badlar',
    titulo:    'Tasa BADLAR (REM)',
    categoria: 'Expectativas (REM)',
    fuente:    'supabase',
    serieId:   'rem-badlar',
    unidad:    '%',
    color:     '#f59e0b',
    meses:     24,
    premium:   false
  },
  {
    id:        'rem-expo',
    titulo:    'Exportaciones FOB (REM)',
    categoria: 'Expectativas (REM)',
    fuente:    'supabase',
    serieId:   'rem-expo',
    unidad:    'M USD',
    color:     '#0891b2',
    meses:     24,
    premium:   false
  },
  {
    id:        'rem-impo',
    titulo:    'Importaciones CIF (REM)',
    categoria: 'Expectativas (REM)',
    fuente:    'supabase',
    serieId:   'rem-impo',
    unidad:    'M USD',
    color:     '#0369a1',
    meses:     24,
    premium:   false
  },
  {
    id:        'rem-desocupacion',
    titulo:    'Desocupación (REM)',
    categoria: 'Expectativas (REM)',
    fuente:    'supabase',
    serieId:   'rem-desocupacion',
    unidad:    '%',
    color:     '#64748b',
    meses:     24,
    premium:   false
  },
  {
    id:        'rem-resultado',
    titulo:    'Resultado Primario (REM)',
    categoria: 'Expectativas (REM)',
    fuente:    'supabase',
    serieId:   'rem-resultado',
    unidad:    'Miles M ARS',
    color:     '#06b6d4',
    meses:     24,
    premium:   false
  },
  {
    id:        'reservas-bcra',
    titulo:    'Reservas Internacionales',
    categoria: 'Banco Central',
    fuente:    'bcra',
    serieId:   1, // El ID 1 corresponde a Reservas Internacionales
    unidad:    'M USD',
    color:     '#0284c7',
    dias:      365,
    diasFree:  90,
    premium:   false,
    principal: true,
  },
  {
    id:        'base-monetaria',
    titulo:    'Base Monetaria',
    categoria: 'Banco Central',
    fuente:    'bcra',
    serieId:   15, // ID 15: Base Monetaria - Total
    unidad:    'M ARS',
    color:     '#1e40af',
    dias:      365,
    diasFree:  90,
    premium:   false
  },
  {
    id:        'tasa-badlar',
    titulo:    'Tasa BADLAR (Bancos Privados)',
    categoria: 'Sistema Financiero',
    fuente:    'bcra',
    serieId:   8,  // ID 8: BADLAR en pesos de bancos privados
    unidad:    '%',
    color:     '#14b8a6',
    dias:      365,
    diasFree:  90,
    premium:   false // Podés ponerlo en 'true' si querés que sea solo para registrados
  },
  {
    id:        'tc-mayorista',
    titulo:    'Tipo de Cambio Mayorista',
    categoria: 'Mercado Cambiario',
    fuente:    'bcra',
    serieId:   4,  // ID 4: Dólar Mayorista Com. A3500
    unidad:    '$/USD',
    color:     '#3b82f6',
    dias:      90,
    premium:   false
  },
  {
    id:        'oro-usd',
    titulo:    'Precio del Oro',
    categoria: 'Commodities',
    fuente:    'local',
    serieId:   'oro',
    unidad:    'USD/oz',
    color:     '#d97706',
    dias:      365,
    premium:   false,
  },
  // ─── Nuevos indicadores ───────────────────────────────────────────────────────
  {
    id:        'riesgo-pais',
    titulo:    'Riesgo País (EMBI+)',
    categoria: 'Mercado de Capitales',
    fuente:    'argentinadatos',
    serieId:   'finanzas/indices/riesgo-pais',
    unidad:    'puntos básicos',
    color:     '#ef4444',
    dias:      730,
    premium:   false,
    principal: true,
  },
  {
    id:        'merval-ars',
    titulo:    'Merval',
    categoria: 'Mercado de Capitales',
    fuente:    'local',
    serieId:   'merval',
    unidad:    'ARS',
    color:     '#0d9488',
    dias:      365,
    premium:   false,
  },
  {
    id:        'inflacion-anual',
    titulo:    'Inflación Interanual (IPC)',
    categoria: 'Precios e Inflación',
    fuente:    'bcra',
    serieId:   28,
    unidad:    '%',
    color:     '#be123c',
    dias:      730,
    premium:   false,
    tipo:      'bar',
  },
  {
    id:        'tasa-plazo-fijo',
    titulo:    'Tasa Plazo Fijo (30 días)',
    categoria: 'Sistema Financiero',
    fuente:    'bcra',
    serieId:   12,
    unidad:    '% anual',
    color:     '#f97316',
    dias:      365,
    premium:   false,
  },
];


// ─── Utilidades ───────────────────────────────────────────────────────────────
// formatFecha, isoHoy, isoHace, agregarDatos y transformarEmae viven en lib.js
// (se carga antes que app.js). Tienen tests en test/lib.test.js.

// Generador temporal de datos para series de terceros sin API pública estable
function generarMock(tipo, meses) {
  const datos = [];
  let valorActual = tipo.includes('icc') ? 42.5 : 120; // Valores iniciales lógicos
  const d = new Date();
  
  for (let i = 0; i < meses; i++) {
    const fecha = new Date(d.getFullYear(), d.getMonth() - (meses - 1 - i), 1);
    const variacion = tipo.includes('icc') ? (Math.random() * 4 - 2) : (Math.random() * 15 - 7.5);
    valorActual = Math.max(0, valorActual + variacion);
    
    datos.push({
      fecha: fecha.toISOString().split('T')[0],
      valor: +(valorActual).toFixed(2)
    });
  }
  return datos;
}

// ─── Fetch APIs ───────────────────────────────────────────────────────────────

let _bluelyticsCache = null;

async function fetchBluelytics(tipo, dias) {
  if (!_bluelyticsCache) {
    const res = await fetch('https://api.bluelytics.com.ar/v2/evolution.json');
    if (!res.ok) throw new Error(`Bluelytics HTTP ${res.status}`);
    _bluelyticsCache = await res.json();
  }
  return _bluelyticsCache
    .filter(d => d.source.toLowerCase() === tipo.toLowerCase())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-dias)
    .map(d => ({ fecha: d.date, valor: (d.value_sell + d.value_buy) / 2 }));
}

async function fetchIndec(serieId, meses) {
  const url = `https://apis.datos.gob.ar/series/api/series/?ids=${serieId}&limit=${meses}&sort=desc&format=json`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`INDEC HTTP ${res.status}`);
  const json = await res.json();
  return (json.data || [])
    .map(([fecha, valor]) => ({ fecha, valor }))
    .reverse();
}

async function fetchBcra(idVariable, dias) {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(hasta.getDate() - dias);
  
  const format = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  
  const url = `https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/${idVariable}?desde=${format(desde)}&hasta=${format(hasta)}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`BCRA HTTP ${res.status}`);
  const json = await res.json();
  
  // En la API v4.0, el historial de datos viene dentro del array "detalle"
  const detalle = json.results?.[0]?.detalle || [];
  
  return detalle
    .map(d => ({ fecha: d.fecha, valor: d.valor }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// EMAE: trae las dos series (con estacionalidad + desestacionalizada) y las cachea.
// Devuelve { estacional: [...], desest: [...] } con índices mensuales base 2004.
let _emaeCache = null;

async function fetchEmae(seriesEmae) {
  if (_emaeCache) return _emaeCache;
  const ids = `${seriesEmae.estacional},${seriesEmae.desest}`;
  const url = `https://apis.datos.gob.ar/series/api/series/?ids=${ids}&limit=5000&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`INDEC HTTP ${res.status}`);
  const json = await res.json();
  const estacional = [];
  const desest = [];
  (json.data || []).forEach(([fecha, vEst, vDes]) => {
    if (vEst != null) estacional.push({ fecha, valor: +vEst.toFixed(2) });
    if (vDes != null) desest.push({ fecha, valor: +vDes.toFixed(2) });
  });
  if (!estacional.length && !desest.length) throw new Error('Sin datos de EMAE.');
  _emaeCache = { estacional, desest };
  return _emaeCache;
}

async function fetchLocal(serieId, dias = null) {
  const res = await fetch(`data/${serieId}.json`);
  if (!res.ok) throw new Error(`No se encontró data/${serieId}.json`);
  const data = await res.json();
  if (dias == null) return data;
  const desde = isoHace(dias);
  return data.filter(d => (d.fecha || '').split('T')[0] >= desde);
}

async function fetchArgentinaDatos(endpoint, dias) {
  const res = await fetch(`https://api.argentinadatos.com/v1/${endpoint}`);
  if (!res.ok) throw new Error(`ArgentinaDatos HTTP ${res.status}`);
  const data = await res.json();
  const desde = isoHace(dias);
  return data
    .filter(d => d.fecha >= desde)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(d => ({ fecha: d.fecha, valor: d.valor }));
}




// ─── Hero stats ───────────────────────────────────────────────────────────────

function inicializarHeroStats(lista = SERIES) {
  const container = document.getElementById('hero-stats');
  if (!container) return;
  container.innerHTML = '';

  const tile = serie => {
    const div = document.createElement('div');
    div.className = 'hero-stat';
    div.id = `hstat-${serie.id}`;
    div.innerHTML = `
      <div class="hero-stat-label">${serie.titulo}</div>
      <div class="hero-stat-value placeholder" id="hval-${serie.id}">—</div>
      <div class="hero-stat-unit">${serie.unidad}</div>
    `;
    return div;
  };

  // Si la lista trae principales + resto (caso Datos), mostramos los principales
  // y el resto detrás de una cajita-flecha desplegable. Si no (caso Inicio, que
  // ya manda solo los principales), se muestran todos planos.
  const principales = lista.filter(s => s.principal);
  const ocultos = principales.length ? lista.filter(s => !s.principal) : [];
  const visibles = principales.length ? principales : lista;

  visibles.forEach(s => container.appendChild(tile(s)));

  if (ocultos.length) {
    const wrap = document.createElement('span');
    wrap.id = 'hero-stats-resto';
    ocultos.forEach(s => wrap.appendChild(tile(s)));
    container.appendChild(wrap);

    const btn = document.createElement('button');
    btn.className = 'hero-stats-toggle';
    btn.setAttribute('aria-label', 'Ver todos los valores');
    btn.innerHTML = '<span class="chev">▾</span>';
    btn.onclick = () => {
      const abierto = wrap.classList.toggle('abierto');
      btn.classList.toggle('abierto', abierto);
      btn.setAttribute('aria-label', abierto ? 'Ver menos valores' : 'Ver todos los valores');
    };
    container.appendChild(btn);
  }
}

function actualizarHeroStat(serie, valor) {
  const el = document.getElementById(`hval-${serie.id}`);
  if (!el) return;
  el.textContent = valor.toLocaleString('es-AR', { maximumFractionDigits: 2 });
  el.classList.remove('placeholder');
}


// ─── Cards ────────────────────────────────────────────────────────────────────

function crearCard(serie) {
  const div = document.createElement('div');
  div.className = 'card';
  div.id = `card-${serie.id}`;
  div.style.setProperty('--card-color', serie.color);

  // Hacemos que la tarjeta sea clickeable y redirija a detalle.html
  if (!isToolsPage) {
    div.style.cursor = 'pointer';
    div.title = 'Ver gráfico ampliado';
    // Accesibilidad: navegable por teclado y anunciada como enlace
    div.setAttribute('role', 'link');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', `Ver detalle de ${serie.titulo}`);
    div.addEventListener('mouseenter', () => div.style.transform = 'translateY(-4px)');
    div.addEventListener('mouseleave', () => div.style.transform = 'translateY(0)');
    div.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    const irADetalle = (e) => {
      if (e.target.tagName.toLowerCase() === 'button' || e.target.tagName.toLowerCase() === 'input') return;
      window.location.href = `detalle.html?id=${serie.id}`;
    };
    div.onclick = irADetalle;
    div.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); irADetalle(e); }
    });
  }

  div.innerHTML = `
    <div class="card-header">
      <h2 class="card-title">
        ${serie.titulo}
        ${isToolsPage ? `<button id="btn-export-${serie.id}" style="display: none; margin-left: 8px; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; cursor: pointer; border: 1px solid #cbd5e1; background: transparent; color: inherit;" title="Descargar datos en CSV">⬇️ CSV</button>` : ''}
      </h2>
      <span class="badge muted" id="badge-${serie.id}">Cargando…</span>
    </div>
    <div class="card-meta" id="meta-${serie.id}"></div>
    ${isToolsPage ? `
    <div class="card-controls" id="controls-${serie.id}" style="padding: 0.25rem 1rem 0.75rem; font-size: 0.8rem; display: none; gap: 1rem; align-items: center; flex-wrap: wrap; border-bottom: 1px solid #f1f5f9;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <label style="font-weight: 500;">Agrupar</label>
        <div class="btn-group" id="agg-group-${serie.id}"></div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 280px;">
        <label style="font-weight: 500;">Período</label>
        <input type="date" id="start-date-${serie.id}" style="padding: 2px 4px; border-radius: 4px; border: 1px solid #e2e8f0; outline: none; flex: 1;">
        <span class="muted">→</span>
        <input type="date" id="end-date-${serie.id}" style="padding: 2px 4px; border-radius: 4px; border: 1px solid #e2e8f0; outline: none; flex: 1;">
      </div>
    </div>
    ` : ''}
    <div class="chart-wrap" id="wrap-${serie.id}">
      <div class="skeleton"></div>
    </div>
  `;
  return div;
}



// ─── Charts ───────────────────────────────────────────────────────────────────

const charts = {};

// Plugin inline: dibuja crosshair vertical + punto de valor al hover
const crosshairPlugin = {
  id: 'crosshair',
  afterDraw(chart) {
    const active = chart.tooltip._active;
    if (!active || !active.length) return;
    const { ctx, chartArea: { top, bottom } } = chart;
    const x = active[0].element.x;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(100,116,139,0.35)';
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.restore();
  },
};

function renderChart(serie, datos) {
  const wrap = document.getElementById(`wrap-${serie.id}`);
  wrap.innerHTML = '<canvas></canvas>';
  const canvas = wrap.querySelector('canvas');

  if (charts[serie.id]) charts[serie.id].destroy();

  if (!datos || datos.length === 0) {
    wrap.innerHTML = `<div class="chart-error" style="padding: 2rem 1rem;">No hay datos para el período seleccionado.</div>`;
    document.getElementById(`badge-${serie.id}`).textContent = 'Sin datos';
    return;
  }

  const tipo      = serie.tipo || 'line';
  const labels    = datos.map(d => formatFecha(d.fecha, serie));
  const values    = datos.map(d => d.valor);
  const enDetalle = isDetallePage || isToolsPage;

  // Nombre accesible para lectores de pantalla
  const ultimo = datos[datos.length - 1];
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label',
    `Gráfico de ${serie.titulo}. Último valor: ${ultimo.valor.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${serie.unidad}, ${formatFecha(ultimo.fecha, serie)}.`);

  if (enDetalle) {
    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousedown', () => { canvas.style.cursor = 'grabbing'; });
    canvas.addEventListener('mouseup',   () => { canvas.style.cursor = 'grab'; });
    // Doble clic para resetear zoom
    canvas.addEventListener('dblclick', () => resetZoom(serie.id));
  }

  charts[serie.id] = new Chart(canvas, {
    type:    tipo,
    plugins: enDetalle ? [crosshairPlugin] : [],
    data: {
      labels,
      datasets: [{
        data:            values,
        borderColor:     serie.color,
        backgroundColor: tipo === 'bar' ? serie.color + 'bb' : serie.color + '18',
        borderWidth:     tipo === 'bar' ? 0 : 2,
        borderRadius:    tipo === 'bar' ? 3 : 0,
        pointRadius:     0,
        pointHoverRadius: enDetalle ? 5 : 0,
        pointHoverBackgroundColor: serie.color,
        pointHoverBorderColor:     '#fff',
        pointHoverBorderWidth:     2,
        tension:         0.3,
        fill:            tipo !== 'bar',
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation:           { duration: 400 },
      interaction: {
        mode:      'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          backgroundColor: 'rgba(15,23,42,0.85)',
          padding:         10,
          cornerRadius:    8,
          titleFont:       { size: 11, weight: '500' },
          bodyFont:        { size: 13, weight: '600' },
          callbacks: {
            title: ctx => ctx[0].label,
            label: ctx =>
              `${ctx.parsed.y.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${serie.unidad}`,
          },
        },
        zoom: {
          zoom: {
            wheel:          { enabled: true, speed: 0.12 },
            pinch:          { enabled: true },
            mode:           'x',
            onZoomComplete: () => mostrarResetZoom(serie.id),
          },
          pan: {
            enabled:       enDetalle,
            mode:          'x',
            onPanComplete: () => mostrarResetZoom(serie.id),
          },
          limits: { x: { min: 'original', max: 'original' } },
        },
      },
      scales: {
        x: {
          ticks:  { maxTicksLimit: 6, maxRotation: 0, font: { size: 10 } },
          grid:   { display: false },
          border: { display: false },
        },
        y: {
          ticks: {
            font: { size: 10 },
            callback: v =>
              Math.abs(v) >= 1000
                ? `${(v / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}k`
                : v.toLocaleString('es-AR', { maximumFractionDigits: 1 }),
          },
          grid:   { color: '#f1f5f9' },
          border: { display: false },
        },
      },
    },
  });
}

function mostrarResetZoom(serieId) {
  const hint = document.getElementById(`hint-zoom-${serieId}`);
  if (hint) { hint.style.transition = 'opacity .4s'; hint.style.opacity = '0'; }
}

function resetZoom(serieId) {
  const chart = charts[serieId];
  if (chart) chart.resetZoom();
  const hint = document.getElementById(`hint-zoom-${serieId}`);
  if (hint) hint.style.opacity = '1';
}

function descargarPNG(serieId, titulo) {
  const chart = charts[serieId];
  if (!chart) return;
  // Fondo blanco: el canvas es transparente por defecto y queda feo en PNG
  const canvas = chart.canvas;
  const tmp = document.createElement('canvas');
  tmp.width = canvas.width;
  tmp.height = canvas.height;
  const ctx = tmp.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, tmp.width, tmp.height);
  ctx.drawImage(canvas, 0, 0);

  const link = document.createElement('a');
  const slug = (titulo || serieId).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  link.download = `macroar-${slug}.png`;
  link.href = tmp.toDataURL('image/png');
  link.click();
}


// ─── Controles de Gráfico ─────────────────────────────────────────────────────

const rawDataStore = {};

function setupChartControls(serie, datos) {
  if (!isToolsPage && !isDetallePage) return; // Si no es herramientas ni detalle, salimos
  if (serie.emaeMultivista) return setupEmaeControls(serie, datos);

  const controlsContainer = document.getElementById(`controls-${serie.id}`);
  const aggGroup = document.getElementById(`agg-group-${serie.id}`);
  const startDateInput = document.getElementById(`start-date-${serie.id}`);
  const endDateInput = document.getElementById(`end-date-${serie.id}`);

  // 1. Poblar botones de agregación
  aggGroup.innerHTML = '';
  const esSerieMensual = serie.fuente === 'indec';
  const periodosDisponibles = esSerieMensual
    ? [['mensual_orig', 'Mensual'], ['trimestral', 'Trimestral'], ['anual', 'Anual']]
    : [['diario', 'Diario'], ['mensual', 'Mensual'], ['trimestral', 'Trimestral'], ['anual', 'Anual']];

  periodosDisponibles.forEach(([key, label], index) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.dataset.agg = key;
    Object.assign(btn.style, { background: 'transparent', border: '1px solid #e2e8f0', padding: '3px 8px', cursor: 'pointer', fontSize: '0.75rem' });
    if (index === 0) btn.style.borderRadius = '6px 0 0 6px';
    if (index === periodosDisponibles.length - 1) btn.style.borderRadius = '0 6px 6px 0';
    if (index > 0) btn.style.borderLeft = 'none';

    btn.onclick = () => {
      aggGroup.querySelectorAll('button').forEach(b => { b.style.background = 'transparent'; b.style.color = 'inherit'; });
      btn.style.background = '#e2e8f0';
      btn.style.color = '#1e293b';
      actualizarGrafico(serie.id);
    };
    aggGroup.appendChild(btn);
  });
  aggGroup.firstChild.style.background = '#e2e8f0';
  aggGroup.firstChild.style.color = '#1e293b';

  // 2. Poblar inputs de fecha
  const minDate = datos[0].fecha.slice(0, 10);
  const maxDate = datos[datos.length - 1].fecha.slice(0, 10);
  startDateInput.min = endDateInput.min = minDate;
  startDateInput.max = endDateInput.max = maxDate;
  startDateInput.value = minDate;
  endDateInput.value = maxDate;

  // 3. Agregar listeners
  startDateInput.onchange = () => actualizarGrafico(serie.id);
  endDateInput.onchange = () => actualizarGrafico(serie.id);

  // 4. Mostrar controles
  controlsContainer.style.display = 'flex';
}

// Controles específicos del EMAE: selector de serie (estacional/desest) + lectura (índice/variaciones)
function setupEmaeControls(serie, datos) {
  const controlsContainer = document.getElementById(`controls-${serie.id}`);
  if (!controlsContainer) return;

  const grupoBotones = (groupId, opciones, activo) => {
    const botones = opciones.map(([val, label], i) => {
      const radius = i === 0 ? '6px 0 0 6px' : i === opciones.length - 1 ? '0 6px 6px 0' : '0';
      const borderLeft = i > 0 ? 'border-left:none;' : '';
      const act = val === activo;
      return `<button data-val="${val}" data-active="${act ? 1 : 0}" style="background:${act ? '#e2e8f0' : 'transparent'}; color:${act ? '#1e293b' : 'inherit'}; border:1px solid #e2e8f0; ${borderLeft} padding:3px 10px; cursor:pointer; font-size:0.75rem; border-radius:${radius}; font-family:inherit;">${label}</button>`;
    }).join('');
    return `<div class="btn-group" id="${groupId}">${botones}</div>`;
  };

  controlsContainer.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.5rem;">
      <label style="font-weight:500; color:var(--navy);">Serie:</label>
      ${grupoBotones(`emae-serie-${serie.id}`, [['desest', 'Desestacionalizada'], ['estacional', 'Con estacionalidad']], 'desest')}
    </div>
    <div style="display:flex; align-items:center; gap:0.5rem;">
      <label style="font-weight:500; color:var(--navy);">Lectura:</label>
      ${grupoBotones(`emae-lectura-${serie.id}`, [['indice', 'Índice'], ['var-mensual', 'Var. mensual'], ['var-trimestral', 'Var. trimestral'], ['var-interanual', 'Var. interanual']], 'indice')}
    </div>
    <div style="display:flex; align-items:center; gap:0.5rem; flex:1; min-width:280px;">
      <label style="font-weight:500; color:var(--navy);">Período:</label>
      <input type="date" id="start-date-${serie.id}" style="padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0; outline:none; flex:1; font-family:inherit;">
      <span class="muted">→</span>
      <input type="date" id="end-date-${serie.id}" style="padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0; outline:none; flex:1; font-family:inherit;">
    </div>
  `;

  // Listeners de los grupos de botones (toggle exclusivo + re-render)
  ['emae-serie', 'emae-lectura'].forEach(prefix => {
    const group = document.getElementById(`${prefix}-${serie.id}`);
    group.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        group.querySelectorAll('button').forEach(b => {
          b.dataset.active = '0';
          b.style.background = 'transparent';
          b.style.color = 'inherit';
        });
        btn.dataset.active = '1';
        btn.style.background = '#e2e8f0';
        btn.style.color = '#1e293b';
        actualizarGrafico(serie.id);
      };
    });
  });

  // Rango de fechas sobre la serie mensual
  const startDateInput = document.getElementById(`start-date-${serie.id}`);
  const endDateInput = document.getElementById(`end-date-${serie.id}`);
  const minDate = datos[0].fecha.slice(0, 10);
  const maxDate = datos[datos.length - 1].fecha.slice(0, 10);
  startDateInput.min = endDateInput.min = minDate;
  startDateInput.max = endDateInput.max = maxDate;
  startDateInput.value = minDate;
  endDateInput.value = maxDate;
  startDateInput.onchange = () => actualizarGrafico(serie.id);
  endDateInput.onchange = () => actualizarGrafico(serie.id);

  controlsContainer.style.display = 'flex';
}

function actualizarGrafico(serieId) {
  const serie = SERIES.find(s => s.id === serieId);
  const rawData = rawDataStore[serieId];
  if (!serie || !rawData) return;

  // EMAE: ruta especial con selector de serie + lectura
  if (serie.emaeMultivista && (isToolsPage || isDetallePage)) {
    return actualizarGraficoEmae(serie);
  }

  let processedData = rawData;

  // Solo aplicar filtros si estamos en la vista de herramientas o detalle
  if (isToolsPage || isDetallePage) {
    const aggBtn = document.querySelector(`#agg-group-${serieId} button[style*="background: rgb(226, 232, 240)"]`);
    const aggregation = aggBtn ? aggBtn.dataset.agg : 'diario';
    const startDate = document.getElementById(`start-date-${serieId}`).value;
    const endDate = document.getElementById(`end-date-${serieId}`).value;

    const filteredData = rawData.filter(d => d.fecha.slice(0, 10) >= startDate && d.fecha.slice(0, 10) <= endDate);
    processedData = agregarDatos(filteredData, aggregation);
  }

  renderChart(serie, processedData);

  const badge = document.getElementById(`badge-${serie.id}`);
  if (processedData.length > 0) {
    const ultimoValor = processedData[processedData.length - 1].valor;
    badge.textContent = `${ultimoValor.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${serie.unidad}`;
  }

  if (isToolsPage || isDetallePage) {
    const btnExport = document.getElementById(`btn-export-${serieId}`);
    if (btnExport) btnExport.onclick = () => exportarCSV(serie, processedData);
  }
}

const LECTURAS_EMAE_LABEL = {
  'indice':         'Índice',
  'var-mensual':    'Variación % mensual',
  'var-trimestral': 'Variación % trimestral',
  'var-interanual': 'Variación % interanual',
};

function actualizarGraficoEmae(serie) {
  const serieId = serie.id;
  const serieSel   = document.querySelector(`#emae-serie-${serieId} button[data-active="1"]`)?.dataset.val || 'desest';
  const lecturaSel = document.querySelector(`#emae-lectura-${serieId} button[data-active="1"]`)?.dataset.val || 'indice';

  const base = (_emaeCache && _emaeCache[serieSel]) ? _emaeCache[serieSel] : rawDataStore[serieId];

  // Filtrar por fecha sobre la serie mensual ANTES de transformar (evita problemas con formato trimestral)
  const startDate = document.getElementById(`start-date-${serieId}`).value;
  const endDate   = document.getElementById(`end-date-${serieId}`).value;
  const filtrada = base.filter(d => d.fecha.slice(0, 10) >= startDate && d.fecha.slice(0, 10) <= endDate);

  const processedData = transformarEmae(filtrada, lecturaSel);

  // Serie derivada para el render: índice = línea, variaciones = barras
  const esIndice = lecturaSel === 'indice';
  const serieRender = {
    ...serie,
    unidad: esIndice ? `índice (base ${serie.anioBase}=100)` : '%',
    tipo:   esIndice ? 'line' : 'bar',
  };

  renderChart(serieRender, processedData);

  const badge = document.getElementById(`badge-${serieId}`);
  if (badge && processedData.length > 0) {
    const ultimo = processedData[processedData.length - 1].valor;
    const unidadBadge = esIndice ? `(base ${serie.anioBase}=100)` : '%';
    const signo = !esIndice && ultimo > 0 ? '+' : '';
    badge.textContent = `${signo}${ultimo.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${unidadBadge}`;
  }

  // Sublabel dinámico de la lectura
  const meta = document.getElementById(`meta-${serieId}`);
  if (meta && processedData.length > 0) {
    const ultimo = processedData[processedData.length - 1];
    const serieTxt = serieSel === 'desest' ? 'desestacionalizada' : 'con estacionalidad';
    meta.textContent = `${LECTURAS_EMAE_LABEL[lecturaSel]} · serie ${serieTxt} · último: ${formatFecha(ultimo.fecha, serie)}`;
  }

  const btnExport = document.getElementById(`btn-export-${serieId}`);
  if (btnExport) {
    btnExport.onclick = () => exportarCSVEmaeCompleto();
    btnExport.title = 'Descargar CSV con todas las lecturas (índice y variaciones, ambas series)';
  }
}

// ─── Herramientas Extras ──────────────────────────────────────────────────────

const estadoMercado = { oficial: null, blue: null };

function exportarCSV(serie, datos) {
  if (!datos || !datos.length) return;
  const cabeceras = ['Fecha', 'Valor'];
  const filas = datos.map(d => `${d.fecha},${d.valor}`);
  const csvContent = [cabeceras.join(','), ...filas].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `macroar_${serie.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// CSV del EMAE con TODAS las lecturas: ambas series y sus variaciones, alineadas por fecha.
function exportarCSVEmaeCompleto() {
  if (!_emaeCache) return;
  const { estacional, desest } = _emaeCache;

  const mapNivel = arr => Object.fromEntries(arr.map(d => [d.fecha.slice(0, 10), d.valor]));
  const mapVar = (arr, lag) => {
    const m = {};
    for (let i = lag; i < arr.length; i++) {
      const prev = arr[i - lag].valor;
      m[arr[i].fecha.slice(0, 10)] = prev ? +((arr[i].valor / prev - 1) * 100).toFixed(2) : '';
    }
    return m;
  };

  const estNivel = mapNivel(estacional);
  const desNivel = mapNivel(desest);
  const estVarM  = mapVar(estacional, 1);
  const estVarI  = mapVar(estacional, 12);
  const desVarM  = mapVar(desest, 1);
  const desVarI  = mapVar(desest, 12);

  const fechas = [...new Set([...estacional, ...desest].map(d => d.fecha.slice(0, 10)))].sort();

  const cabeceras = [
    'Fecha',
    'Indice_con_estacionalidad',
    'Indice_desestacionalizado',
    'Var_mensual_desest_%',
    'Var_interanual_desest_%',
    'Var_mensual_con_estacionalidad_%',
    'Var_interanual_con_estacionalidad_%',
  ];
  const filas = fechas.map(f => [
    f,
    estNivel[f] ?? '',
    desNivel[f] ?? '',
    desVarM[f]  ?? '',
    desVarI[f]  ?? '',
    estVarM[f]  ?? '',
    estVarI[f]  ?? '',
  ].join(','));

  const csv = [cabeceras.join(','), ...filas].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'macroar_emae_completo.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function crearCardCalculadora() {
  const div = document.createElement('div');
  div.className = 'card';
  div.id = 'card-calculadora';
  div.style.setProperty('--card-color', '#f59e0b'); // Color ámbar
  div.innerHTML = `
    <div class="card-header">
      <h2 class="card-title">Calculadora de Divisas</h2>
    </div>
    <div class="card-meta">Convertí ARS ↔ USD usando las cotizaciones actuales</div>
    <div class="chart-wrap" style="height: auto; padding: 1rem 0;">
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        <input type="number" id="calc-monto" placeholder="Monto..." value="1000" style="flex: 1; padding: 0.5rem; border-radius: 4px; border: 1px solid #e2e8f0; outline: none; width: 50%;">
        <select id="calc-moneda" style="padding: 0.5rem; border-radius: 4px; border: 1px solid #e2e8f0; outline: none; background: #fff; width: 50%;">
          <option value="USD">Dólares (USD) a Pesos</option>
          <option value="ARS">Pesos (ARS) a Dólares</option>
        </select>
      </div>
      <div id="calc-resultados" style="font-size: 0.95rem; line-height: 1.6; background: #f8fafc; padding: 0.75rem; border-radius: 6px; border: 1px solid #e2e8f0;">
        <span class="muted">Esperando datos del mercado...</span>
      </div>
    </div>
  `;
  
  // Escuchar cambios en los inputs para recalcular automáticamente
  div.addEventListener('input', actualizarCalculadora);
  
  return div;
}

function actualizarCalculadora() {
  const montoInput = document.getElementById('calc-monto');
  const monedaInput = document.getElementById('calc-moneda');
  const resultadosDiv = document.getElementById('calc-resultados');

  if (!montoInput || !monedaInput || !resultadosDiv) return;

  const monto = parseFloat(montoInput.value) || 0;
  const modo = monedaInput.value;

  if (!estadoMercado.oficial && !estadoMercado.blue) {
    resultadosDiv.innerHTML = '<span class="muted">Esperando datos del mercado...</span>';
    return;
  }

  let html = '';
  if (modo === 'USD') { // De Dólares a Pesos
     if (estadoMercado.oficial) html += `<div style="display: flex; justify-content: space-between;"><strong>Oficial:</strong> <span>${(monto * estadoMercado.oficial).toLocaleString('es-AR', {maximumFractionDigits:2})} ARS</span></div>`;
     if (estadoMercado.blue) html += `<div style="display: flex; justify-content: space-between;"><strong>Blue:</strong> <span>${(monto * estadoMercado.blue).toLocaleString('es-AR', {maximumFractionDigits:2})} ARS</span></div>`;
  } else { // De Pesos a Dólares
     if (estadoMercado.oficial) html += `<div style="display: flex; justify-content: space-between;"><strong>Oficial:</strong> <span>${(monto / estadoMercado.oficial).toLocaleString('es-AR', {maximumFractionDigits:2})} USD</span></div>`;
     if (estadoMercado.blue) html += `<div style="display: flex; justify-content: space-between;"><strong>Blue:</strong> <span>${(monto / estadoMercado.blue).toLocaleString('es-AR', {maximumFractionDigits:2})} USD</span></div>`;
  }
  resultadosDiv.innerHTML = html;
}


// ─── Carga de cada serie ──────────────────────────────────────────────────────

async function cargarSerie(serie) {
  const badge = document.getElementById(`badge-${serie.id}`);
  const meta  = document.getElementById(`meta-${serie.id}`);

  try {
    let datos;
    let diasReq = serie.dias;
    let mesesReq = serie.meses;

    if (isToolsPage || isDetallePage) {
      diasReq  = 3650;
      mesesReq = 120;
    }

    if (serie.fuente === 'bluelytics') {
      datos = await fetchBluelytics(serie.tipo_tc, diasReq);
    } else if (serie.fuente === 'bcra') {
      // La API del BCRA filtra por días hacia atrás
      const raw = await fetchBcra(serie.serieId, diasReq);
      datos = serie.variacion
        ? raw.slice(1).map((d, i) => ({
            fecha: d.fecha,
            valor: raw[i].valor > 0 ? +((d.valor / raw[i].valor - 1) * 100).toFixed(2) : null,
          })).filter(d => d.valor !== null)
        : raw;
    } else if (serie.fuente === 'supabase') {
      const raw = await fetchLocal(serie.serieId);
      datos = serie.variacion
        ? raw.slice(1).map((d, i) => ({
            fecha: d.fecha,
            valor: raw[i].valor > 0 ? +((d.valor / raw[i].valor - 1) * 100).toFixed(2) : null,
          })).filter(d => d.valor !== null)
        : raw;
    } else if (serie.fuente === 'argentinadatos') {
      datos = await fetchArgentinaDatos(serie.serieId, diasReq);
    } else if (serie.fuente === 'emae') {
      const emae = await fetchEmae(serie.seriesEmae);
      datos = emae.desest;  // por defecto: desestacionalizada (indica si la economía creció)
      if (!(isToolsPage || isDetallePage)) datos = datos.slice(-(serie.meses || 36));
    } else if (serie.fuente === 'local') {
      datos = await fetchLocal(serie.serieId, diasReq);
    } else if (serie.fuente.startsWith('mock')) {
      datos = generarMock(serie.fuente, mesesReq);
    } else {
      const raw   = await fetchIndec(serie.serieId, mesesReq);
      datos = serie.variacion
        ? raw.slice(1).map((d, i) => ({
            fecha: d.fecha,
            valor: raw[i].valor > 0 ? +((d.valor / raw[i].valor - 1) * 100).toFixed(2) : null,
          })).filter(d => d.valor !== null)
        : raw;
    }

    if (!datos.length) throw new Error('Sin datos disponibles');

    // Guardar datos crudos para manipulación
    rawDataStore[serie.id] = datos;

    // Actualizar elementos estáticos con el último dato disponible
    const ultimo = datos[datos.length - 1];
    meta.textContent  = `Último dato: ${formatFecha(ultimo.fecha, serie)}`;
    actualizarHeroStat(serie, ultimo.valor);

    // Vista detalle: mostrar la fecha del último registro debajo de la categoría
    const ultimaFechaEl = document.getElementById(`ultima-fecha-${serie.id}`);
    if (ultimaFechaEl) ultimaFechaEl.textContent = `Último registro: ${formatFecha(ultimo.fecha, serie)}`;

    // Configurar controles y renderizar el gráfico por primera vez
    if (isToolsPage || isDetallePage) setupChartControls(serie, datos);
    actualizarGrafico(serie.id);

    if (isToolsPage || isDetallePage) {
      // Guardar los datos para usarlos en la calculadora y actualizarla
      if (serie.id === 'tc-oficial') { estadoMercado.oficial = ultimo.valor; actualizarCalculadora(); }
      if (serie.id === 'tc-blue') { estadoMercado.blue = ultimo.valor; actualizarCalculadora(); }

      const btnExport = document.getElementById(`btn-export-${serie.id}`);
      if (btnExport) btnExport.style.display = 'inline-block';

      const btnPng = document.getElementById(`btn-png-${serie.id}`);
      if (btnPng) btnPng.style.display = 'inline-block';
    }

  } catch (err) {
    badge.textContent = 'Error';
    badge.classList.remove('muted');
    badge.classList.add('error');
    meta.textContent = err.message;
    document.getElementById(`wrap-${serie.id}`).innerHTML = `<div class="chart-error">No se pudo cargar el indicador</div>`;
  }
}


// ─── Inicialización ───────────────────────────────────────────────────────────

function loadAll() {
  _bluelyticsCache = null;

  const grid = document.getElementById('grid');
  const catContainer = document.getElementById('categories-container');

  if (grid) grid.innerHTML = '';
  if (catContainer) catContainer.innerHTML = '';

  if (typeof isDetallePage !== 'undefined' && isDetallePage) {
    const params = new URLSearchParams(window.location.search);
    const serieId = params.get('id');
    const serie = SERIES.find(s => s.id === serieId);
    
    const container = document.getElementById('detalle-content');
    if (!container) return;

    if (!serie) {
      container.innerHTML = '<p style="text-align: center; padding: 2rem;">Serie no encontrada.</p>';
      return;
    }



    container.innerHTML = `
      <div class="detalle-header">
        <h1 class="detalle-title" style="display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          ${serie.titulo}
          <button id="btn-export-${serie.id}" style="display: none; font-size: 0.85rem; padding: 4px 10px; border-radius: 6px; cursor: pointer; border: 1px solid #cbd5e1; background: #fff; color: var(--navy); font-weight: 500; font-family: inherit; transition: all 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'" title="Descargar datos en CSV">⬇️ Exportar CSV</button>
          <button id="btn-png-${serie.id}" style="display: none; font-size: 0.85rem; padding: 4px 10px; border-radius: 6px; cursor: pointer; border: 1px solid #cbd5e1; background: #fff; color: var(--navy); font-weight: 500; font-family: inherit; transition: all 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'" title="Descargar gráfico como imagen" onclick="descargarPNG('${serie.id}', '${serie.titulo}')">🖼️ Descargar PNG</button>
        </h1>
        <p class="detalle-meta">
          Categoría: ${serie.categoria} · Fuente: ${serie.fuente.toUpperCase()}${serie.anioBase ? ` · Base ${serie.anioBase}=100` : ` · Unidad: ${serie.unidad}`}
        </p>
        <p class="detalle-meta" id="ultima-fecha-${serie.id}" style="font-size:0.9rem; color:#94a3b8; margin-top:0.25rem;">Último registro: —</p>
      </div>
      <div class="card-controls" id="controls-${serie.id}" style="display: none; background: #fff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); margin-bottom: 1.5rem; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-weight: 500; color: var(--navy);">Agrupar:</label>
          <div class="btn-group" id="agg-group-${serie.id}"></div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 280px;">
          <label style="font-weight: 500; color: var(--navy);">Período:</label>
          <input type="date" id="start-date-${serie.id}" style="padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; outline: none; flex: 1; font-family: inherit;">
          <span class="muted">→</span>
          <input type="date" id="end-date-${serie.id}" style="padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; outline: none; flex: 1; font-family: inherit;">
        </div>
      </div>
      <div style="position: relative;">
        <div style="position:absolute; bottom:14px; left:50%; transform:translateX(-50%); z-index:5; pointer-events:none;" id="hint-zoom-${serie.id}">
          <span style="background:rgba(15,23,42,0.55); color:#fff; font-size:0.72rem; padding:4px 10px; border-radius:20px; white-space:nowrap; backdrop-filter:blur(4px);">Scroll para zoom · Arrastrá para navegar · Doble clic para resetear</span>
        </div>
        <div class="detalle-chart-wrap" id="wrap-${serie.id}">
          <div class="skeleton" style="height: 100%; width: 100%;"></div>
        </div>
      </div>
      <div class="detalle-info">
        <h3 style="margin-bottom: 0.5rem; color: var(--navy); font-family: 'Poppins', sans-serif;">Sobre este indicador</h3>
        <p style="color: #475569; margin-bottom: 1rem;">
          Esta serie temporal muestra la evolución de <strong>${serie.titulo}</strong>. 
          Los datos son obtenidos desde <strong>${serie.fuente.toUpperCase()}</strong>.
          En este gráfico detallado podés observar con mayor precisión los cambios en la métrica a lo largo del período disponible.
        </p>
        <p style="font-size: 0.95rem; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 1rem; margin-top: 1rem; display:flex; align-items:center; flex-wrap:wrap; gap:0.75rem;">
          <span class="badge muted" id="badge-${serie.id}">Cargando último valor...</span>
          <span id="meta-${serie.id}"></span>
        </p>
      </div>
    `;

    cargarSerie(serie);

    return;
  }

  // En el Inicio mostramos solo los indicadores principales; el catálogo completo vive en Datos.
  const esInicio = !isDatosPage && !isToolsPage && !isDetallePage;
  const seriesAMostrar = esInicio ? SERIES.filter(s => s.principal) : SERIES;

  inicializarHeroStats(seriesAMostrar);

  if (isDatosPage && catContainer) {
    const categorias = [...new Set(SERIES.map(s => s.categoria || 'Otros'))];
    const slug = cat => `cat-${cat.replace(/\s+/g, '-').toLowerCase()}`;

    // Menú scrolleable de categorías (sticky bajo el navbar)
    const menu = document.createElement('nav');
    menu.className = 'cat-menu';
    menu.setAttribute('aria-label', 'Categorías de indicadores');
    menu.innerHTML = categorias.map(cat =>
      `<a class="cat-chip" href="#${slug(cat)}">${cat}</a>`
    ).join('');
    catContainer.parentElement.insertBefore(menu, catContainer);

    categorias.forEach(cat => {
      const section = document.createElement('div');
      section.className = 'category-section';
      section.id = slug(cat);
      section.innerHTML = `
        <h3 style="margin: 2.5rem 0 1rem; font-family: 'Poppins', sans-serif; font-size: 1.15rem; color: var(--navy); border-bottom: 2px solid var(--border); padding-bottom: 0.5rem;">${cat}</h3>
        <div class="grid" id="grid-${cat.replace(/\s+/g, '-').toLowerCase()}"></div>
      `;
      catContainer.appendChild(section);

      const catGrid = section.querySelector('.grid');
      const seriesCat = SERIES.filter(s => (s.categoria || 'Otros') === cat);

      seriesCat.forEach(serie => catGrid.appendChild(crearCard(serie)));
    });

    // Resaltar el chip de la categoría visible al scrollear
    const secciones = categorias.map(cat => document.getElementById(slug(cat)));
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          menu.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
          const chip = menu.querySelector(`.cat-chip[href="#${en.target.id}"]`);
          if (chip) {
            chip.classList.add('active');
            chip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
          }
        }
      });
    }, { rootMargin: '-120px 0px -70% 0px' });
    secciones.forEach(s => s && obs.observe(s));
  } else if (grid) {
    seriesAMostrar.forEach(serie => grid.appendChild(crearCard(serie)));

    // En el Inicio, agregar un acceso al catálogo completo
    if (esInicio) grid.appendChild(crearCardVerTodos());

    // Agregar la tarjeta de calculadora al final del grid de métricas
    if (isToolsPage) {
      grid.appendChild(crearCardCalculadora());
    }
  }

  Promise.all(seriesAMostrar.map(cargarSerie));
}

// Tarjeta de acceso al catálogo completo (solo en el Inicio)
function crearCardVerTodos() {
  const div = document.createElement('div');
  div.className = 'card';
  div.style.cssText = 'display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; cursor:pointer; min-height:220px; border:2px dashed #cbd5e1; background:#f8fafc; transition:all .2s;';
  div.setAttribute('role', 'link');
  div.setAttribute('tabindex', '0');
  div.setAttribute('aria-label', 'Ver todos los indicadores');
  div.onmouseover = () => { div.style.background = '#f1f5f9'; div.style.borderColor = '#94a3b8'; };
  div.onmouseout  = () => { div.style.background = '#f8fafc'; div.style.borderColor = '#cbd5e1'; };
  const irADatos = () => { window.location.href = 'datos.html'; };
  div.onclick = irADatos;
  div.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); irADatos(); }
  });
  div.innerHTML = `
    <div style="font-size:2.5rem; line-height:1; margin-bottom:0.75rem;">📊</div>
    <div style="font-weight:600; color:var(--navy); font-family:'Poppins',sans-serif; font-size:1.05rem;">Ver todos los indicadores</div>
    <div style="color:#64748b; font-size:0.9rem; margin-top:0.35rem;">Catálogo completo por categoría →</div>
  `;
  return div;
}

loadAll();
