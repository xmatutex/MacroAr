// Envío del formulario de contacto vía Web3Forms (sin backend propio).
// La access key se configura en el <input name="access_key"> de contacto.html.
(function () {
  const form = document.getElementById('contacto-form');
  if (!form) return;

  const statusEl = document.getElementById('form-status');
  const btn = document.getElementById('btn-enviar');

  function setStatus(msg, tipo) {
    statusEl.textContent = msg;
    statusEl.className = 'form-status' + (tipo ? ' ' + tipo : '');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validación mínima del lado del cliente
    if (!form.checkValidity()) {
      setStatus('Completá los campos requeridos.', 'error');
      form.reportValidity();
      return;
    }

    const datos = Object.fromEntries(new FormData(form).entries());

    btn.disabled = true;
    const textoOriginal = btn.textContent;
    btn.textContent = 'Enviando...';
    setStatus('', '');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(datos),
      });
      const json = await res.json();

      if (json.success) {
        form.reset();
        setStatus('¡Gracias! Tu mensaje fue enviado. Te respondemos a la brevedad.', 'success');
      } else {
        setStatus('No se pudo enviar (' + (json.message || 'error') + '). Probá de nuevo o escribinos por mail.', 'error');
      }
    } catch (err) {
      setStatus('Hubo un problema de conexión. Probá de nuevo o escribinos a contacto@macroar.com.ar.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  });
})();
