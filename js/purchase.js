// purchase.js

const PACKS = {
  trial: { name: 'Trial lesson', lessons: 1, price: 95 },
  single: { name: 'Single lesson', lessons: 1, price: 120 },
  '4pack': { name: '4-lesson pack', lessons: 4, price: 440 },
  '8pack': { name: '8-lesson pack', lessons: 8, price: 800 },
};

// ── Init ─────────────────────────────────────────────────
const childName = APP.children[0]?.name.split(' ')[0] || 'your child';

// Set balance display
document.getElementById('balance-num').textContent = APP.lessonBalance;
document.getElementById('balance-child').textContent = APP.children[0]?.name || 'No child added';

// Wire pack selection
document.querySelectorAll('input[name="pack"]').forEach(radio => {
  radio.addEventListener('change', () => updateSummary(radio));
});

// Trigger summary for default checked pack
const defaultPack = document.querySelector('input[name="pack"]:checked');
if (defaultPack) updateSummary(defaultPack);

// ── Update order summary ──────────────────────────────────
function updateSummary(radio) {
  const pack = PACKS[radio.value];
  if (!pack) return;

  document.getElementById('order-desc').textContent = `${pack.name} · ${childName}`;
  document.getElementById('order-price').textContent = `R${pack.price}`;
  document.getElementById('order-total').textContent = `R${pack.price}`;
  document.getElementById('order-note').textContent =
    `${pack.lessons} lesson${pack.lessons > 1 ? 's' : ''} will be added to ${childName}'s balance`;
  document.getElementById('pay-amount').textContent = `R${pack.price}`;

  // Update check marks
  document.querySelectorAll('.psc-check').forEach(c => c.classList.remove('checked'));
  radio.closest('.pack-select-card').querySelector('.psc-check').classList.add('checked');
}

// ── Card formatting ───────────────────────────────────────
function formatCardNumber(input) {
  const digits = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  const digits = input.value.replace(/\D/g, '').substring(0, 4);
  input.value = digits.length > 2 ? digits.slice(0, 2) + ' / ' + digits.slice(2) : digits;
}

// ── Submit payment ────────────────────────────────────────
function submitPayment() {
  // Clear errors
  ['card-number', 'card-expiry', 'card-cvc', 'card-name', 'payment'].forEach(k => fErr('err-' + k, ''));

  const num = document.getElementById('card-number').value.replace(/\s/g, '');
  const expiry = document.getElementById('card-expiry').value;
  const cvc = document.getElementById('card-cvc').value.trim();
  const name = document.getElementById('card-name').value.trim();

  let ok = true;
  if (num.length < 16) { fErr('err-card-number', 'Enter a valid 16-digit card number'); ok = false; }
  if (expiry.length < 7) { fErr('err-card-expiry', 'Enter a valid expiry date'); ok = false; }
  if (cvc.length < 3) { fErr('err-card-cvc', 'Enter a valid CVC'); ok = false; }
  if (!name) { fErr('err-card-name', 'Enter the name on your card'); ok = false; }
  if (!ok) return;

  const btn = document.getElementById('pay-btn');
  btn.textContent = 'Processing…';
  btn.disabled = true;

  setTimeout(() => {
    const radio = document.querySelector('input[name="pack"]:checked');
    const pack = PACKS[radio?.value] || PACKS['4pack'];

    // Credit lessons
    APP.lessonBalance += pack.lessons;

    // Update balance display immediately
    document.getElementById('balance-num').textContent = APP.lessonBalance;
    btn.textContent = `Pay R${pack.price} →`;
    btn.disabled = false;

    // Go to dashboard with success toast
    // Store a pending toast message to show on the next page
    sessionStorage.setItem('toast', `✓ ${pack.lessons} lesson${pack.lessons > 1 ? 's' : ''} added to your balance!`);
    sessionStorage.setItem('toastType', 'success');
    window.location.href = 'dashboard.html';
  }, 1400);
}