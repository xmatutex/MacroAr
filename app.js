/* global Chart, supabase */

// ─── Supabase config ───────────────────────────────────────────────────────────
// 1. Entrá a supabase.com → New project
// 2. Settings → API → copiá Project URL y anon key
const SUPABASE_URL = 'https://aopnwktuhczjvquofwdr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sV_d9xpKDcoblxt2NUeFDw_AoZvTOfy';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;


// ─── Configuración de series ──────────────────────────────────────────────────
// premium: true  → requiere cuenta para ver
// diasFree/mesesFree → límite para usuarios sin cuenta

const SERIES = [
  {
    id:       'tc-oficial',
    titulo:   'Tipo de Cambio Oficial',
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
    fuente:   'indec',
    serieId:  '143.3_NO_PR_2004_A_21',
    unidad:   'índice',
    color:    '#7c3aed',
    meses:    36,
    premium:  true,
    variacion: false,
  },
];


// ─── Utilidades ───────────────────────────────────────────────────────────────

function formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  if (fechaStr.length === 7) {
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


// ─── Auth ─────────────────────────────────────────────────────────────────────

async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  currentUser = session?.user ?? null;
  updateAuthUI();

  sb.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    updateAuthUI();
    loadAll();
  });
}

function updateAuthUI() {
  const loggedIn = !!currentUser;
  document.getElementById('btn-login').style.display   = loggedIn ? 'none' : '';
  document.getElementById('btn-signup').style.display  = loggedIn ? 'none' : '';
  document.getElementById('btn-logout').style.display  = loggedIn ? '' : 'none';
  document.getElementById('user-email').style.display  = loggedIn ? '' : 'none';
  if (loggedIn) {
    const email = currentUser.email || '';
    document.getElementById('user-email').textContent =
      email.length > 20 ? email.slice(0, 18) + '…' : email;
  }
}

async function signOut() {
  await sb.auth.signOut();
}


// ─── Modal ────────────────────────────────────────────────────────────────────

let _currentTab = 'login';

function openModal(tab = 'login') {
  switchTab(tab);
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('auth-email').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('auth-error').textContent = '';
  document.getElementById('auth-form').reset();
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function switchTab(tab) {
  _currentTab = tab;
  const isLogin = tab === 'login';

  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-signup').classList.toggle('active', !isLogin);
  document.getElementById('modal-title').textContent    = isLogin ? 'Iniciá sesión' : 'Creá tu cuenta';
  document.getElementById('modal-subtitle').textContent = isLogin
    ? 'Accedé a todos los indicadores macroeconómicos'
    : 'Gratis — acceso completo a todos los datos';
  document.getElementById('auth-submit').textContent    = isLogin ? 'Ingresar' : 'Crear cuenta';
  document.getElementById('modal-switch-text').innerHTML = isLogin
    ? '¿No tenés cuenta? <a href="#" onclick="switchTab(\'signup\'); return false;">Registrate gratis</a>'
    : '¿Ya tenés cuenta? <a href="#" onclick="switchTab(\'login\'); return false;">Iniciá sesión</a>';
  document.getElementById('auth-error').textContent = '';
}

async function handleAuth(e) {
  e.preventDefault();
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errEl    = document.getElementById('auth-error');
  const btn      = document.getElementById('auth-submit');

  btn.disabled = true;
  btn.textContent = 'Cargando…';
  errEl.textContent = '';

  try {
    let error;
    if (_currentTab === 'login') {
      ({ error } = await sb.auth.signInWithPassword({ email, password }));
    } else {
      ({ error } = await sb.auth.signUp({ email, password }));
    }
    if (error) throw error;
    closeModal();
  } catch (err) {
    errEl.textContent = traducirError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = _currentTab === 'login' ? 'Ingresar' : 'Crear cuenta';
  }
}

function traducirError(msg) {
  if (msg.includes('Invalid login'))      return 'Email o contraseña incorrectos.';
  if (msg.includes('already registered')) return 'Este email ya tiene una cuenta.';
  if (msg.includes('Password should'))    return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('Invalid email'))      return 'El email no es válido.';
  return msg;
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
  div.innerHTML = `
    <div class="card-header">
      <h2 class="card-title">${serie.titulo}</h2>
      <span class="badge muted" id="badge-${serie.id}">Cargando…</span>
    </div>
    <div class="card-meta" id="meta-${serie.id}"></div>
    <div class="chart-wrap" id="wrap-${serie.id}">
      <div class="skeleton"></div>
    </div>
  `;
  return div;
}

