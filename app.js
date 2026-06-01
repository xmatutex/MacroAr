/* global Chart */

// Gratis en: https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_KEY = 'CK3QXJKSPJVSV1W4';

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
    premium: true,
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
  },
  {
    id:       'emae',
    titulo:   'Actividad Económica (EMAE)',
    categoria: 'Actividad Económica',
    fuente:   'indec',
    serieId:  '143.3_NO_PR_2004_A_21',
    unidad:   'índice',
    color:    '#7c3aed',
    meses:    36,
    premium:  true,
    variacion: false,
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
    color:     '#eab308',
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
    color:     '#8b5cf6',
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
    color:     '#d946ef',
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
    premium:   false
  },
  {
    id:        'base-monetaria',
    titulo:    'Base Monetaria',
    categoria: 'Banco Central',
    fuente:    'bcra',
    serieId:   15, // ID 15: Base Monetaria - Total
    unidad:    'M ARS',
    color:     '#8b5cf6',
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
    fuente:    'alphavantage',
    serieId:   'GLD',   // ETF que rastrea oro; GLD ≈ 0.0966 oz
    factor:    10.35,   // convierte precio GLD → USD/oz aprox
    unidad:    'USD/oz',
    color:     '#d97706',
    dias:      365,
    diasFree:  180,
    premium:   false,
  },
];


// ─── Utilidades ───────────────────────────────────────────────────────────────

