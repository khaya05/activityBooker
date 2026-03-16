// dashboard.js

// ── Greet ─────────────────────────────────────────────────
const nameEl = document.getElementById('dash-name');
if (nameEl && APP.user?.first) nameEl.textContent = APP.user.first;

// ── Balance ───────────────────────────────────────────────
document.getElementById('dash-balance').textContent = APP.lessonBalance;

const child = APP.children[0];
if (child) {
  document.getElementById('dash-balance-child').textContent =
    `lesson${APP.lessonBalance !== 1 ? 's' : ''} remaining`;
}

const list = document.getElementById('bookings-list');

if (!APP.bookings.length) {
  list.innerHTML = `
    <div class="dash-empty" style="display:flex; flex-direction: column">
      <img src="../assets/calendar-days-solid-full.svg" alt="" srcset="" style="height: 2.5rem;">
      No upcoming bookings yet.
      <div style="margin-top:16px">
        <a class="btn btn-primary btn-sm" href="classes.html">Browse classes →</a>
      </div>
    </div>`;
} else {
  list.innerHTML = APP.bookings
    .slice()
    .reverse()
    .map(b => `
      <div class="dash-booking-card">
        <div>
          <div class="dash-booking-name">${b.className}</div>
          <div class="dash-booking-meta">
            ${b.day} · ${b.time} · ${b.instructor} · ${b.childName}
          </div>
        </div>
        <div class="dash-booking-badge">Confirmed</div>
      </div>`)
    .join('');
}

const pendingToast = sessionStorage.getItem('toast');
if (pendingToast) {
  showToast(pendingToast, sessionStorage.getItem('toastType') || '');
  sessionStorage.removeItem('toast');
  sessionStorage.removeItem('toastType');
}