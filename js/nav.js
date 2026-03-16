// nav.js — shared by every page

function toggleMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

// Scroll-triggered fade-up animations
const _io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('in');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.animate').forEach(el => _io.observe(el));
