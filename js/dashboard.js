// dashboard.js

async function initDashboard() {
  showLoader();
  const ok = await APP.requireAuth();
  if (!ok) return;

  APP.updateNav();

  // Populate name
  const nameEl = document.getElementById('dash-name');
  if (nameEl) nameEl.textContent = APP.user.first;

  // Balance
  document.getElementById('dash-balance').textContent = APP.lessonBalance;
  document.getElementById('dash-balance-child').textContent =
    `lesson${APP.lessonBalance !== 1 ? 's' : ''} remaining`;

  try {
    const { bookings } = await Bookings.getAll({ upcoming: true });
    renderBookings(bookings || []);
  } catch (err) {
    notify('Failed to load bookings.', 'error');
  } finally {
    hideLoader();
  }
}

function renderBookings(bookings) {
  const list = document.getElementById('bookings-list');

  if (!bookings.length) {
    list.innerHTML = `
      <div class="dash-empty" style="display:flex;flex-direction:column;align-items:center">
        <img src="../assets/calendar-days-solid-full.svg" alt="" style="height:2.5rem;margin-bottom:12px">
        <span>No upcoming bookings yet.</span>
        <div style="margin-top:16px">
          <a class="btn btn-primary btn-sm" href="classes.html">Browse classes →</a>
        </div>
      </div>`;
    return;
  }

  list.innerHTML = bookings.map(b => {
    const cls = b.class;
    const child = b.child;
    const dateStr = new Date(b.classDate).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
    const name = cls?.name || '—';
    const time = cls?.startTime || '';
    const instructor = cls?.instructor ? `${cls.instructor.name} ${cls.instructor.lastName}` : '—';
    const childName = child ? `${child.name} ${child.lastName}` : '—';

    return `
      <div class="dash-booking-card">
        <div>
          <div class="dash-booking-name">${name}</div>
          <div class="dash-booking-meta">${dateStr} · ${time} · ${instructor} · ${childName}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="dash-booking-badge">Confirmed</div>
          <button class="btn btn-outline btn-sm" onclick="cancelBooking('${b._id}', this)">Cancel</button>
        </div>
      </div>`;
  }).join('');
}

async function cancelBooking(bookingId, btn) {
  if (!confirm('Cancel this booking? Your lesson will be refunded if it\'s 24+ hours before the class.')) return;
  btn.textContent = 'Cancelling…';
  btn.disabled = true;
  showLoader();

  try {
    const data = await Bookings.cancel(bookingId);
    notify(data.msg, data.refunded ? 'success' : 'info');

    if (data.newLessonBalance !== null) {
      APP.lessonBalance = data.newLessonBalance;
      document.getElementById('dash-balance').textContent = APP.lessonBalance;
    }

    const { bookings } = await Bookings.getAll({ upcoming: true });
    renderBookings(bookings || []);
  } catch (err) {
    notify(err.message, 'error');
    btn.textContent = 'Cancel';
    btn.disabled = false;
  } finally {
    hideLoader();
  }
}

initDashboard();