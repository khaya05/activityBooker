const APP = {
  isLoggedIn: false,
  user: null,
  lessonBalance: 0,
  children: [],
};

APP.init = async function () {
  if (!TokenStore.get()) {
    APP._initDone = true;
    return false;
  }

  try {
    const data = await Users.getCurrentUser();
    const u = data.user;
    APP.isLoggedIn = true;
    APP.user = { first: u.name, lastName: u.lastName, email: u.email, role: u.role, id: u._id };
    APP.lessonBalance = u.lessonBalance || 0;

    const childData = await Children.getAll();
    APP.children = (childData.children || []).map(c => ({
      id: c._id,
      name: `${c.name} ${c.lastName}`,
      age: _ageLabel(c.dateOfBirth),
      initials: (c.name[0] + c.lastName[0]).toUpperCase(),
      consentStatus: c.consentStatus,
    }));

    APP._initDone = true;
    return true;
  } catch {
    APP.isLoggedIn = false;
    APP._initDone = true;
    return false;
  }
};

APP.requireAuth = async function (redirectTo = 'login.html') {
  const ok = await APP.init();
  if (!ok) {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = redirectTo;
    return false;
  }
  return true;
};

function _ageLabel(dob) {
  if (!dob) return '';
  const totalMonths = Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 30.44));
  if (totalMonths < 1) return 'Under 1 month';
  if (totalMonths < 24) return `${totalMonths} month${totalMonths !== 1 ? 's' : ''} old`;
  const years = Math.floor(totalMonths / 12);
  return `${years} year${years !== 1 ? 's' : ''} old`;
}

APP.updateNav = function () {
  document.querySelectorAll('[data-auth="guest"]').forEach(el => {
    el.style.display = APP.isLoggedIn ? 'none' : '';
  });
  document.querySelectorAll('[data-auth="user"]').forEach(el => {
    el.style.display = APP.isLoggedIn ? '' : 'none';
  });
  const nameSlot = document.querySelector('[data-nav-name]');
  if (nameSlot && APP.user) nameSlot.textContent = APP.user.first;
};

APP.logout = async function () {
  try {
    await Auth.logout();   // also calls TokenStore.clear() inside api.js
  } catch {
    TokenStore.clear();    // clear even if request fails
  }
  APP.isLoggedIn = false;
  APP.user = null;
  APP.lessonBalance = 0;
  APP.children = [];
  window.location.href = '../pages/login.html';
};

const NAP_TIMES = [];

function napConflict(cls) {
  if (!NAP_TIMES.length) return false;
  const h = cls.hour + (cls.ampm === 'PM' && cls.hour !== 12 ? 12 : 0);
  return NAP_TIMES.some(n => h < n.end && h + 0.5 > n.start);
}

function capStatus(taken, total) {
  if (taken >= total) return 'full';
  if (taken / total >= 0.75) return 'nearly';
  return 'available';
}

function navigate(page) { window.location.href = `${page}.html`; }

// ─── Form helpers ─────────────────────────────────────────
function fv(id) { return (document.getElementById(id)?.value || '').trim(); }
function fErr(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }
function fClear(ids) { ids.forEach(id => fErr(id, '')); }

// ─── Loader ───────────────────────────────────────────────
let _loaderEl = null;

function showLoader() {
  if (!_loaderEl) {
    const style = document.createElement('style');
    style.textContent = `
      #global-loader {
        position:fixed;inset:0;z-index:9999;
        background:rgba(245,243,238,.78);
        backdrop-filter:blur(3px);
        display:flex;align-items:center;justify-content:center;
        opacity:0;transition:opacity .18s;pointer-events:none;
      }
      #global-loader.visible{opacity:1;pointer-events:all;}
      .gl-spinner{
        width:36px;height:36px;
        border:3px solid #E2DDD5;border-top-color:#1B6B8A;
        border-radius:50%;animation:gl-spin .7s linear infinite;
      }
      @keyframes gl-spin{to{transform:rotate(360deg);}}
    `;
    document.head.appendChild(style);
    _loaderEl = document.createElement('div');
    _loaderEl.id = 'global-loader';
    _loaderEl.innerHTML = '<div class="gl-spinner"></div>';
    document.body.appendChild(_loaderEl);
  }
  requestAnimationFrame(() => _loaderEl.classList.add('visible'));
}

function hideLoader() {
  if (_loaderEl) _loaderEl.classList.remove('visible');
}

// ─── Notifications ────────────────────────────────────────
let _notifEl = null;
let _notifTimer = null;
const _NOTIF_ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

function notify(message, type = 'info', duration = 4000) {
  if (!_notifEl) {
    const style = document.createElement('style');
    style.textContent = `
      #global-notif{
        position:fixed;bottom:28px;left:50%;
        transform:translateX(-50%) translateY(16px);
        min-width:240px;max-width:min(480px,calc(100vw - 40px));
        padding:13px 18px 13px 16px;border-radius:10px;
        display:flex;align-items:flex-start;gap:10px;
        font-family:'IBM Plex Sans',sans-serif;
        font-size:14px;font-weight:500;line-height:1.45;
        box-shadow:0 4px 24px rgba(0,0,0,.14);
        opacity:0;transition:opacity .22s,transform .22s;
        pointer-events:none;z-index:10000;
      }
      #global-notif.visible{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto;}
      #global-notif.success{background:#1D7A4C;color:#fff;}
      #global-notif.error  {background:#B91C1C;color:#fff;}
      #global-notif.info   {background:#1A1714;color:#fff;}
      #global-notif.warning{background:#B45309;color:#fff;}
      .gn-icon{font-size:16px;flex-shrink:0;margin-top:1px;}
      .gn-body{flex:1;}
      .gn-close{background:none;border:none;color:inherit;opacity:.65;cursor:pointer;font-size:18px;padding:0;line-height:1;flex-shrink:0;margin-top:1px;}
      .gn-close:hover{opacity:1;}
    `;
    document.head.appendChild(style);
    _notifEl = document.createElement('div');
    _notifEl.id = 'global-notif';
    document.body.appendChild(_notifEl);
  }

  clearTimeout(_notifTimer);
  _notifEl.className = type;
  _notifEl.innerHTML = `
    <span class="gn-icon">${_NOTIF_ICONS[type] || 'ℹ'}</span>
    <span class="gn-body">${message}</span>
    <button class="gn-close" onclick="dismissNotif()">×</button>
  `;
  requestAnimationFrame(() => requestAnimationFrame(() => _notifEl.classList.add('visible')));
  if (duration > 0) _notifTimer = setTimeout(dismissNotif, duration);
}

function dismissNotif() {
  if (_notifEl) _notifEl.classList.remove('visible');
  clearTimeout(_notifTimer);
}

// Legacy alias
function showToast(msg, type = '') {
  const map = { success: 'success', error: 'error', info: 'info', '': 'info' };
  notify(msg, map[type] ?? 'info');
}

// Consume any toast queued before a redirect
(function consumeSessionToast() {
  const msg = sessionStorage.getItem('toast');
  const type = sessionStorage.getItem('toastType') || 'success';
  if (!msg) return;
  sessionStorage.removeItem('toast');
  sessionStorage.removeItem('toastType');
  window.addEventListener('DOMContentLoaded', () => notify(msg, type));
})();