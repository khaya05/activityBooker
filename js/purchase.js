// purchase.js

async function initPurchase() {
  showLoader();
  const ok = await APP.requireAuth();
  if (!ok) return;

  APP.updateNav();

  document.getElementById('balance-num').textContent = APP.lessonBalance;

  const childName = APP.children[0]?.name.split(' ')[0] || 'your child';

  document.querySelectorAll('input[name="pack"]').forEach(radio => {
    radio.addEventListener('change', () => updateSummary(radio, childName));
  });

  const defaultPack = document.querySelector('input[name="pack"]:checked');
  if (defaultPack) updateSummary(defaultPack, childName);

  hideLoader();
}

function updateSummary(radio, childName = 'your child') {
  const price = radio.dataset.price;
  const lessons = radio.dataset.lessons;
  const name = radio.closest('.pack-select-card').querySelector('.psc-name').textContent;

  document.getElementById('order-desc').textContent = `${name} · ${childName}`;
  document.getElementById('order-price').textContent = `R${price}`;
  document.getElementById('order-total').textContent = `R${price}`;
  document.getElementById('order-note').textContent =
    `${lessons} lesson${lessons > 1 ? 's' : ''} will be added to your balance`;
  document.getElementById('pay-amount').textContent = `R${price}`;

  document.querySelectorAll('.psc-check').forEach(c => c.classList.remove('checked'));
  radio.closest('.pack-select-card').querySelector('.psc-check').classList.add('checked');
}

function formatCardNumber(input) {
  const digits = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  const digits = input.value.replace(/\D/g, '').substring(0, 4);
  input.value = digits.length > 2 ? digits.slice(0, 2) + ' / ' + digits.slice(2) : digits;
}

async function submitPayment() {
  fClear(['err-card-number', 'err-card-expiry', 'err-card-cvc', 'err-card-name', 'err-payment']);

  const num = document.getElementById('card-number').value.replace(/\s/g, '');
  const expiry = document.getElementById('card-expiry').value;
  const cvc = document.getElementById('card-cvc').value.trim();
  const name = document.getElementById('card-name').value.trim();
  const radio = document.querySelector('input[name="pack"]:checked');

  let ok = true;
  if (num.length < 16) { fErr('err-card-number', 'Enter a valid 16-digit card number'); ok = false; }
  if (expiry.length < 7) { fErr('err-card-expiry', 'Enter a valid expiry date'); ok = false; }
  if (cvc.length < 3) { fErr('err-card-cvc', 'Enter a valid CVC'); ok = false; }
  if (!name) { fErr('err-card-name', 'Enter the name on your card'); ok = false; }
  if (!radio) { notify('Please select a pack.', 'warning'); ok = false; }
  if (!ok) return;

  const btn = document.getElementById('pay-btn');
  btn.textContent = 'Processing…';
  btn.disabled = true;
  showLoader();

  try {
    const data = await Purchases.create({ pack: radio.value });

    APP.lessonBalance = data.newLessonBalance;
    const lessons = radio.dataset.lessons;

    sessionStorage.setItem('toast', `✓ ${lessons} lesson${lessons > 1 ? 's' : ''} added to your balance!`);
    sessionStorage.setItem('toastType', 'success');
    window.location.href = 'dashboard.html';
  } catch (err) {
    notify(err.message, 'error');
    fErr('err-payment', err.message);
    btn.textContent = `Pay R${radio.dataset.price} →`;
    btn.disabled = false;
    hideLoader();
  }
}

initPurchase();