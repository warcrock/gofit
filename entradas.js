// Precio de ejemplo y tope por compra
const PRECIO = 8000;
const MAXIMO = 6;
const WHATSAPP = '5492604577926';

const form = document.getElementById('ticket-form');
const radios = [...form.querySelectorAll('input[name="funcion"]')];
const qtyOut = document.getElementById('qty');
const qtyNote = document.getElementById('qty-note');
const menos = form.querySelector('[data-step="-1"]');
const mas = form.querySelector('[data-step="1"]');
const totalOut = document.getElementById('total');
const submitBtn = document.getElementById('submit');
const sent = document.getElementById('sent');
const sentText = document.getElementById('sent-text');
const sentLink = document.getElementById('sent-link');
const dock = document.getElementById('dock');

// "$16.000" sin el espacio que mete Intl con style: currency
const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const pesos = (n) => '$' + numero.format(n);
const entradas = (n) => `${n} ${n === 1 ? 'entrada' : 'entradas'}`;
const NOTA_BASE = qtyNote.textContent;

let cantidad = 1;

const elegida = () => radios.find((r) => r.checked) || null;
const cupos = (r) => Math.max(0, Number(r.dataset.cupos) || 0);

// El tope es el menor entre el máximo por compra y los cupos de la función elegida
function tope() {
  const f = elegida();
  return f ? Math.min(MAXIMO, cupos(f)) : MAXIMO;
}

// Estado de cada función según sus cupos (una sola fuente de verdad: data-cupos)
function marcarFunciones() {
  radios.forEach((r) => {
    const n = cupos(r);
    const card = r.closest('.show-opt');
    r.disabled = n === 0;
    if (n === 0) r.checked = false;
    card.classList.toggle('is-out', n === 0);
    card.classList.toggle('is-low', n > 0 && n <= 10);
    card.querySelector('.show-opt__cupos').textContent =
      n === 0 ? 'Agotada' : n === 1 ? 'Último lugar' : n <= 10 ? `Últimos ${n}` : `Quedan ${n}`;
  });
  const sinLugar = radios.every((r) => r.disabled);
  document.getElementById('shows-empty').hidden = !sinLugar;
  submitBtn.disabled = sinLugar;
  return sinLugar;
}

function setTexto(id, texto, vacio) {
  const el = document.getElementById(id);
  el.textContent = texto;
  el.classList.toggle('is-empty', !!vacio);
}

function actualizar() {
  const sinLugar = marcarFunciones();
  const max = tope();
  const pedida = cantidad;
  cantidad = Math.max(1, Math.min(cantidad, max));
  const total = pesos(cantidad * PRECIO);

  qtyOut.textContent = cantidad;
  totalOut.textContent = total;
  menos.disabled = sinLugar || cantidad <= 1;
  mas.disabled = sinLugar || cantidad >= max;

  // La nota explica por qué no se puede sumar más
  const f = elegida();
  const porCupos = f && cupos(f) < MAXIMO && cantidad >= cupos(f);
  qtyNote.classList.toggle('is-cap', !!porCupos || pedida > max);
  qtyNote.textContent = porCupos
    ? `Para esta función ${cupos(f) === 1 ? 'queda 1 lugar' : `quedan ${cupos(f)} lugares`}.`
    : cantidad >= MAXIMO ? `Llegaste al máximo de ${MAXIMO} por compra. Menores de 3 no pagan.` : NOTA_BASE;

  // Resumen del pedido
  const nombre = form.nombre.value.trim();
  setTexto('sum-funcion', f ? f.value : 'Elegí una función', !f);
  setTexto('sum-cantidad', `${cantidad} × ${pesos(PRECIO)}`);
  setTexto('sum-nombre', nombre || 'Falta tu nombre', !nombre);
  document.getElementById('dock-what').textContent = f ? `${f.value} · ${entradas(cantidad)}` : 'Elegí una función';
  document.getElementById('dock-total').textContent = total;
}

// Errores al lado del campo, no lejos del botón
function error(id, msg, campo) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.hidden = !msg;
  if (campo) campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

form.querySelectorAll('.qty__btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    cantidad += Number(btn.dataset.step);
    actualizar();
  });
});

form.addEventListener('change', (e) => {
  if (e.target.name === 'funcion') error('funcion-error', '');
  actualizar();
});

