// Menú mobile
const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('menu');

function setMenu(open, { focusToggle = false } = {}) {
  menu.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  if (focusToggle) toggle.focus();
}

toggle.addEventListener('click', () => {
  setMenu(!menu.classList.contains('is-open'));
});

// Cerrar al elegir una sección
menu.addEventListener('click', (e) => {
  if (e.target.closest('a')) setMenu(false);
});

// Cerrar con Escape y devolver el foco al botón
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false, { focusToggle: true });
});

// Cerrar al tocar afuera del header
document.addEventListener('click', (e) => {
  if (menu.classList.contains('is-open') && !e.target.closest('.nav')) setMenu(false);
});

// Si se agranda la ventana a escritorio, el menú vuelve a su estado normal
matchMedia('(min-width: 761px)').addEventListener('change', (e) => {
  if (e.matches) setMenu(false);
});

// Copiar el número de WhatsApp
const copyBtn = document.getElementById('copy-phone');
const copyStatus = document.getElementById('copy-status');
const phone = document.getElementById('phone');
let copyTimer;

function copyFeedback(label, message) {
  clearTimeout(copyTimer);
  copyBtn.textContent = label;
  copyBtn.classList.add('is-done');
  copyStatus.textContent = message;
  copyTimer = setTimeout(() => {
    copyBtn.textContent = 'Copiar';
    copyBtn.classList.remove('is-done');
    copyStatus.textContent = '';
  }, 2000);
}

function selectPhone() {
  window.getSelection().selectAllChildren(phone);
  copyFeedback('Elegido', 'Número seleccionado, copialo desde el menú del teléfono');
}

copyBtn.addEventListener('click', () => {
  if (!navigator.clipboard) return selectPhone();
  navigator.clipboard.writeText(phone.textContent.trim())
    .then(() => copyFeedback('Copiado', 'Número copiado'))
    .catch(selectPhone);
});

// Horarios: marcar el día de hoy
const today = document.querySelector(`.day[data-day="${new Date().getDay()}"]`);
if (today) {
  today.classList.add('is-today');
  today.setAttribute('aria-current', 'date');
  const tag = document.createElement('span');
  tag.className = 'day__today';
  tag.textContent = 'Hoy';
  today.querySelector('h3').append(tag);
}

// Entradas al hacer scroll: escalonadas dentro de cada sección, una sola vez
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js');
  document.querySelectorAll('.section').forEach((section) => {
    section.querySelectorAll('[data-reveal]').forEach((el, i) => el.style.setProperty('--i', Math.min(i, 6)));
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
}

// Año en el footer
document.getElementById('year').textContent = new Date().getFullYear();
