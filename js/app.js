// ─── Shared state ─────────────────────────────────────────
const APP = {
  isLoggedIn:    false,
  user:          null,
  lessonBalance: 0,
  bookings:      [],
  children: [
    { id: 1, name: 'Amara Mokoena', age: '2 years', initials: 'AM', consentStatus: 'pending' }
  ],
};

// ─── Class data ───────────────────────────────────────────
const CLASSES = [
  { id: 1,  name: 'Beginner Babies',    day: 'Mon', hour: 9,  ampm: 'AM', instructor: 'Sara M.',  age: '0–18 months', taken: 2, total: 4, emoji: '🍼' },
  { id: 2,  name: 'Water Confidence',   day: 'Mon', hour: 10, ampm: 'AM', instructor: 'James K.', age: '18m–3 yr',    taken: 1, total: 4, emoji: '🌊' },
  { id: 3,  name: 'Toddler Splash',     day: 'Tue', hour: 9,  ampm: 'AM', instructor: 'Sara M.',  age: '18m–3 yr',    taken: 3, total: 4, emoji: '🐟' },
  { id: 4,  name: 'Confident Swimmers', day: 'Tue', hour: 14, ampm: 'PM', instructor: 'James K.', age: '3–5 years',   taken: 4, total: 4, emoji: '🏆' },
  { id: 5,  name: 'Beginner Babies',    day: 'Wed', hour: 9,  ampm: 'AM', instructor: 'Sara M.',  age: '0–18 months', taken: 1, total: 4, emoji: '🍼' },
  { id: 6,  name: 'Toddler Splash',     day: 'Wed', hour: 14, ampm: 'PM', instructor: 'Sara M.',  age: '18m–3 yr',    taken: 2, total: 4, emoji: '🐟' },
  { id: 7,  name: 'Water Confidence',   day: 'Thu', hour: 10, ampm: 'AM', instructor: 'James K.', age: '18m–3 yr',    taken: 3, total: 4, emoji: '🌊' },
  { id: 8,  name: 'Confident Swimmers', day: 'Thu', hour: 15, ampm: 'PM', instructor: 'Sara M.',  age: '3–5 years',   taken: 2, total: 4, emoji: '🏆' },
  { id: 9,  name: 'Beginner Babies',    day: 'Sat', hour: 8,  ampm: 'AM', instructor: 'James K.', age: '0–18 months', taken: 0, total: 4, emoji: '🍼' },
  { id: 10, name: 'Toddler Splash',     day: 'Sat', hour: 10, ampm: 'AM', instructor: 'Sara M.',  age: '18m–3 yr',    taken: 1, total: 4, emoji: '🐟' },
];

const NAP_TIMES = [{ start: 9, end: 10.5 }, { start: 13, end: 14.5 }];

// ─── Shared utilities ─────────────────────────────────────
function napConflict(cls) {
  const h = cls.hour + (cls.ampm === 'PM' && cls.hour !== 12 ? 12 : 0);
  return NAP_TIMES.some(n => h < n.end && h + 0.5 > n.start);
}

function capStatus(taken, total) {
  if (taken >= total)        return 'full';
  if (taken / total >= 0.75) return 'nearly';
  return 'available';
}

function navigate(page) {
  window.location.href = `${page}.html`;
}

function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast' + (type ? ' ' + type : '');
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3200);
}

// Form helpers
function fv(id)       { return (document.getElementById(id)?.value || '').trim(); }
function fErr(id, msg){ const el = document.getElementById(id); if (el) el.textContent = msg; }
function fClear(ids)  { ids.forEach(id => fErr(id, '')); }
