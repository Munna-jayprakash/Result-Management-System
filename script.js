(() => {
'use strict';

/* ---------- Configuration ---------- */
const SUBJECTS = [
  { key: 'math',      label: 'Math',        sample: 92 },
  { key: 'dsa',       label: 'DSA',         sample: 74 },
  { key: 'fullStack', label: 'Full Stack',  sample: 81 },
  { key: 'agenticAI', label: 'Agentic AI',  sample: 95 },
  { key: 'dbms',      label: 'DBMS / SQL',  sample: 78 }
];
const MAX_MARKS = 100;
const SUBJECT_PASS = 35;       // minimum marks needed in every subject
const STORE_KEY = 'srms.students';
const THEME_KEY = 'srms.theme';

/* ---------- Safe storage (falls back to memory if Local Storage is blocked) ---------- */
const storage = (() => {
  const mem = {};
  let persistent = false;
  try {
    localStorage.setItem('__srms_test', '1');
    localStorage.removeItem('__srms_test');
    persistent = true;
  } catch (e) { persistent = false; }
  return {
    get persistent() { return persistent; },
    getItem(k) {
      try { if (persistent) return localStorage.getItem(k); } catch (e) {}
      return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
    },
    setItem(k, v) {
      if (persistent) {
        try { localStorage.setItem(k, v); return; } catch (e) { persistent = false; }
      }
      mem[k] = v;
    }
  };
})();

/* ---------- Helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const form = $('#studentForm');
const marksGrid = $('#marksGrid');
const resultArea = $('#resultArea');
const recList = $('#recList');

/* ---------- Build marks inputs ---------- */
SUBJECTS.forEach(s => {
  const wrap = document.createElement('div');
  wrap.className = 'field marks-field';
  wrap.dataset.field = s.key;
  wrap.innerHTML = `
    <label for="${s.key}"><span class="dot"></span>${esc(s.label)}<small>out of ${MAX_MARKS}</small></label>
    <input id="${s.key}" name="${s.key}" type="number" inputmode="numeric" min="0" max="${MAX_MARKS}" step="1" value="${s.sample}" placeholder="0 – ${MAX_MARKS}">
    <p class="err" aria-live="polite"></p>`;
  marksGrid.appendChild(wrap);
});

/* ---------- Theme ---------- */
const themeBtn = $('#themeBtn');
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}
const savedTheme = storage.getItem(THEME_KEY);
applyTheme(savedTheme || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeBtn.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  storage.setItem(THEME_KEY, next);
});

/* ---------- Storage status chip ---------- */
function updateChip() {
  const chip = $('#storageChip');
  if (storage.persistent) {
    chip.classList.remove('warn');
    $('#storageText').textContent = 'Saving to Local Storage';
  } else {
    chip.classList.add('warn');
    $('#storageText').textContent = 'Preview mode: saving in memory only';
  }
}

