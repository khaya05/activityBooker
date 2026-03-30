// register.js

function goToStep(n) {
  [1, 2, 3].forEach(i => {
    document.getElementById(`step-${i}`).style.display = i === n ? 'block' : 'none';
    const circ = document.getElementById(`circ-${i}`);
    circ.classList.remove('active', 'done');
    if (i < n) circ.classList.add('done');
    else if (i === n) circ.classList.add('active');
  });
}

async function reg_step1() {
  const ids = ['err-first', 'err-last', 'err-email', 'err-phone', 'err-password', 'err-confirm', 'err-terms'];
  fClear(ids);

  const name = fv('reg-first');
  const lastName = fv('reg-last');
  const email = fv('reg-email');
  const phone = fv('reg-phone');
  const password = fv('reg-password');
  const confirm = fv('reg-confirm');
  const terms = document.getElementById('reg-terms').checked;

  let ok = true;
  if (!name) { fErr('err-first', 'First name is required'); ok = false; }
  if (!lastName) { fErr('err-last', 'Last name is required'); ok = false; }
  if (!email || !email.includes('@')) { fErr('err-email', 'Enter a valid email address'); ok = false; }
  if (!phone) { fErr('err-phone', 'Phone number is required'); ok = false; }
  if (!password || password.length < 8) { fErr('err-password', 'Password must be at least 8 characters'); ok = false; }
  if (password !== confirm) { fErr('err-confirm', 'Passwords do not match'); ok = false; }
  if (!terms) { fErr('err-terms', 'You must agree to continue'); ok = false; }
  if (!ok) return;

  const btn = document.querySelector('#step-1 .btn-primary');
  btn.textContent = 'Creating account…';
  btn.disabled = true;
  showLoader();

  try {
    await Auth.register({ name, lastName, email, password, phoneNumber: phone });

    APP.user = { first: name, lastName, email };
    document.getElementById('email-display').textContent = email;

    notify('Account created! Check your email for a verification code.', 'success');
    goToStep(2);
    setTimeout(() => document.querySelectorAll('#otp-row .otp-input')[0]?.focus(), 80);

  } catch (err) {
    notify(err.message, 'error');
    if (err.message.toLowerCase().includes('email')) fErr('err-email', err.message);
  } finally {
    hideLoader();
    btn.textContent = 'Create account →';
    btn.disabled = false;
  }
}

async function reg_otp() {
  const code = [...document.querySelectorAll('#otp-row .otp-input')].map(i => i.value).join('');
  fErr('err-otp', '');

  if (code.length < 6) { fErr('err-otp', 'Enter the full 6-digit code'); return; }

  const btn = document.querySelector('#step-2 .btn-primary');
  btn.textContent = 'Verifying…';
  btn.disabled = true;
  showLoader();

  try {
    await Auth.verifyEmail({ email: APP.user.email, code });

    APP.isLoggedIn = true;
    notify('Email verified! Welcome to Blue Fin Swim School.', 'success');
    goToStep(3);

  } catch (err) {
    fErr('err-otp', err.message);
    notify(err.message, 'error');
  } finally {
    hideLoader();
    btn.textContent = 'Verify email →';
    btn.disabled = false;
  }
}

async function reg_resend() {
  document.querySelectorAll('#otp-row .otp-input').forEach(i => i.value = '');
  document.querySelectorAll('#otp-row .otp-input')[0]?.focus();

  try {
    await Auth.resendVerification({ email: APP.user.email });
    notify('New code sent to ' + APP.user.email, 'success');
  } catch (err) {
    notify(err.message, 'error');
  }
}

function reg_back() { goToStep(1); }

// OTP input: auto-advance and backspace support
document.querySelectorAll('#otp-row .otp-input').forEach((input, i, all) => {
  input.addEventListener('input', () => {
    if (input.value.length === 1 && i < all.length - 1) all[i + 1].focus();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && i > 0) all[i - 1].focus();
  });
});

// Password strength meter
document.getElementById('reg-password').addEventListener('input', function () {
  const fill = document.getElementById('pwd-fill');
  const lbl = document.getElementById('pwd-label');
  const pwd = this.value;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^a-zA-Z0-9]/.test(pwd)) s++;
  const cfg = [
    { w: '0%', c: 'transparent', t: '' },
    { w: '25%', c: '#DC2626', t: 'Weak' },
    { w: '50%', c: '#D97706', t: 'Fair' },
    { w: '75%', c: '#2563EB', t: 'Good' },
    { w: '100%', c: '#16A34A', t: 'Strong' },
  ][s];
  fill.style.width = cfg.w;
  fill.style.background = cfg.c;
  lbl.textContent = cfg.t;
  lbl.style.color = cfg.c;
});

function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.style.color = inp.type === 'text' ? 'var(--ink)' : 'var(--ink-4)';
}