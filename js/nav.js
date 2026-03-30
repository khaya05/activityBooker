// nav.js — runs on every page

function toggleMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

const _io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.1 });
document.querySelectorAll('.animate').forEach(el => _io.observe(el));
window.addEventListener('load', () => {
  if (APP._initDone) {
    APP.updateNav();
  } else {
    APP.init().then(() => APP.updateNav());
  }
});