function formatFecha(fechaStr, serie = null) {
  if (!fechaStr) return '—';

  // Limpiamos la hora/zona horaria si es que viene de la base de datos (ej: 2026-04-30T00:00:00+00)
  fechaStr = fechaStr.split('T')[0];

  // Nuevos formatos de agregación
  if (fechaStr.includes('-Q')) return fechaStr.replace('-Q', ' T'); // "2023-Q1" -> "2023 T1"
  if (/^\d{4}$/.test(fechaStr)) return fechaStr; // "2023"

  // Verificamos si es una serie del REM para forzar la vista mensual
  const esRem = serie && serie.id && serie.id.startsWith('rem-');

  if (fechaStr.length === 7 || esRem) {
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const [y, m] = fechaStr.split('-');
    return `${meses[parseInt(m, 10) - 1]} ${y}`;
  }
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

function isoHoy()      { return new Date().toISOString().split('T')[0]; }
function isoHace(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().split('T')[0];
}

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
let _alphaVantageCache = {};

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

async function fetchAlphaVantage(symbol, dias, factor = 1) {
  if (ALPHA_VANTAGE_KEY === 'TU_CLAVE_AQUI') {
    throw new Error('Configurá tu clave gratuita de Alpha Vantage en app.js.');
  }
  const LS_KEY = `av_${symbol}`;
  const LS_TTL = 8 * 60 * 60 * 1000; // 8 horas

  // Intentar cargar desde localStorage antes de ir a la API
  if (!_alphaVantageCache[symbol]) {
    try {
      const cached = JSON.parse(localStorage.getItem(LS_KEY));
      if (cached && Date.now() - cached.ts < LS_TTL) {
        _alphaVantageCache[symbol] = cached.data;
      }
    } catch (e) { /* ignora errores de localStorage */ }
  }

  if (!_alphaVantageCache[symbol]) {
    const outputsize = dias > 100 ? 'full' : 'compact';
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${ALPHA_VANTAGE_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Alpha Vantage HTTP ${res.status}`);
    const json = await res.json();
    if (json['Note']) throw new Error('Límite por minuto (5 req/min). Esperá un momento.');
    if (json['Information']) throw new Error('Límite diario alcanzado (25 req/día). Intentá mañana.');
    if (json['Error Message']) throw new Error('Símbolo no encontrado en Alpha Vantage.');
    const timeSeries = json['Time Series (Daily)'];
    if (!timeSeries) throw new Error('Sin datos de Alpha Vantage.');
    _alphaVantageCache[symbol] = timeSeries;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), data: timeSeries }));
    } catch (e) { /* ignora si el storage está lleno */ }
  }

  const desde = isoHace(dias);
  return Object.entries(_alphaVantageCache[symbol])
    .filter(([fecha]) => fecha >= desde)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, v]) => ({ fecha, valor: +(parseFloat(v['4. close']) * factor).toFixed(2) }));
}

async function fetchLocal(serieId) {
  const res = await fetch(`data/${serieId}.json`);
  if (!res.ok) throw new Error(`No se encontró data/${serieId}.json`);
  return res.json();
}




// ─── Hero stats ───────────────────────────────────────────────────────────────

function inicializarHeroStats() {
  const container = document.getElementById('hero-stats');
  container.innerHTML = '';
  SERIES.forEach(serie => {
    const div = document.createElement('div');
    div.className = 'hero-stat';
    div.id = `hstat-${serie.id}`;
    div.innerHTML = `
      <div class="hero-stat-label">${serie.titulo}</div>
      <div class="hero-stat-value placeholder" id="hval-${serie.id}">—</div>
      <div class="hero-stat-unit">${serie.unidad}</div>
    `;
    container.appendChild(div);
  });
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
    div.addEventListener('mouseenter', () => div.style.transform = 'translateY(-4px)');
    div.addEventListener('mouseleave', () => div.style.transform = 'translateY(0)');
    div.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    div.onclick = (e) => {
      if (e.target.tagName.toLowerCase() === 'button' || e.target.tagName.toLowerCase() === 'input') return;
      window.location.href = `detalle.html?id=${serie.id}`;
    };
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
  const btn  = document.getElementById(`btn-reset-zoom-${serieId}`);
  const hint = document.getElementById(`hint-zoom-${serieId}`);
  if (btn)  btn.style.display = 'inline-flex';
  if (hint) hint.style.transition = 'opacity .4s', hint.style.opacity = '0';
}

function resetZoom(serieId) {
  const chart = charts[serieId];
  if (chart) chart.resetZoom();
  const btn  = document.getElementById(`btn-reset-zoom-${serieId}`);
  const hint = document.getElementById(`hint-zoom-${serieId}`);
  if (btn)  btn.style.display = 'none';
  if (hint) hint.style.opacity = '1';
}


// ─── Controles de Gráfico ─────────────────────────────────────────────────────

const rawDataStore = {};

function agregarDatos(datos, periodo) {
  // Si el período es el original (diario o mensual), no hacer nada
  if (periodo === 'diario' || periodo === 'mensual_orig') return datos;

  const groups = {};
  datos.forEach(d => {
    // Usar T00:00:00 para evitar problemas de zona horaria al parsear solo la fecha
    const fecha = new Date(d.fecha.slice(0, 10) + 'T00:00:00');
    let key;

    if (periodo === 'mensual') {
      key = fecha.toISOString().slice(0, 7); // YYYY-MM
    } else if (periodo === 'trimestral') {
      const quarter = Math.floor(fecha.getMonth() / 3) + 1;
      key = `${fecha.getFullYear()}-Q${quarter}`;
    } else if (periodo === 'anual') {
      key = fecha.getFullYear().toString();
    }

    if (!key) return;
    if (!groups[key]) {
      groups[key] = { valores: [], fecha: key };
    }
    groups[key].valores.push(d.valor);
  });

  return Object.values(groups).map(g => {
    // Para series de tipo de cambio o índices, el promedio es una buena aproximación.
    // Para series de variación (inflación), lo ideal sería componer, pero el promedio
    // de las tasas mensuales es una simplificación visualmente aceptable.
    const valorAgregado = g.valores.reduce((a, b) => a + b, 0) / g.valores.length;
    return { fecha: g.fecha, valor: valorAgregado };
  }).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function setupChartControls(serie, datos) {
  if (!isToolsPage && !isDetallePage) return; // Si no es herramientas ni detalle, salimos

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

function actualizarGrafico(serieId) {
  const serie = SERIES.find(s => s.id === serieId);
  const rawData = rawDataStore[serieId];
  if (!serie || !rawData) return;

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
    } else if (serie.fuente === 'alphavantage') {
      datos = await fetchAlphaVantage(serie.serieId, diasReq, serie.factor ?? 1);
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

    // Configurar controles y renderizar el gráfico por primera vez
    if (isToolsPage || isDetallePage) setupChartControls(serie, datos);
    actualizarGrafico(serie.id);

    if (isToolsPage || isDetallePage) {
      // Guardar los datos para usarlos en la calculadora y actualizarla
      if (serie.id === 'tc-oficial') { estadoMercado.oficial = ultimo.valor; actualizarCalculadora(); }
      if (serie.id === 'tc-blue') { estadoMercado.blue = ultimo.valor; actualizarCalculadora(); }

      const btnExport = document.getElementById(`btn-export-${serie.id}`);
      if (btnExport) btnExport.style.display = 'inline-block';
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
  _alphaVantageCache = {};

  const grid = document.getElementById('grid');
  const catContainer = document.getElementById('categories-container');

  if (grid) grid.innerHTML = '';
  if (catContainer) catContainer.innerHTML = '';

  document.getElementById('last-update').textContent = 'Actualizando…';

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
        </h1>
        <p class="detalle-meta">
          Categoría: ${serie.categoria} · Fuente: ${serie.fuente.toUpperCase()} · Unidad: ${serie.unidad}
        </p>
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
        <button id="btn-reset-zoom-${serie.id}" onclick="resetZoom('${serie.id}')" title="Doble clic en el gráfico también resetea el zoom" style="display:none; position:absolute; top:12px; right:12px; z-index:10; align-items:center; gap:5px; padding:5px 14px; border-radius:20px; border:1px solid #e2e8f0; background:#fff; color:#475569; font-size:0.78rem; font-weight:500; cursor:pointer; font-family:inherit; box-shadow:0 2px 8px rgba(0,0,0,.1); transition:all .2s;" onmouseover="this.style.background='#f8fafc';this.style.color='var(--navy)'" onmouseout="this.style.background='#fff';this.style.color='#475569'">↺ Resetear zoom</button>
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

    cargarSerie(serie).then(() => {
      document.getElementById('last-update').textContent =
        `Actualizado: ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`;
    });

    return;
  }

  inicializarHeroStats();

  if (isDatosPage && catContainer) {
    const categorias = [...new Set(SERIES.map(s => s.categoria || 'Otros'))];

    categorias.forEach(cat => {
      const section = document.createElement('div');
      section.className = 'category-section';
      section.innerHTML = `
        <h3 style="margin: 2.5rem 0 1rem; font-family: 'Poppins', sans-serif; font-size: 1.15rem; color: var(--navy); border-bottom: 2px solid var(--border); padding-bottom: 0.5rem;">${cat}</h3>
        <div class="grid" id="grid-${cat.replace(/\s+/g, '-').toLowerCase()}"></div>
      `;
      catContainer.appendChild(section);

      const catGrid = section.querySelector('.grid');
      const seriesCat = SERIES.filter(s => (s.categoria || 'Otros') === cat);

      seriesCat.forEach(serie => catGrid.appendChild(crearCard(serie)));
    });
  } else if (grid) {
    SERIES.forEach(serie => grid.appendChild(crearCard(serie)));

    // Agregar la tarjeta de calculadora al final del grid de métricas
    if (isToolsPage) {
      grid.appendChild(crearCardCalculadora());
    }
  }

  Promise.all(SERIES.map(cargarSerie)).then(() => {
    document.getElementById('last-update').textContent =
      `Actualizado: ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`;
  });
}

loadAll();
