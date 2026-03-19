// classes.js

const state = { day: 'all', time: 'all', availOnly: false };

function render() {
  const list = document.getElementById('classes-list');
  const countEl = document.getElementById('classes-count');

  const filtered = CLASSES.filter(c => {
    if (state.day !== 'all' && c.day !== state.day) return false;
    if (state.time === 'morning' && c.hour >= 12) return false;
    if (state.time === 'afternoon' && c.hour < 12) return false;
    if (state.availOnly && c.taken >= c.total) return false;
    return true;
  });

  countEl.textContent = `${filtered.length} class${filtered.length !== 1 ? 'es' : ''} available`;

  if (!filtered.length) {
    list.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--ink-4)">
      <div style="font-size:36px;margin-bottom:10px">
        <img src="../assets/magnifying-glass-solid-full.svg" alt="" srcset="" style="height: 2.5rem;">
      </div>
      <div style="font-family:var(--font-mono);font-size:13px">No classes match your filters.</div>
      <button class="btn btn-outline btn-sm" style="margin-top:14px" onclick="resetFilters()">Clear filters</button>
    </div>`;
    return;
  }

  list.innerHTML = filtered.map(c => {
    const status = capStatus(c.taken, c.total);
    const nap = napConflict(c);
    const full = status === 'full';
    const pct = Math.round(c.taken / c.total * 100);
    const clr = full ? '#991B1B' : status === 'nearly' ? '#B45309' : 'var(--ink)';
    const h12 = c.hour > 12 ? c.hour - 12 : c.hour;

    return `<div class="class-row${nap ? ' nap-conflict' : ''}${full ? ' class-full' : ''}">
      <div class="class-row-time">
        <div class="class-row-hour">${h12}:00</div>
        <div class="class-row-ampm">${c.ampm}</div>
        <div class="class-row-day">${c.day}</div>
      </div>
      <div class="class-row-sep"></div>
      <div class="class-row-body">
        <div class="class-row-name">
          <img src= ${c.emoji} style="width: 1.3rem" > ${c.name}
          ${nap ? '<span class="nap-badge">🌙 Nap conflict</span>' : ''}
        </div>
        <div class="class-row-meta">${c.age} · 30 min · ${c.instructor}</div>
        <div class="cap-bar-wrap" style="margin-bottom:0">
          <div class="cap-bar"><div class="cap-fill" style="width:${pct}%;background:${clr}"></div></div>
          <div class="cap-label" style="color:${clr}">${full ? 'Class full' : `${c.taken} of ${c.total} spots taken`}</div>
        </div>
      </div>
      <div class="class-row-action">
        <div style="font-family:var(--font-mono);font-size:13px;font-weight:600">R120</div>
        ${full
        ? `<button class="btn btn-outline btn-sm" onclick="joinWaitlist(${c.id})">Join waitlist</button>`
        : `<button class="btn btn-primary btn-sm" onclick="bookClass(${c.id})">${nap ? 'Book anyway' : 'Book class'}</button>`}
      </div>
    </div>`;
  }).join('');
}

function wireFilters() {
  document.querySelectorAll('#day-filters .filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#day-filters .filter-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      state.day = btn.dataset.day;
      render();
    });
  });

  document.querySelectorAll('#time-filters .filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#time-filters .filter-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      state.time = btn.dataset.time;
      render();
    });
  });

  document.getElementById('avail-toggle').addEventListener('click', function () {
    state.availOnly = !state.availOnly;
    this.textContent = state.availOnly ? 'Available only' : 'All classes';
    this.classList.toggle('active', state.availOnly);
    render();
  });

  document.getElementById('nap-dismiss').addEventListener('click', () => {
    document.getElementById('nap-notice').style.display = 'none';
  });
}

function resetFilters() {
  state.day = 'all'; state.time = 'all'; state.availOnly = false;
  document.querySelectorAll('#day-filters  .filter-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  document.querySelectorAll('#time-filters .filter-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  const t = document.getElementById('avail-toggle');
  t.textContent = 'All classes';
  t.classList.add('active');
  render();
}

function bookClass(id) {
  window.location.href = `book.html?id=${id}`;
}

function joinWaitlist(id) {
  showToast("Added to waitlist — we'll notify you when a spot opens.", 'info');
}

wireFilters();
render();