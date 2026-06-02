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

// Doble export: en Node se importan; en el browser quedan como globales.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatFecha, isoHoy, isoHace, agregarDatos, transformarEmae };
}