form.addEventListener('input', (e) => {
  if (e.target === form.nombre && form.nombre.value.trim()) error('nombre-error', '', form.nombre);
  sent.hidden = true; // si cambian algo, el link viejo ya no sirve
  actualizar();
});

// Copiar el alias
const copyBtn = document.getElementById('copy-alias');
const copyStatus = document.getElementById('copy-status');
let copyTimer;
copyBtn.addEventListener('click', async () => {
  const alias = document.getElementById('alias');
  clearTimeout(copyTimer);
  try {
    await navigator.clipboard.writeText(alias.textContent.trim());
    copyBtn.textContent = 'Copiado';
    copyBtn.classList.add('is-done');
    copyStatus.textContent = 'Alias copiado.';
  } catch {
    // Sin permiso de portapapeles: dejamos el alias seleccionado para copiarlo a mano
    window.getSelection().selectAllChildren(alias);
    copyStatus.textContent = 'Dejamos el alias seleccionado: copialo desde el menú.';
  }
  copyTimer = setTimeout(() => {
    copyBtn.textContent = 'Copiar alias';
    copyBtn.classList.remove('is-done');
    copyStatus.textContent = '';
  }, 2500);
});

// Arma el texto del pedido para WhatsApp
function mensaje(funcion, nombre, alumna) {
  const lineas = [
    '¡Hola! Quiero entradas para la muestra de fin de año de GO!FIT.',
    `Función: ${funcion}`,
    `Entradas: ${cantidad} × ${pesos(PRECIO)}`,
    `Total: ${pesos(cantidad * PRECIO)}`,
    `A nombre de: ${nombre}`,
  ];
  if (alumna) lineas.push(`Vengo a ver a: ${alumna}`);
  lineas.push('Te adjunto el comprobante de la transferencia.');
  return lineas.join('\n');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const funcion = elegida();
  const nombre = form.nombre.value.trim().replace(/\s+/g, ' ');

  error('funcion-error', funcion ? '' : 'Elegí una de las funciones con lugar.');
  error('nombre-error', nombre ? '' : 'Poné tu nombre y apellido: la entrada va a ese nombre.', form.nombre);
  if (!funcion || !nombre) {
    (!funcion ? radios.find((r) => !r.disabled) : form.nombre)?.focus();
    return;
  }

  const alumna = form.alumna.value.trim().replace(/\s+/g, ' ');
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje(funcion.value, nombre, alumna))}`;
  sentLink.href = url;

  // Sin 'noopener' en las opciones para poder saber si el navegador bloqueó la ventana
  const win = window.open(url, '_blank');
  if (win) win.opener = null;
  const bloqueado = !win;
  sentText.textContent = bloqueado
    ? 'Tu navegador no dejó abrir WhatsApp. Tocá el botón de abajo para mandar el pedido.'
    : 'Abrimos WhatsApp con tu pedido. Adjuntá la captura de la transferencia y mandalo.';
  sentLink.textContent = bloqueado ? 'Abrir WhatsApp con mi pedido' : '¿No se abrió? Abrir WhatsApp';
  sent.classList.toggle('is-blocked', bloqueado);
  sent.hidden = false;
  if (bloqueado) sentLink.focus();
});

// Resumen pegajoso: visible mientras se ven los pasos y todavía no el pedido
if ('IntersectionObserver' in window) {
  const visto = { pasos: false, pago: false };
  let escribiendo = false;
  const pintar = () => {
    const ver = visto.pasos && !visto.pago && !escribiendo && !submitBtn.disabled;
    dock.classList.toggle('is-visible', ver);
    dock.inert = !ver;
  };
  const io = new IntersectionObserver((items) => {
    items.forEach((it) => { visto[it.target.id] = it.isIntersecting; });
    pintar();
  }, { rootMargin: '0px 0px -15% 0px' });
  io.observe(document.getElementById('pasos'));
  io.observe(document.getElementById('pago'));
  // Con el teclado abierto el resumen estorba
  form.addEventListener('focusin', (e) => { escribiendo = e.target.matches('input[type="text"]'); pintar(); });
  form.addEventListener('focusout', () => { escribiendo = false; pintar(); });
}

dock.addEventListener('click', () => {
  // Después del scroll, el foco queda en el pedido para lectores de pantalla y teclado
  setTimeout(() => document.getElementById('pago').focus({ preventScroll: true }), 0);
});

// Año en el footer
document.getElementById('year').textContent = new Date().getFullYear();

actualizar();