/* ---------- Validation ---------- */
function setError(field, msg) {
  const box = $(`[data-field="${field}"]`);
  if (!box) return;
  box.classList.toggle('invalid', !!msg);
  $('.err', box).textContent = msg || '';
  const input = $('input, select', box);
  if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

function validate(data) {
  const errors = {};
  if (!/^[A-Za-z][A-Za-z .'-]{2,39}$/.test(data.name)) errors.name = 'Enter a name of 3 to 40 letters.';
  if (!/^[A-Za-z0-9-]{3,15}$/.test(data.roll)) errors.roll = 'Use 3 to 15 letters, numbers or hyphens.';
  if (!data.semester) errors.semester = 'Choose a semester.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.email = 'Enter a valid email, like name@example.com.';
  SUBJECTS.forEach(s => {
    const raw = data.marksRaw[s.key];
    const n = Number(raw);
    if (raw === '' || !Number.isFinite(n)) errors[s.key] = 'Enter the marks.';
    else if (!Number.isInteger(n)) errors[s.key] = 'Use a whole number.';
    else if (n < 0 || n > MAX_MARKS) errors[s.key] = `Marks must be between 0 and ${MAX_MARKS}.`;
  });
  return errors;
}

/* ---------- Calculation ---------- */
function gradeFor(pct, passed) {
  if (!passed) return 'F';
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'E';
}

function buildStudent(data) {
  const marks = {};
  SUBJECTS.forEach(s => { marks[s.key] = Number(data.marksRaw[s.key]); });
  const total = Object.values(marks).reduce((a, b) => a + b, 0);
  const outOf = SUBJECTS.length * MAX_MARKS;
  const percentage = Math.round((total / outOf) * 10000) / 100;
  const failedSubjects = SUBJECTS.filter(s => marks[s.key] < SUBJECT_PASS).map(s => s.label);
  const passed = failedSubjects.length === 0;
  return {
    id: Date.now(),
    name: data.name.trim().replace(/\s+/g, ' '),
    roll: data.roll.toUpperCase(),
    semester: data.semester,
    email: data.email.trim().toLowerCase(),
    marks,
    total,
    outOf,
    percentage,
    grade: gradeFor(percentage, passed),
    result: passed ? 'Pass' : 'Fail',
    failedSubjects,
    savedAt: new Date().toISOString()
  };
}

/* ---------- Rendering ---------- */
function renderEmpty() {
  resultArea.innerHTML = `
    <div class="result-empty">
      <svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="18" y="10" width="60" height="76" rx="9"/><path d="M32 30h32M32 44h32M32 58h18"/><circle cx="64" cy="64" r="11" fill="var(--surface)"/><path d="m59 64 4 4 7-8"/>
      </svg>
      <h3>No result yet</h3>
      <p>Review the details on the left, then choose Calculate result to see the marksheet.</p>
    </div>`;
}

function renderResult(st) {
  const passed = st.result === 'Pass';
  const ringColor = passed ? 'url(#ringGrad)' : 'var(--fail)';
  const bars = SUBJECTS.map(s => {
    const v = st.marks[s.key];
    const cls = v < SUBJECT_PASS ? 'low' : (v >= 90 ? 'top' : '');
    return `<div class="bar-row">
      <span class="name">${esc(s.label)}</span>
      <div class="meter" role="img" aria-label="${esc(s.label)}: ${v} out of ${MAX_MARKS}"><i class="${cls}" data-w="${v}"></i></div>
      <span class="num">${v}</span>
    </div>`;
  }).join('');

  const remark = passed
    ? `Passed every subject with grade ${esc(st.grade)}. Strongest results: ${esc(strongest(st))}.`
    : `Needs ${SUBJECT_PASS} marks in every subject. Below the pass mark in: ${esc(st.failedSubjects.join(', '))}.`;

  resultArea.innerHTML = `
    <div class="res-head">
      <div>
        <h3 class="res-name">${esc(st.name)}</h3>
        <p class="res-meta"><span>Roll ${esc(st.roll)}</span><span>${esc(st.semester)}</span><span>${esc(st.email)}</span></p>
      </div>
      <span class="pill ${passed ? 'pass' : 'fail'}">
        ${passed
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'}
        ${st.result}
      </span>
    </div>

    <div class="score-row">
      <div class="gauge">
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="var(--accent-2)"/>
            </linearGradient>
          </defs>
          <circle class="track" cx="70" cy="70" r="60"/>
          <circle class="bar" id="ringBar" cx="70" cy="70" r="60" stroke="${ringColor}"/>
        </svg>
        <div class="centre"><div class="pct">${st.percentage}%</div><div class="lbl">overall</div></div>
      </div>
      <div class="stats">
        <div class="stat"><b>${st.total}</b><span>of ${st.outOf} marks</span></div>
        <div class="stat"><b>${st.grade}</b><span>grade</span></div>
        <div class="stat"><b>${SUBJECTS.length}</b><span>subjects</span></div>
      </div>
    </div>

    <p class="remark ${passed ? 'pass' : 'fail'}">${remark}</p>
    <div class="bars">${bars}</div>

    <div class="json-box">
      <div class="json-bar"><span>Student JSON</span><button class="icon-btn" id="copyJson" type="button">Copy</button></div>
      <pre id="jsonOut" tabindex="0">${esc(JSON.stringify(st, null, 2))}</pre>
    </div>`;

  // Animate ring and bars after paint
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const circ = 2 * Math.PI * 60;
    const ring = $('#ringBar');
    ring.style.strokeDasharray = circ;
    ring.style.strokeDashoffset = circ * (1 - st.percentage / 100);
    resultArea.querySelectorAll('.meter i').forEach(i => { i.style.width = i.dataset.w + '%'; });
  }));

  $('#copyJson').addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText(JSON.stringify(st, null, 2)); e.target.textContent = 'Copied'; }
    catch (err) { e.target.textContent = 'Copy failed'; }
    setTimeout(() => { e.target.textContent = 'Copy'; }, 1600);
  });
}

