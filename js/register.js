// register.js
function goToStep(n) {
  [1, 2, 3].forEach(i => {
    document.getElementById(`step-${i}`).style.display = i === n ? 'block' : 'none';
    const circ = document.getElementById(`circ-${i}`);
    circ.classList.remove('active', 'done');
    if (i < n)      circ.classList.add('done');
    else if (i === n) circ.classList.add('active');
  });
}

function reg_step1() {
  const ids = ['err-first','err-last','err-email','err-phone','err-password','err-confirm','err-terms'];
  fClear(ids);

  const first = fv('reg-first'), last    = fv('reg-last'),
        email = fv('reg-email'), phone   = fv('reg-phone'),
        pwd   = fv('reg-password'), conf = fv('reg-confirm'),
        terms = document.getElementById('reg-terms').checked;

  let ok = true;
  if (!first)                           { fErr('err-first',    'First name is required');                 ok = false; }
  if (!last)                            { fErr('err-last',     'Last name is required');                  ok = false; }
  if (!email || !email.includes('@'))   { fErr('err-email',    'Enter a valid email address');            ok = false; }
  if (!phone)                           { fErr('err-phone',    'Phone number is required');               ok = false; }
  if (!pwd || pwd.length < 8)           { fErr('err-password', 'Password must be at least 8 characters'); ok = false; }
  if (pwd !== conf)                     { fErr('err-confirm',  'Passwords do not match');                 ok = false; }
  if (!terms)                           { fErr('err-terms',    'You must agree to continue');             ok = false; }
  if (!ok) return;

  APP.user = { first, last, email };
  document.getElementById('email-display').textContent = email;
  goToStep(2);
  setTimeout(() => document.querySelectorAll('#otp-row .otp-input')[0]?.focus(), 80);
}

function reg_otp() {
  const code = [...document.querySelectorAll('#otp-row .otp-input')].map(i => i.value).join('');
  fErr('err-otp', '');
  if (code.length < 6) { fErr('err-otp', 'Enter the full 6-digit code'); return; }
  APP.isLoggedIn = true;
  goToStep(3);
}

function reg_resend() {
  document.querySelectorAll('#otp-row .otp-input').forEach(i => i.value = '');
  document.querySelectorAll('#otp-row .otp-input')[0]?.focus();
  showToast('Code resent to ' + APP.user?.email, 'info');
}

function reg_back() { goToStep(1); }

document.querySelectorAll('#otp-row .otp-input').forEach((input, i, all) => {
  input.addEventListener('input', () => {
    if (input.value.length === 1 && i < all.length - 1) all[i + 1].focus();
  });
});

document.getElementById('reg-password').addEventListener('input', function() {
  const fill = document.getElementById('pwd-fill');
  const lbl  = document.getElementById('pwd-label');
  const pwd  = this.value;
  let s = 0;
  if (pwd.length >= 8)           s++;
  if (/[A-Z]/.test(pwd))         s++;
  if (/[0-9]/.test(pwd))         s++;
  if (/[^a-zA-Z0-9]/.test(pwd))  s++;
  const cfg = [
    { w: '0%',   c: 'transparent', t: '' },
    { w: '25%',  c: '#DC2626',     t: 'Weak' },
    { w: '50%',  c: '#D97706',     t: 'Fair' },
    { w: '75%',  c: '#2563EB',     t: 'Good' },
    { w: '100%', c: '#16A34A',     t: 'Strong' },
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
