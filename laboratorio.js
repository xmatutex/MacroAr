// Laboratorio de correlaciones (MacroAr).
// Reusa de app.js: SERIES, obtenerDatosSerie. De lib.js: agregarDatos, pearson,
// crossCorrelation, normalizar, alinearSeries, formatFecha.
// Todo client-side: elige 2 series, las lleva a una frecuencia común, alinea por
// fecha, normaliza, y calcula correlación + lead/lag.
(function () {
  if (typeof SERIES === 'undefined') return;

  // Universo del lab: datos realizados. Excluimos REM (proyecciones) y mocks.
  const UNIVERSO = SERIES.filter(s => !s.id.startsWith('rem-') && !String(s.fuente).startsWith('mock'));

  const selA = document.getElementById('serie-a');
  const selB = document.getElementById('serie-b');
  const selFreq = document.getElementById('lab-freq');
  const grupoModo = document.getElementById('lab-modo');
  const elInsight = document.getElementById('lab-insight');
  const elFresh = document.getElementById('lab-freshness');
  const btnShare = document.getElementById('lab-share');
  const canvas = document.getElementById('lab-chart');
  if (!selA || !selB) return;

  let modo = 'indice';
  let chart = null;
  const cache = {}; // datos crudos por serie.id (evita re-fetch)

  const PERIODO_LABEL = { mensual: 'meses', trimestral: 'trimestres', anual: 'años' };
  const MIN_N = { mensual: 12, trimestral: 6, anual: 4 };

  // ── Poblar selects ───────────────────────────────────────────────────────────
  function opciones(selected) {
    return UNIVERSO.map(s =>
      `<option value="${s.id}"${s.id === selected ? ' selected' : ''}>${s.titulo}</option>`
    ).join('');
  }
  selA.innerHTML = opciones('tc-blue');
  selB.innerHTML = opciones('inflacion');

  // ── Estado <-> URL hash ──────────────────────────────────────────────────────
  function leerHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.get('a') && UNIVERSO.some(s => s.id === p.get('a'))) selA.value = p.get('a');
    if (p.get('b') && UNIVERSO.some(s => s.id === p.get('b'))) selB.value = p.get('b');
    if (['mensual', 'trimestral', 'anual'].includes(p.get('f'))) selFreq.value = p.get('f');
    if (['indice', 'niveles', 'variacion'].includes(p.get('m'))) modo = p.get('m');
    aplicarModoUI();
  }
  function escribirHash() {
    const p = new URLSearchParams({ a: selA.value, b: selB.value, f: selFreq.value, m: modo });
    history.replaceState(null, '', '#' + p.toString());
  }
  function aplicarModoUI() {
    grupoModo.querySelectorAll('button').forEach(b =>
      b.classList.toggle('active', b.dataset.modo === modo));
  }

  // ── Fetch (cacheado) ─────────────────────────────────────────────────────────
  async function datosDe(id) {
    if (cache[id]) return cache[id];
    const serie = SERIES.find(s => s.id === id);
    const datos = await obtenerDatosSerie(serie, 3650, 120, true);
    cache[id] = datos;
    return datos;
  }

  // ── Frescura ─────────────────────────────────────────────────────────────────
  function diasDesde(fechaStr) {
    const f = new Date(fechaStr.slice(0, 10) + 'T00:00:00');
    return Math.floor((Date.now() - f.getTime()) / 86400000);
  }
  function frescuraTexto(serie, datos) {
    if (!datos.length) return '';
    const ultima = datos[datos.length - 1].fecha;
    const dias = diasDesde(ultima);
    const viejo = dias > 75;
    return `${serie.titulo}: ${formatFecha(ultima, serie)}${viejo ? ' ⚠️' : ''}`;
  }

  // ── Insight en castellano ────────────────────────────────────────────────────
  function fuerza(r) {
    const a = Math.abs(r);
    if (a >= 0.7) return 'fuerte';
    if (a >= 0.4) return 'moderada';
    return 'débil';
  }
  function generarInsight(sA, sB, r, lag, n, freq, maxLag) {
    const per = PERIODO_LABEL[freq];
    if (n < MIN_N[freq]) {
      return `Pocos ${per} en común (n=${n}). El resultado es apenas orientativo: hace falta más historia compartida para una conclusión confiable.`;
    }
    const signo = r >= 0 ? 'positiva' : 'negativa';
    let txt = `En los ${n} ${per} en común, <strong>${sA.titulo}</strong> y <strong>${sB.titulo}</strong> muestran una correlación ${fuerza(r)} ${signo} (r = ${r.toFixed(2)}).`;
    // Solo afirmamos lead/lag si ESE desfasaje tiene al menos correlación moderada
    // y NO cae en el borde del rango (un pico en el extremo suele ser artefacto).
    if (lag.lag !== 0 && lag.r != null && Math.abs(lag.r) >= 0.4 && Math.abs(lag.lag) < maxLag) {
      const lider = lag.lag > 0 ? sA : sB;
      txt += ` Además, <strong>${lider.titulo}</strong> tendió a moverse ~${Math.abs(lag.lag)} ${per} antes (correlación ${fuerza(lag.r)} con ese desfasaje).`;
    } else if (Math.abs(r) >= 0.4) {
      txt += ' Se movieron de forma sincronizada.';
    }
    return txt;
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  function dibujar(fechas, sA, datosA, sB, datosB) {
    if (chart) chart.destroy();
    chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: fechas,
        datasets: [
          { label: sA.titulo, data: datosA, borderColor: sA.color, backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.15 },
          { label: sB.titulo, data: datosB, borderColor: sB.color, backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.15 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top' } },
        scales: { x: { ticks: { maxTicksLimit: 12 } } },
      },
    });
  }

  // ── Pipeline principal ───────────────────────────────────────────────────────
  let pidiendo = 0;
  async function actualizar() {
    escribirHash();
    const idA = selA.value, idB = selB.value, freq = selFreq.value;
    const sA = SERIES.find(s => s.id === idA), sB = SERIES.find(s => s.id === idB);

    if (idA === idB) {
      elInsight.textContent = 'Elegí dos series distintas para comparar.';
      elFresh.textContent = '';
      if (chart) { chart.destroy(); chart = null; }
      return;
    }

    const ticket = ++pidiendo;
    elInsight.textContent = 'Cargando datos…';
    try {
      const [rawA, rawB] = await Promise.all([datosDe(idA), datosDe(idB)]);
      if (ticket !== pidiendo) return; // llegó una petición más nueva

      const mA = agregarDatos(rawA.map(d => ({ fecha: d.fecha, valor: d.valor })), freq);
      const mB = agregarDatos(rawB.map(d => ({ fecha: d.fecha, valor: d.valor })), freq);
      const al = alinearSeries(mA, mB);

      elFresh.textContent = 'Última actualización — ' + [frescuraTexto(sA, rawA), frescuraTexto(sB, rawB)].join(' · ');

      if (al.n === 0) {
        elInsight.textContent = 'No hay períodos en común entre estas dos series.';
        if (chart) { chart.destroy(); chart = null; }
        return;
      }

      let normA = normalizar(al.a, modo);
      let normB = normalizar(al.b, modo);
      let fechas = al.fechas;
      if (modo === 'variacion') fechas = al.fechas.slice(1); // variación pierde el primer punto

      const maxLag = freq === 'mensual' ? 12 : 6;
      const r = pearson(normA, normB);
      const lag = crossCorrelation(normA, normB, maxLag, Math.max(4, Math.floor(MIN_N[freq] / 2)));

      dibujar(fechas, sA, normA, sB, normB);

      if (r == null) {
        elInsight.textContent = 'Alguna de las series no tiene variación en el período: no se puede calcular la correlación.';
      } else {
        elInsight.innerHTML = generarInsight(sA, sB, r, lag, normA.length, freq, maxLag);
      }
    } catch (err) {
      if (ticket !== pidiendo) return;
      elInsight.textContent = 'No se pudieron cargar los datos. Probá de nuevo en un momento.';
    }
  }

  // ── Eventos ──────────────────────────────────────────────────────────────────
  [selA, selB, selFreq].forEach(el => el.addEventListener('change', actualizar));
  grupoModo.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-modo]');
    if (!b) return;
    modo = b.dataset.modo;
    aplicarModoUI();
    actualizar();
  });
  btnShare.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      const txt = btnShare.textContent;
      btnShare.textContent = '✓ Enlace copiado';
      setTimeout(() => { btnShare.textContent = txt; }, 1800);
    } catch { /* sin clipboard: el usuario puede copiar la URL a mano */ }
  });

  // Link compartido abierto estando ya en la página (back/forward o pegar URL).
  // escribirHash() usa replaceState, que NO dispara hashchange → sin loop.
  window.addEventListener('hashchange', () => { leerHash(); actualizar(); });

  leerHash();
  actualizar();
})();