function strongest(st) {
  return SUBJECTS.slice().sort((a, b) => st.marks[b.key] - st.marks[a.key]).slice(0, 2).map(s => s.label).join(' and ');
}

/* ---------- Persistence ---------- */
function loadRecords() {
  try {
    const raw = storage.getItem(STORE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

function saveRecord(st) {
  const list = loadRecords().filter(r => r.roll !== st.roll);   // same roll number replaces the old entry
  list.unshift(st);
  storage.setItem(STORE_KEY, JSON.stringify(list));             // object -> JSON string -> Local Storage
  updateChip();
}

function renderRecords() {
  const list = loadRecords();
  if (!list.length) {
    recList.innerHTML = '<p class="empty-line">No saved results yet. Calculate a result to save it here.</p>';
    return;
  }
  recList.innerHTML = list.map(r => `
    <div class="rec" data-id="${r.id}">
      <div><b>${esc(r.name)}</b><small>Roll ${esc(r.roll)}, ${esc(r.semester)}</small></div>
      <div><b>${r.total}/${r.outOf}</b><small>${r.percentage}%</small></div>
      <div><span class="pill ${r.result === 'Pass' ? 'pass' : 'fail'}" style="padding:4px 12px;font-size:.85rem">${r.result} · ${esc(r.grade)}</span></div>
      <button class="view" type="button" data-act="view" aria-label="View result for ${esc(r.name)}">View</button>
      <button class="del" type="button" data-act="del" aria-label="Delete result for ${esc(r.name)}">Delete</button>
    </div>`).join('');
}

/* ---------- Events ---------- */
function readForm() {
  const marksRaw = {};
  SUBJECTS.forEach(s => { marksRaw[s.key] = form.elements[s.key].value.trim(); });
  return {
    name: form.elements.name.value.trim(),
    roll: form.elements.roll.value.trim(),
    semester: form.elements.semester.value,
    email: form.elements.email.value.trim(),
    marksRaw
  };
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = readForm();
  const errors = validate(data);
  ['name', 'roll', 'semester', 'email', ...SUBJECTS.map(s => s.key)].forEach(f => setError(f, errors[f]));

  const firstBad = Object.keys(errors)[0];
  if (firstBad) {
    const el = $(`[data-field="${firstBad}"] input, [data-field="${firstBad}"] select`);
    if (el) el.focus();
    toast('Fix the highlighted fields and try again.');
    return;
  }
  const student = buildStudent(data);
  renderResult(student);
  saveRecord(student);
  renderRecords();
  toast(storage.persistent ? 'Result calculated and saved to Local Storage.' : 'Result calculated and saved in memory.');
  if (window.innerWidth < 920) resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Clear a field's error as soon as the person edits it
form.addEventListener('input', (e) => {
  const box = e.target.closest('[data-field]');
  if (box) setError(box.dataset.field, '');
});

$('#resetBtn').addEventListener('click', () => {
  form.reset();
  ['name', 'roll', 'semester', 'email', ...SUBJECTS.map(s => s.key)].forEach(f => setError(f, ''));
  // reset() restores the pre-filled sample values; blank them for a fresh entry
  form.querySelectorAll('input').forEach(i => { i.value = ''; });
  form.elements.semester.value = '';
  renderEmpty();
  form.elements.name.focus();
});

recList.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = Number(btn.closest('.rec').dataset.id);
  const list = loadRecords();
  if (btn.dataset.act === 'del') {
    storage.setItem(STORE_KEY, JSON.stringify(list.filter(r => r.id !== id)));
    renderRecords();
    toast('Result deleted.');
  } else {
    const r = list.find(x => x.id === id);
    if (!r) return;
    form.elements.name.value = r.name;
    form.elements.roll.value = r.roll;
    form.elements.semester.value = r.semester;
    form.elements.email.value = r.email;
    SUBJECTS.forEach(s => { form.elements[s.key].value = r.marks[s.key]; });
    renderResult(r);
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

$('#clearBtn').addEventListener('click', () => {
  if (!loadRecords().length) return;
  if (confirm('Delete all saved results?')) {
    storage.setItem(STORE_KEY, '[]');
    renderRecords();
    toast('All saved results cleared.');
  }
});

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- Init ---------- */
updateChip();
renderEmpty();
renderRecords();
})();