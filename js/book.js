const params = new URLSearchParams(window.location.search);
const classId = parseInt(params.get('id'));
const cls = CLASSES.find(c => c.id === classId);


if (!cls) window.location.href = 'classes.html';

function fmt12(c) {
  const h = c.hour > 12 ? c.hour - 12 : c.hour;
  return `${h}:00 ${c.ampm}`;
}
function capColor(status) {
  return status === 'full' ? '#991B1B' : status === 'nearly' ? '#B45309' : 'var(--ink)';
}

const status = capStatus(cls.taken, cls.total);
const pct = Math.round(cls.taken / cls.total * 100);
const nap = napConflict(cls);
const full = status === 'full';
const clr = capColor(status);

document.getElementById('book-class-card').innerHTML = `
  <div class="bcc-header">
    <div class="bcc-emoji"><img src="${cls.emoji}" style="width:2rem"></div>
    <div>
      <div class="bcc-name">${cls.name}</div>
      <div class="bcc-meta">${cls.day} · ${fmt12(cls)} · 30 min</div>
    </div>
    ${nap ? '<span class="nap-badge">🌙 Nap conflict</span>' : ''}
  </div>
  <div class="bcc-details">
    <div class="bcc-detail-item"><span class="bcc-detail-label">Instructor</span><span class="bcc-detail-val">${cls.instructor}</span></div>
    <div class="bcc-detail-item"><span class="bcc-detail-label">Age group</span><span class="bcc-detail-val">${cls.age}</span></div>
    <div class="bcc-detail-item"><span class="bcc-detail-label">Duration</span><span class="bcc-detail-val">30 minutes</span></div>
    <div class="bcc-detail-item"><span class="bcc-detail-label">Price</span><span class="bcc-detail-val">1 lesson from balance</span></div>
  </div>
  <div class="cap-bar-wrap" style="margin-top:16px">
    <div class="cap-bar"><div class="cap-fill" style="width:${pct}%;background:${clr}"></div></div>
    <div class="cap-label" style="color:${clr}">${full ? 'Class full' : `${cls.taken} of ${cls.total} spots taken`}</div>
  </div>`;

document.getElementById('book-summary-card').innerHTML = `
  <div class="bsc-title">Booking summary</div>
  <div class="bsc-row"><span class="bsc-label">Class</span><span class="bsc-val">${cls.name}</span></div>
  <div class="bsc-row"><span class="bsc-label">Day</span><span class="bsc-val">${cls.day}</span></div>
  <div class="bsc-row"><span class="bsc-label">Time</span><span class="bsc-val">${fmt12(cls)}</span></div>
  <div class="bsc-row"><span class="bsc-label">Duration</span><span class="bsc-val">30 min</span></div>
  <div class="bsc-row"><span class="bsc-label">Instructor</span><span class="bsc-val">${cls.instructor}</span></div>
  <div class="bsc-divider"></div>
  <div class="bsc-row"><span class="bsc-label">Cost</span><span class="bsc-cost">1 lesson</span></div>
  <div class="bsc-note">Deducted from your balance on confirmation.</div>`;

if (nap) {
  document.getElementById('book-nap-warn').style.display = 'flex';
  document.getElementById('book-nap-warn-text').textContent =
    'This class overlaps with your child\'s nap time. You can still book — it\'s just a heads-up.';
}

if (full) {
  const btn = document.getElementById('confirm-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Class is full'; btn.style.opacity = '0.5'; btn.style.cursor = 'not-allowed'; }
}

let selectedChildId = null;