function crearCardBloqueada(serie) {
  const div = document.createElement('div');
  div.className = 'card card-locked';
  div.style.setProperty('--card-color', serie.color);
  div.innerHTML = `
    <div class="card-header">
      <h2 class="card-title">${serie.titulo}</h2>
      <span class="badge muted">—</span>
    </div>
    <div class="card-meta">Requiere cuenta gratuita</div>
    <div class="chart-wrap locked-wrap">
      <div class="locked-bg"></div>
      <div class="locked-overlay">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p>Contenido exclusivo para usuarios registrados</p>
        <button class="btn-primary btn-sm" onclick="openModal('signup')">Registrarse gratis</button>
      </div>
    </div>
  `;
  return div;
}


// ─── Charts ───────────────────────────────────────────────────────────────────

const charts = {};

function renderChart(serie, datos) {
  const wrap = document.getElementById(`wrap-${serie.id}`);
  wrap.innerHTML = '<canvas></canvas>';
  const canvas = wrap.querySelector('canvas');

  if (charts[serie.id]) charts[serie.id].destroy();

  const tipo   = serie.tipo || 'line';
  const labels = datos.map(d => formatFecha(d.fecha));
  const values = datos.map(d => d.valor);

  charts[serie.id] = new Chart(canvas, {
    type: tipo,
    data: {
      labels,
      datasets: [{
        data:            values,
        borderColor:     serie.color,
        backgroundColor: tipo === 'bar' ? serie.color + 'bb' : serie.color + '18',
        borderWidth:     tipo === 'bar' ? 0 : 2,
        borderRadius:    tipo === 'bar' ? 3 : 0,
        pointRadius:     0,
        tension:         0.3,
        fill:            tipo !== 'bar',
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation:           { duration: 400 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx =>
              `${ctx.parsed.y.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${serie.unidad}`,
          },
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


// ─── Carga de cada serie ──────────────────────────────────────────────────────

async function cargarSerie(serie) {
  const badge = document.getElementById(`badge-${serie.id}`);
  const meta  = document.getElementById(`meta-${serie.id}`);
  const wrap  = document.getElementById(`wrap-${serie.id}`);

  try {
    let datos;
    const esLogueado = !!currentUser;

    if (serie.fuente === 'bluelytics') {
      const dias = esLogueado ? serie.dias : (serie.diasFree ?? serie.dias);
      datos = await fetchBluelytics(serie.tipo_tc, dias);
    } else {
      const meses = esLogueado ? serie.meses : (serie.mesesFree ?? serie.meses);
      const raw   = await fetchIndec(serie.serieId, meses);
      datos = serie.variacion
        ? raw.slice(1).map((d, i) => ({
            fecha: d.fecha,
            valor: raw[i].valor > 0 ? +((d.valor / raw[i].valor - 1) * 100).toFixed(2) : null,
          })).filter(d => d.valor !== null)
        : raw;
    }

    if (!datos.length) throw new Error('Sin datos disponibles');

    const ultimo   = datos[datos.length - 1];
    const valorFmt = ultimo.valor.toLocaleString('es-AR', { maximumFractionDigits: 2 });
    const limitado = !currentUser && (serie.diasFree || serie.mesesFree);

    badge.textContent = `${valorFmt} ${serie.unidad}`;
    badge.classList.remove('muted');
    meta.textContent  = `Último dato: ${formatFecha(ultimo.fecha)}${limitado ? ' · historial limitado' : ''}`;

    actualizarHeroStat(serie, ultimo.valor);
    renderChart(serie, datos);

  } catch (err) {
    badge.textContent = 'Error';
    badge.classList.remove('muted');
    badge.classList.add('error');
    meta.textContent = err.message;
    wrap.innerHTML   = `<div class="chart-error">No se pudo cargar el indicador</div>`;
  }
}


// ─── Inicialización ───────────────────────────────────────────────────────────

function loadAll() {
  _bluelyticsCache = null;
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  document.getElementById('last-update').textContent = 'Actualizando…';

  inicializarHeroStats();

  SERIES.forEach(serie => {
    const bloqueada = serie.premium && !currentUser;
    grid.appendChild(bloqueada ? crearCardBloqueada(serie) : crearCard(serie));
  });

  const seriesACargar = SERIES.filter(s => !(s.premium && !currentUser));
  Promise.all(seriesACargar.map(cargarSerie)).then(() => {
    document.getElementById('last-update').textContent =
      `Actualizado: ${new Date().toLocaleTimeString('es-AR')}`;
  });
}

// Iniciar auth y luego cargar datos
initAuth().then(() => loadAll());
