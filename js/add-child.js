const intake = { step: 1, maxStep: 1, napCount: 0, napIds: [] };

function goTo(n) { if (n > intake.maxStep) return; _switchStep(n); }
function advance(n) { if (n > intake.maxStep) intake.maxStep = n; _switchStep(n); }

function _switchStep(n) {
  intake.step = n;
  document.querySelectorAll('.intake-step-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + (n === 'done' ? 'done' : n));
  if (panel) panel.classList.add('active');

  [1, 2, 3, 4].forEach(i => {
    const nav = document.getElementById('snav-' + i);
    const circ = document.getElementById('snavc-' + i);
    const dot = document.getElementById('mstep-' + i);
    if (!nav || !circ) return;
    nav.classList.remove('active', 'done');
    circ.classList.remove('active', 'done');
    if (dot) dot.classList.remove('active', 'done');
    if (i < n) { nav.classList.add('done'); circ.classList.add('done'); circ.textContent = '✓'; if (dot) dot.classList.add('done'); }
    else if (i === n) { nav.classList.add('active'); circ.classList.add('active'); circ.textContent = i; if (dot) dot.classList.add('active'); }
    else { circ.textContent = i; }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function step1_next() {
  fClear(['err-first', 'err-last', 'err-dob', 'err-exp']);
  const first = fv('child-first'), last = fv('child-last');
  const dob = document.getElementById('child-dob').value;
  const exp = document.querySelector('input[name="child-exp"]:checked');

  let ok = true;
  if (!first) { fErr('err-first', 'First name is required'); ok = false; }
  if (!last) { fErr('err-last', 'Last name is required'); ok = false; }
  if (!dob) { fErr('err-dob', 'Date of birth is required'); ok = false; }
  else {
    const age = _ageFromDob(dob);
    if (age.totalMonths < 0 || age.years > 15) { fErr('err-dob', 'Please enter a valid date of birth'); ok = false; }
  }
  if (!exp) { fErr('err-exp', 'Please select a swimming experience level'); ok = false; }
  if (!ok) return;
  advance(2);
}

function step3_next() { _buildReview(); advance(4); }

function _ageFromDob(dob) {
  const birth = new Date(dob + 'T00:00:00'), now = new Date();
  const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, totalMonths };
}

function _formatAge(dob) {
  const { years, totalMonths } = _ageFromDob(dob);
  if (totalMonths < 1) return 'Less than 1 month old';
  if (totalMonths < 12) return `${totalMonths} month${totalMonths !== 1 ? 's' : ''} old`;
  if (years < 2) return `${totalMonths} months old`;
  return `${years} year${years !== 1 ? 's' : ''} old`;
}

document.getElementById('child-dob').addEventListener('change', function () {
  const display = document.getElementById('age-display');
  const chip = document.getElementById('age-chip');
  if (!this.value) { display.style.display = 'none'; return; }
  chip.textContent = '🎂 ' + _formatAge(this.value);
  display.style.display = 'block';
});

function addNap() {
  if (intake.napIds.length >= 3) return;
  intake.napCount++;
  const id = intake.napCount;
  intake.napIds.push(id);
  const ordinals = ['First', 'Second', 'Third'];
  const label = ordinals[intake.napIds.length - 1] + ' nap';
  const el = document.createElement('div');
  el.className = 'nap-entry'; el.id = 'nap-' + id;
  el.innerHTML = `
    <div class="nap-entry-header">
      <div class="nap-entry-label">${label}</div>
      <button class="nap-remove-btn" onclick="removeNap(${id})">×</button>
    </div>
    <div class="nap-time-row">
      <div class="nap-time-field"><div class="nap-time-label">Start</div>
        <input class="nap-time-input" type="time" id="nap-start-${id}" value="09:00" oninput="updateNapPreview(${id})"></div>
      <div class="nap-time-arrow">→</div>
      <div class="nap-time-field"><div class="nap-time-label">End</div>
        <input class="nap-time-input" type="time" id="nap-end-${id}" value="10:30" oninput="updateNapPreview(${id})"></div>
    </div>
    <div class="nap-preview" id="nap-prev-${id}"></div>`;
  document.getElementById('nap-container').appendChild(el);
  updateNapPreview(id);
  document.getElementById('nap-add-btn').disabled = intake.napIds.length >= 3;
}

function removeNap(id) {
  intake.napIds = intake.napIds.filter(n => n !== id);
  document.getElementById('nap-' + id)?.remove();
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
  prev.style.display = 'block';
  prev.textContent = s >= e ? '⚠ End time must be after start time' : '🌙 ' + _fmtTime(s) + ' – ' + _fmtTime(e);
}

function _fmtTime(t) {
  const [h, m] = t.split(':'), hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function toggleSection(key) {
  const btn = document.getElementById('tog-' + key);
  const sec = document.getElementById('sec-' + key);
  const on = btn.classList.toggle('on');
  btn.setAttribute('aria-checked', on);
  sec.classList.toggle('open', on);
}

function _buildReview() {
  const first = fv('child-first'), last = fv('child-last');
  const dob = document.getElementById('child-dob').value;
  const gender = document.querySelector('input[name="child-gender"]:checked')?.value;
  const exp = document.querySelector('input[name="child-exp"]:checked')?.value;
  const genderLabel = { girl: 'Girl 👧', boy: 'Boy 👦', other: 'Other 🧒' };
  const expLabel = { none: 'No experience', some: 'Some experience', intermediate: 'Intermediate' };
  const dobFormatted = dob
    ? new Date(dob + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const napPills = intake.napIds.map(id => {
    const s = document.getElementById('nap-start-' + id)?.value;
    const e = document.getElementById('nap-end-' + id)?.value;
    if (!s || !e || s >= e) return null;
    return `<span class="review-nap-pill">🌙 ${_fmtTime(s)} – ${_fmtTime(e)}</span>`;
  }).filter(Boolean);
  const hasAllergies = document.getElementById('tog-allergies').classList.contains('on');
  const hasMedical = document.getElementById('tog-medical').classList.contains('on');
  const hasFears = document.getElementById('tog-fears').classList.contains('on');
  const healthRows = [
    hasAllergies ? _rRow('Allergies', fv('child-allergies') || 'Yes (no details added)') : _rRow('Allergies', null),
    hasMedical ? _rRow('Medical', fv('child-medical') || 'Yes (no details added)') : _rRow('Medical', null),
    hasFears ? _rRow('Fears', fv('child-fears') || 'Yes (no details added)') : _rRow('Fears', null),
    fv('child-notes') ? _rRow('Notes', fv('child-notes')) : null,
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
    : `<div class="review-row"><span class="review-row-label" style="color:var(--ink-4)">None added</span></div>`}
    </div>
    <div class="review-section">
      <div class="review-section-title">Health &amp; safety <button class="review-edit-btn" onclick="goTo(3)">Edit</button></div>
      ${healthRows || '<div class="review-row"><span class="review-row-label" style="color:var(--ink-4)">No health notes added</span></div>'}
    </div>
    <div class="review-section" style="background:var(--bg)">
      <div class="review-section-title">Consent status</div>
      <div class="review-row"><span class="review-row-label">Status after saving</span><span class="done-status-badge pending">Pending</span></div>
    </div>`;
}

function _rRow(label, value) {
  if (!value) return `<div class="review-row"><span class="review-row-label">${label}</span><span class="review-row-value" style="color:var(--ink-4)">None</span></div>`;
  return `<div class="review-row"><span class="review-row-label">${label}</span><span class="review-row-value" style="max-width:60%">${value}</span></div>`;
}

// ─── Save profile → real API ──────────────────────────────
async function saveProfile() {
  const first = fv('child-first'), last = fv('child-last');
  const dob = document.getElementById('child-dob').value;
  const gender = document.querySelector('input[name="child-gender"]:checked')?.value;
  const exp = document.querySelector('input[name="child-exp"]:checked')?.value;

  const napTimes = intake.napIds.map(id => {
    const start = document.getElementById('nap-start-' + id)?.value;
    const end = document.getElementById('nap-end-' + id)?.value;
    return (start && end && start < end) ? { start, end } : null;
  }).filter(Boolean);

  const body = {
    name: first,
    lastName: last,
    dateOfBirth: dob,
    swimmingExperience: exp,
    ...(gender && { gender }),
    ...(napTimes.length && { napTimes }),
    ...(document.getElementById('tog-allergies').classList.contains('on') && { allergies: fv('child-allergies') }),
    ...(document.getElementById('tog-medical').classList.contains('on') && { medicalConditions: fv('child-medical') }),
    ...(document.getElementById('tog-fears').classList.contains('on') && { fears: fv('child-fears') }),
    ...(fv('child-notes') && { additionalInfo: fv('child-notes') }),
  };

  const btn = document.querySelector('#panel-4 .btn-primary');
  btn.textContent = 'Saving…';
  btn.disabled = true;
  showLoader();

  try {
    const data = await Children.create(body);
    const child = data.child;

    APP.children.push({
      id: child._id,
      name: `${child.name} ${child.lastName}`,
      age: _formatAge(dob),
      initials: (child.name[0] + child.lastName[0]).toUpperCase(),
      consentStatus: child.consentStatus,
    });

    document.getElementById('done-msg').textContent =
      `${first}'s profile has been saved. Blue Fin will contact you to arrange the consent form before the first lesson.`;

    advance('done');
    [1, 2, 3, 4].forEach(i => {
      const circ = document.getElementById('snavc-' + i);
      const nav = document.getElementById('snav-' + i);
      const dot = document.getElementById('mstep-' + i);
      if (circ) { circ.classList.remove('active'); circ.classList.add('done'); circ.textContent = '✓'; }
      if (nav) { nav.classList.remove('active'); nav.classList.add('done'); }
      if (dot) { dot.classList.remove('active'); dot.classList.add('done'); }
    });

    notify(`${first}'s profile saved!`, 'success');

  } catch (err) {
    notify(err.message, 'error');
  } finally {
    hideLoader();
    btn.textContent = 'Save profile & continue →';
    btn.disabled = false;
  }
}

function resetForm() {
  ['child-first', 'child-last', 'child-dob', 'child-allergies', 'child-medical', 'child-fears', 'child-notes']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.querySelectorAll('input[name="child-gender"], input[name="child-exp"]').forEach(r => r.checked = false);
  document.getElementById('age-display').style.display = 'none';
  document.getElementById('nap-container').innerHTML = '';
  intake.napIds = []; intake.napCount = 0;
  document.getElementById('nap-add-btn').disabled = false;
  ['allergies', 'medical', 'fears'].forEach(k => {
    document.getElementById('tog-' + k).classList.remove('on');
    document.getElementById('sec-' + k).classList.remove('open');
  });
  intake.step = 1; intake.maxStep = 1;
  advance(1);
}

// Guard: must be logged in
APP.init().then(() => {
  if (!APP.isLoggedIn) window.location.href = 'login.html';
});