function renderChildren() {
  const list = document.getElementById('child-list');
  if (!APP.children.length) {
    document.getElementById('book-no-children').style.display = 'flex';
    document.getElementById('book-balance-row').style.display = 'none';
    document.getElementById('book-actions').style.display = 'none';
    return;
  }
  list.innerHTML = APP.children.map(child => `
    <div class="book-child ${selectedChildId === child.id ? 'selected' : ''}"
         id="bc-${child.id}" onclick="selectChild('${child.id}')">
      <div class="book-child-left">
        <div class="book-child-avatar">${child.initials}</div>
        <div><div class="book-child-name">${child.name}</div><div class="book-child-age">${child.age}</div></div>
      </div>
      <div class="book-child-right">
        <span class="consent-chip ${child.consentStatus === 'signed' ? 'ok' : 'pending'}">
          ${child.consentStatus === 'signed' ? 'Consent ✓' : 'Consent pending'}
        </span>
      </div>
    </div>`).join('');

  if (!selectedChildId && APP.children.length) selectChild(APP.children[0].id);
}

function selectChild(id) {
  selectedChildId = id;
  document.querySelectorAll('.book-child').forEach(el => el.classList.remove('selected'));
  document.getElementById('bc-' + id)?.classList.add('selected');
  updateBookingState(APP.children.find(c => c.id === id));
}

function updateBookingState(child) {
  const consentBlocked = document.getElementById('book-consent-blocked');
  const noBalance = document.getElementById('book-no-balance');
  const balanceRow = document.getElementById('book-balance-row');
  const balNum = document.getElementById('book-balance-num');
  const actions = document.getElementById('book-actions');
  const confirmBtn = document.getElementById('confirm-btn');

  const n = APP.lessonBalance;
  balNum.textContent = `${n} lesson${n !== 1 ? 's' : ''}`;
  consentBlocked.style.display = 'none';
  noBalance.style.display = 'none';
  balanceRow.style.display = 'flex';
  actions.style.display = 'flex';

  if (full) return;

  if (child.consentStatus !== 'signed') {
    consentBlocked.style.display = 'flex';
    confirmBtn.disabled = true; confirmBtn.textContent = 'Consent required'; confirmBtn.style.opacity = '0.5';
    return;
  }

  if (APP.lessonBalance < 1) {
    balanceRow.style.display = 'none';
    noBalance.style.display = 'flex';
    confirmBtn.disabled = true; confirmBtn.textContent = 'No lessons in balance'; confirmBtn.style.opacity = '0.5';
    return;
  }

  confirmBtn.disabled = false; confirmBtn.textContent = 'Confirm — 1 lesson'; confirmBtn.style.opacity = '1';
}

async function confirmBooking() {
  const child = APP.children.find(c => c.id === selectedChildId);
  if (!child) return;

  const classDate = _nextOccurrence(cls.day);

  const btn = document.getElementById('confirm-btn');
  btn.textContent = 'Confirming…'; btn.disabled = true;
  showLoader();

  try {
    const data = await Bookings.create({
      childId: child.id,
      classId: cls.id.toString(), 
      classDate,
    });

    APP.lessonBalance = data.newLessonBalance;

    document.querySelector('.book-layout').style.display = 'none';
    document.getElementById('book-confirmed').style.display = 'block';

    document.getElementById('confirmed-sub').textContent =
      `${child.name.split(' ')[0]} is booked in for ${cls.name}.`;

    document.getElementById('confirmed-detail').innerHTML =
      `<div class="cd-row"><span>📅</span><span>${cls.day} · ${fmt12(cls)}</span></div>` +
      `<div class="cd-row"><span>👤</span><span>Instructor: ${cls.instructor}</span></div>` +
      `<div class="cd-row"><span>👶</span><span>${child.name}</span></div>` +
      `<div class="cd-row"><span>🎟</span><span>1 lesson deducted · ${APP.lessonBalance} remaining</span></div>`;

    notify('Booking confirmed!', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    notify(err.message, 'error');
    btn.textContent = 'Confirm — 1 lesson'; btn.disabled = false;
  } finally {
    hideLoader();
  }
}

function _nextOccurrence(dayName) {
  const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const target = days[dayName];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = (target - today.getDay() + 7) % 7 || 7;
  const d = new Date(today);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

async function initBook() {
  showLoader();
  try {
    await APP.init();
    if (!APP.isLoggedIn) { window.location.href = 'login.html'; return; }
    renderChildren();
  } catch {
    notify('Failed to load booking page.', 'error');
  } finally {
    hideLoader();
  }
}

initBook();