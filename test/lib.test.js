// Tests de las funciones puras de transformación (lib.js).
// Correr: node --test
const { test } = require('node:test');
const assert = require('node:assert');
const { formatFecha, isoHace, agregarDatos, transformarEmae } = require('../lib.js');

// ─── formatFecha ──────────────────────────────────────────────────────────────

test('formatFecha: nulo/vacío devuelve guion', () => {
  assert.strictEqual(formatFecha(null), '—');
  assert.strictEqual(formatFecha(''), '—');
});

test('formatFecha: fecha diaria -> dd/mm/aa', () => {
  assert.strictEqual(formatFecha('2026-06-01'), '01/06/26');
});

test('formatFecha: strip de timezone (bug histórico del NaN)', () => {
  // Antes "2026-04-30T00:00:00+00" rompía el parseo
  assert.strictEqual(formatFecha('2026-04-30T00:00:00+00:00'), '30/04/26');
});

test('formatFecha: serie REM se muestra mensual (bug histórico)', () => {
  assert.strictEqual(formatFecha('2026-04-30', { id: 'rem-ipc' }), 'abr 2026');
});

test('formatFecha: serie con mensual:true (EMAE) se muestra mensual', () => {
  assert.strictEqual(formatFecha('2026-03-01', { id: 'emae', mensual: true }), 'mar 2026');
});

test('formatFecha: formato largo de 7 chars -> mes año', () => {
  assert.strictEqual(formatFecha('2025-12'), 'dic 2025');
});

test('formatFecha: trimestre y año se respetan', () => {
  assert.strictEqual(formatFecha('2023-Q1'), '2023 T1');
  assert.strictEqual(formatFecha('2024'), '2024');
});

// ─── agregarDatos ───────────────────────────────────────────────────────────

const serieMensual = [
  { fecha: '2024-01-01', valor: 100 },
  { fecha: '2024-02-01', valor: 110 },
  { fecha: '2024-03-01', valor: 120 },
  { fecha: '2024-04-01', valor: 130 },
];

test('agregarDatos: diario/mensual_orig no transforma', () => {
  assert.deepStrictEqual(agregarDatos(serieMensual, 'diario'), serieMensual);
  assert.deepStrictEqual(agregarDatos(serieMensual, 'mensual_orig'), serieMensual);
});

test('agregarDatos: trimestral promedia y ordena', () => {
  const q = agregarDatos(serieMensual, 'trimestral');
  assert.strictEqual(q.length, 2);
  assert.strictEqual(q[0].fecha, '2024-Q1');
  assert.strictEqual(q[0].valor, 110);  // (100+110+120)/3
  assert.strictEqual(q[1].fecha, '2024-Q2');
  assert.strictEqual(q[1].valor, 130);  // solo abril
});

test('agregarDatos: anual promedia el año', () => {
  const a = agregarDatos(serieMensual, 'anual');
  assert.strictEqual(a.length, 1);
  assert.strictEqual(a[0].fecha, '2024');
  assert.strictEqual(a[0].valor, 115);  // (100+110+120+130)/4
});

// ─── transformarEmae ──────────────────────────────────────────────────────────

const indice = [
  { fecha: '2024-01-01', valor: 100 },
  { fecha: '2024-02-01', valor: 110 },
  { fecha: '2024-03-01', valor: 121 },
];

test('transformarEmae: indice devuelve la serie tal cual', () => {
  assert.deepStrictEqual(transformarEmae(indice, 'indice'), indice);
});

test('transformarEmae: var-mensual calcula el cambio % mes a mes', () => {
  const v = transformarEmae(indice, 'var-mensual');
  assert.strictEqual(v.length, 2);
  assert.strictEqual(v[0].valor, 10);   // 110/100 - 1
  assert.strictEqual(v[1].valor, 10);   // 121/110 - 1
});

test('transformarEmae: var-interanual usa el dato de 12 meses atrás', () => {
  const doceMeses = Array.from({ length: 13 }, (_, i) => ({
    fecha: `2024-${String(i + 1).padStart(2, '0')}-01`,
    valor: 100 + i * 10,
  }));
  const v = transformarEmae(doceMeses, 'var-interanual');
  assert.strictEqual(v.length, 1);
  assert.strictEqual(v[0].valor, 120);  // 220/100 - 1
});

test('transformarEmae: serie vacía no rompe', () => {
  assert.deepStrictEqual(transformarEmae([], 'var-mensual'), []);
});

// ─── isoHace ────────────────────────────────────────────────────────────────

test('isoHace: devuelve formato YYYY-MM-DD', () => {
  assert.match(isoHace(30), /^\d{4}-\d{2}-\d{2}$/);
});
