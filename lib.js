/* lib.js — funciones puras de transformación de datos.
 * Sin dependencias del DOM: se cargan como <script> antes de app.js (quedan en
 * el scope global compartido de scripts clásicos) y también se pueden importar
 * en Node para tests (`require('./lib.js')`).
 */

// ─── Fechas ─────────────────────────────────────────────────────────────────

function formatFecha(fechaStr, serie = null) {
  if (!fechaStr) return '—';

  // Limpiamos la hora/zona horaria si viene de la base de datos (ej: 2026-04-30T00:00:00+00)
  fechaStr = fechaStr.split('T')[0];

  // Formatos de agregación
  if (fechaStr.includes('-Q')) return fechaStr.replace('-Q', ' T'); // "2023-Q1" -> "2023 T1"
  if (/^\d{4}$/.test(fechaStr)) return fechaStr; // "2023"

  // Series mensuales (REM y EMAE): mostrar "mes año" en vez de día/mes/año
  const esMensual = serie && ((serie.id && serie.id.startsWith('rem-')) || serie.mensual);

  if (fechaStr.length === 7 || esMensual) {
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const [y, m] = fechaStr.split('-');
    return `${meses[parseInt(m, 10) - 1]} ${y}`;
  }
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

function isoHoy() { return new Date().toISOString().split('T')[0]; }
function isoHace(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().split('T')[0];
}

// ─── Agregación temporal ──────────────────────────────────────────────────────

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
    // Promedio del período: buena aproximación para tipos de cambio e índices.
    const valorAgregado = g.valores.reduce((a, b) => a + b, 0) / g.valores.length;
    return { fecha: g.fecha, valor: valorAgregado };
  }).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ─── EMAE: transformación de lectura ──────────────────────────────────────────
// lectura: 'indice' | 'var-mensual' | 'var-trimestral' | 'var-interanual'

function transformarEmae(data, lectura) {
  if (lectura === 'indice' || !data.length) return data;

  if (lectura === 'var-interanual') {
    return data.slice(12).map((d, i) => ({
      fecha: d.fecha,
      valor: data[i].valor ? +((d.valor / data[i].valor - 1) * 100).toFixed(2) : null,
    })).filter(d => d.valor != null);
  }

  if (lectura === 'var-trimestral') {
    // Promediar a trimestre y luego variación trimestre contra trimestre
    const q = agregarDatos(data, 'trimestral');
    return q.slice(1).map((d, i) => ({
      fecha: d.fecha,
      valor: q[i].valor ? +((d.valor / q[i].valor - 1) * 100).toFixed(2) : null,
    })).filter(d => d.valor != null);
  }

  // var-mensual
  return data.slice(1).map((d, i) => ({
    fecha: d.fecha,
    valor: data[i].valor ? +((d.valor / data[i].valor - 1) * 100).toFixed(2) : null,
  })).filter(d => d.valor != null);
}

// ─── Estadística para el Laboratorio ──────────────────────────────────────────

// Correlación de Pearson entre dos arrays numéricos de igual largo.
// Devuelve null si n < 2 o si alguna serie no tiene varianza (división por cero).
function pearson(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return null;
  let sa = 0, sb = 0;
  for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; }
  const ma = sa / n, mb = sb / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma, xb = b[i] - mb;
    num += xa * xb; da += xa * xa; db += xb * xb;
  }
  if (da === 0 || db === 0) return null; // serie constante: sin varianza
  return num / Math.sqrt(da * db);
}

// Correlación cruzada para detectar lead/lag entre dos series alineadas y de
// igual frecuencia. Prueba desfasar en [-maxLag, maxLag] y devuelve el lag que
// maximiza |r|. Convención: lag > 0 significa que `a` ADELANTA a `b` (a se mueve
// antes). minOverlap evita lags con muy pocos puntos en común.
function crossCorrelation(a, b, maxLag = 12, minOverlap = 6) {
  let best = { lag: 0, r: null, n: 0 };
  const lim = Math.min(maxLag, a.length - 1, b.length - 1);
  for (let lag = -lim; lag <= lim; lag++) {
    const xa = [], xb = [];
    for (let i = 0; i < a.length; i++) {
      const j = i + lag;               // a[i] vs b[i+lag]
      if (j >= 0 && j < b.length) { xa.push(a[i]); xb.push(b[j]); }
    }
    if (xa.length < minOverlap) continue;
    const r = pearson(xa, xb);
    if (r == null) continue;
    const mejora = best.r == null || Math.abs(r) > Math.abs(best.r) + 1e-12;
    const empateMasCerca = best.r != null &&
      Math.abs(Math.abs(r) - Math.abs(best.r)) <= 1e-12 &&
      Math.abs(lag) < Math.abs(best.lag);
    if (mejora || empateMasCerca) best = { lag, r, n: xa.length };
  }
  return best;
}

// Normaliza un array numérico según el modo:
//  'niveles'   -> tal cual
//  'variacion' -> variación % punto a punto (devuelve n-1 elementos)
//  'indice'    -> índice base 100 en el primer punto
function normalizar(arr, modo) {
  if (!arr || !arr.length) return [];
  if (modo === 'variacion') {
    const out = [];
    for (let i = 1; i < arr.length; i++) {
      out.push(arr[i - 1] ? +(((arr[i] / arr[i - 1]) - 1) * 100).toFixed(2) : 0);
    }
    return out;
  }
  if (modo === 'indice') {
    const base = arr[0];
    if (!base) return arr.slice();
    return arr.map(v => +((v / base) * 100).toFixed(2));
  }
  return arr.slice(); // niveles
}

// Alinea dos series [{fecha,valor}] por clave de fecha (intersección). Asume que
// ambas ya están a la misma frecuencia (ej: agregarDatos(., 'mensual')).
// Devuelve { fechas:[], a:[números], b:[números], n } con los períodos en común.
function alinearSeries(serieA, serieB) {
  const mapB = new Map(serieB.map(d => [d.fecha, d.valor]));
  const fechas = [], a = [], b = [];
  for (const d of serieA) {
    if (mapB.has(d.fecha)) {
      fechas.push(d.fecha);
      a.push(d.valor);
      b.push(mapB.get(d.fecha));
    }
  }
  return { fechas, a, b, n: fechas.length };
}

// Doble export: en Node se importan; en el browser quedan como globales.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatFecha, isoHoy, isoHace, agregarDatos, transformarEmae,
                     pearson, crossCorrelation, normalizar, alinearSeries };
}
