// add-child.js

// ─── State ────────────────────────────────────────────────
const intake = {
  step: 1,   // current step
  maxStep: 1,   // furthest step reached — controls sidebar nav clicks
  napCount: 0,
  napIds: [],
};

// ─── Step navigation ──────────────────────────────────────

// Called by sidebar nav dots — only allow steps already visited
function goTo(n) {
  if (n > intake.maxStep) return;
  _switchStep(n);
}

// Called by Continue / Back buttons — always allowed
function advance(n) {
  if (n > intake.maxStep) intake.maxStep = n;
  _switchStep(n);
}

function _switchStep(n) {
  intake.step = n;

  // Panels
  document.querySelectorAll('.intake-step-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + (n === 'done' ? 'done' : n));
  if (panel) panel.classList.add('active');

  // Sidebar nav + mobile dots
  [1, 2, 3, 4].forEach(i => {
    const nav = document.getElementById('snav-' + i);
    const circ = document.getElementById('snavc-' + i);
    const dot = document.getElementById('mstep-' + i);
    if (!nav || !circ) return;

    nav.classList.remove('active', 'done');
    circ.classList.remove('active', 'done');
    if (dot) dot.classList.remove('active', 'done');

    if (i < n) {
      nav.classList.add('done');
      circ.classList.add('done');
      circ.textContent = '✓';
      if (dot) dot.classList.add('done');
    } else if (i === n) {
      nav.classList.add('active');
      circ.classList.add('active');
      circ.textContent = i;
      if (dot) dot.classList.add('active');
    } else {
      circ.textContent = i;
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Step 1: validation ───────────────────────────────────
function step1_next() {
  fClear(['err-first', 'err-last', 'err-dob', 'err-exp']);

  const first = fv('child-first');
  const last = fv('child-last');
  const dob = document.getElementById('child-dob').value;
  const exp = document.querySelector('input[name="child-exp"]:checked');

  let ok = true;
  if (!first) { fErr('err-first', 'First name is required'); ok = false; }
  if (!last) { fErr('err-last', 'Last name is required'); ok = false; }
  if (!dob) { fErr('err-dob', 'Date of birth is required'); ok = false; }
  else {
    const age = _ageFromDob(dob);
    if (age.totalMonths < 0 || age.years > 15) {
      fErr('err-dob', 'Please enter a valid date of birth');
      ok = false;
    }
  }
  if (!exp) { fErr('err-exp', 'Please select a swimming experience level'); ok = false; }
  if (!ok) return;

  advance(2);
}

// ─── Step 3: advance to review ────────────────────────────
function step3_next() {
  _buildReview();
  advance(4);
}

// ─── Age calculation ──────────────────────────────────────
function _ageFromDob(dob) {
  const birth = new Date(dob + 'T00:00:00');
  const now = new Date();
  const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12
    + (now.getMonth() - birth.getMonth());
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return { years, months, totalMonths };
}

function _formatAge(dob) {
  const { years, months, totalMonths } = _ageFromDob(dob);
  if (totalMonths < 1) return 'Less than 1 month old';
  if (totalMonths < 12) return `${totalMonths} month${totalMonths !== 1 ? 's' : ''} old`;
  if (years < 2) return `${totalMonths} months old`;
  return `${years} year${years !== 1 ? 's' : ''} old`;
}

// DOB → live age chip
document.getElementById('child-dob').addEventListener('change', function () {
  const display = document.getElementById('age-display');
  const chip = document.getElementById('age-chip');
  if (!this.value) { display.style.display = 'none'; return; }
  const label = _formatAge(this.value);
  if (label) {
    chip.textContent = '🎂 ' + label;
    display.style.display = 'block';
  }
});

// ─── Nap times ────────────────────────────────────────────
function addNap() {
  if (intake.napIds.length >= 3) return;
  intake.napCount++;
  const id = intake.napCount;
  intake.napIds.push(id);

  const ordinals = ['First', 'Second', 'Third'];
  const label = ordinals[intake.napIds.length - 1] + ' nap';

  const el = document.createElement('div');
  el.className = 'nap-entry';
  el.id = 'nap-' + id;
  el.innerHTML = `
    <div class="nap-entry-header">
      <div class="nap-entry-label">${label}</div>
      <button class="nap-remove-btn" onclick="removeNap(${id})">×</button>
    </div>
    <div class="nap-time-row">
      <div class="nap-time-field">
        <div class="nap-time-label">Start</div>
        <input class="nap-time-input" type="time" id="nap-start-${id}" value="09:00" oninput="updateNapPreview(${id})">
      </div>
      <div class="nap-time-arrow">→</div>
      <div class="nap-time-field">
        <div class="nap-time-label">End</div>
        <input class="nap-time-input" type="time" id="nap-end-${id}" value="10:30" oninput="updateNapPreview(${id})">
      </div>
    </div>
    <div class="nap-preview" id="nap-prev-${id}"></div>`;

  document.getElementById('nap-container').appendChild(el);
  updateNapPreview(id);

  // Disable add button at max
  document.getElementById('nap-add-btn').disabled = intake.napIds.length >= 3;
}

function removeNap(id) {
  intake.napIds = intake.napIds.filter(n => n !== id);
  const el = document.getElementById('nap-' + id);
  if (el) el.remove();
  document.getElementById('nap-add-btn').disabled = false;
  _relabelNaps();
}

function _relabelNaps() {
  const ordinals = ['First', 'Second', 'Third'];
  document.querySelectorAll('.nap-entry').forEach((el, i) => {
    const lbl = el.querySelector('.nap-entry-label');
    if (lbl) lbl.textContent = ordinals[i] + ' nap';
  });
}

function updateNapPreview(id) {
  const s = document.getElementById('nap-start-' + id)?.value;
  const e = document.getElementById('nap-end-' + id)?.value;
  const prev = document.getElementById('nap-prev-' + id);
  if (!s || !e || !prev) return;

  if (s >= e) {
    prev.style.display = 'block';
    prev.textContent = '⚠ End time must be after start time';
  } else {
    prev.style.display = 'block';
    prev.textContent = '🌙 ' + _fmtTime(s) + ' – ' + _fmtTime(e);
  }
}

function _fmtTime(t) {
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

// ─── Health toggles ───────────────────────────────────────
function toggleSection(key) {
  const btn = document.getElementById('tog-' + key);
  const sec = document.getElementById('sec-' + key);
  const on = btn.classList.toggle('on');
  btn.setAttribute('aria-checked', on);
  sec.classList.toggle('open', on);
}

// ─── Review card ──────────────────────────────────────────
function _buildReview() {
  const first = fv('child-first');
  const last = fv('child-last');
  const dob = document.getElementById('child-dob').value;
  const gender = document.querySelector('input[name="child-gender"]:checked')?.value;
  const exp = document.querySelector('input[name="child-exp"]:checked')?.value;

  const genderLabel = { girl: 'Girl 👧', boy: 'Boy 👦', other: 'Other 🧒' };
  const expLabel = { none: 'No experience', some: 'Some experience', intermediate: 'Intermediate' };

  const dobFormatted = dob
    ? new Date(dob + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  // Nap pills
  const napPills = intake.napIds.map(id => {
    const s = document.getElementById('nap-start-' + id)?.value;
    const e = document.getElementById('nap-end-' + id)?.value;
    if (!s || !e || s >= e) return null;
    return `<span class="review-nap-pill">🌙 ${_fmtTime(s)} – ${_fmtTime(e)}</span>`;
  }).filter(Boolean);

  // Health flags
  const hasAllergies = document.getElementById('tog-allergies').classList.contains('on');
  const hasMedical = document.getElementById('tog-medical').classList.contains('on');
  const hasFears = document.getElementById('tog-fears').classList.contains('on');
  const allergiesVal = fv('child-allergies');
  const medicalVal = fv('child-medical');
  const fearsVal = fv('child-fears');
  const notesVal = fv('child-notes');

  const healthRows = [
    hasAllergies ? _rRow('Allergies', allergiesVal || 'Yes (no details added)') : _rRow('Allergies', null),
    hasMedical ? _rRow('Medical', medicalVal || 'Yes (no details added)') : _rRow('Medical', null),
    hasFears ? _rRow('Fears', fearsVal || 'Yes (no details added)') : _rRow('Fears', null),
    notesVal ? _rRow('Notes', notesVal) : null,
  ].filter(Boolean).join('');

  document.getElementById('review-card').innerHTML = `
    <div class="review-section">
      <div class="review-section-title">Child details <button class="review-edit-btn" onclick="goTo(1)">Edit</button></div>
      ${_rRow('Name', first + ' ' + last)}
      ${_rRow('Date of birth', dobFormatted + (dob ? ' · ' + _formatAge(dob) : ''))}
      ${_rRow('Gender', genderLabel[gender] || '—')}
      ${_rRow('Experience', expLabel[exp] || '—')}
    </div>
    <div class="review-section">
      <div class="review-section-title">Nap times <button class="review-edit-btn" onclick="goTo(2)">Edit</button></div>
      ${napPills.length
      ? `<div class="review-row"><span class="review-row-label">Times</span><span class="review-row-value">${napPills.join(' ')}</span></div>`
      : `<div class="review-row"><span class="review-row-label" style="color:var(--ink-4)">None added — no conflicts will be flagged</span></div>`}
    </div>
    <div class="review-section">
      <div class="review-section-title">Health &amp; safety <button class="review-edit-btn" onclick="goTo(3)">Edit</button></div>
      ${healthRows || '<div class="review-row"><span class="review-row-label" style="color:var(--ink-4)">No health notes added</span></div>'}
    </div>
    <div class="review-section" style="background:var(--bg)">
      <div class="review-section-title">Consent status</div>
      <div class="review-row">
        <span class="review-row-label">Status after saving</span>
        <span class="done-status-badge pending">Pending</span>
      </div>
    </div>`;
}

function _rRow(label, value) {
  if (!value) {
    return `<div class="review-row"><span class="review-row-label">${label}</span><span class="review-row-value" style="color:var(--ink-4)">None</span></div>`;
  }
  return `<div class="review-row"><span class="review-row-label">${label}</span><span class="review-row-value" style="max-width:60%">${value}</span></div>`;
}

// ─── Save profile ─────────────────────────────────────────
function saveProfile() {
  const first = fv('child-first');
  const last = fv('child-last');

  // Add to APP.children
  const child = {
    id: Date.now(),
    name: first + ' ' + last,
    age: _formatAge(document.getElementById('child-dob').value),
    initials: (first[0] + last[0]).toUpperCase(),
    consentStatus: 'pending',
  };
  APP.children.push(child);

  document.getElementById('done-msg').textContent =
    `${first}'s profile has been saved. Blue Fin will contact you to arrange the consent form before the first lesson.`;

  advance('done');

  // Mark all sidebar steps as done
  [1, 2, 3, 4].forEach(i => {
    const circ = document.getElementById('snavc-' + i);
    const nav = document.getElementById('snav-' + i);
    const dot = document.getElementById('mstep-' + i);
    if (circ) { circ.classList.remove('active'); circ.classList.add('done'); circ.textContent = '✓'; }
    if (nav) { nav.classList.remove('active'); nav.classList.add('done'); }
    if (dot) { dot.classList.remove('active'); dot.classList.add('done'); }
  });
}

// ─── Reset for adding another child ───────────────────────
function resetForm() {
  // Clear all inputs
  ['child-first', 'child-last', 'child-dob', 'child-allergies', 'child-medical', 'child-fears', 'child-notes']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

  document.querySelectorAll('input[name="child-gender"], input[name="child-exp"]')
    .forEach(r => r.checked = false);

  document.getElementById('age-display').style.display = 'none';
  document.getElementById('nap-container').innerHTML = '';
  intake.napIds = [];
  intake.napCount = 0;
  document.getElementById('nap-add-btn').disabled = false;

  ['allergies', 'medical', 'fears'].forEach(k => {
    document.getElementById('tog-' + k).classList.remove('on');
    document.getElementById('sec-' + k).classList.remove('open');
  });

  intake.step = 1;
  intake.maxStep = 1;
  advance(1);
}