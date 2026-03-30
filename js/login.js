(async function checkAlreadyLoggedIn() {
  const ok = await APP.init();
  if (ok) window.location.href = 'dashboard.html';
})();

function showPanel(id) {
  ['login-main', 'login-forgot', 'login-reset-sent'].forEach(s => {
    document.getElementById(s).style.display = s === id ? 'block' : 'none';
  });
}
function showForgot() { showPanel('login-forgot'); }
function hideForgot() { showPanel('login-main'); }

async function login_submit() {
  fClear(['err-email', 'err-password']);
  fErr('err-general', '');

  const email = fv('login-email');
  const password = fv('login-password');

  let ok = true;
  if (!email || !email.includes('@')) { fErr('err-email', 'Enter a valid email address'); ok = false; }
  if (!password) { fErr('err-password', 'Password is required'); ok = false; }
  if (!ok) return;

  const btn = document.getElementById('login-btn');
  btn.textContent = 'Logging in…';
  btn.disabled = true;
  showLoader();

  try {
    const data = await Auth.login({ email, password });

    APP.isLoggedIn = true;
    APP.user = { first: data.user.name, email: data.user.email, role: data.user.role, id: data.user.userId };

    const redirect = sessionStorage.getItem('redirectAfterLogin') || 'dashboard.html';
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirect;

  } catch (err) {
    hideLoader();
    btn.textContent = 'Log in →';
    btn.disabled = false;

    if (err.data?.requiresVerification) {
      notify('Please verify your email before logging in.', 'warning');
      return;
    }
    fErr('err-general', err.message);
    notify(err.message, 'error');
  }
}

function login_demo() {
  APP.isLoggedIn = true;
  APP.user = { first: 'Thandi', email: 'thandi@demo.com' };
  window.location.href = 'dashboard.html';
}

function login_forgot() {
  const email = fv('forgot-email');
  fErr('err-forgot', '');
  if (!email || !email.includes('@')) { fErr('err-forgot', 'Enter a valid email address'); return; }
  showPanel('login-reset-sent');
}

function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.style.color = inp.type === 'text' ? 'var(--ink)' : 'var(--ink-4)';
}