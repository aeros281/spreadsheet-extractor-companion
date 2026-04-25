// popup.js — Spreadsheet Extractor popup logic

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  spreadsheetId: '',
  gid: '',
  range: '',
  columns: []   // { letter, name, repeat, include }
};

// ── DOM refs ───────────────────────────────────────────────────────────────
const elId       = document.getElementById('meta-id');
const elGid      = document.getElementById('meta-gid');
const elRange    = document.getElementById('meta-range');
const elColRows  = document.getElementById('col-rows');
const elColCount = document.getElementById('col-count');
const elColsWrap = document.getElementById('cols-wrap');
const elNoRange  = document.getElementById('no-range-msg');
const elCmdSec   = document.getElementById('cmd-section');
const elCmdOut   = document.getElementById('cmd-output');
const elActions  = document.getElementById('actions');
const elMain     = document.getElementById('main-content');
const elNotSheet = document.getElementById('not-sheets');
const btnCopy    = document.getElementById('btn-copy');
const btnReload  = document.getElementById('btn-reload');

// ── Utilities ──────────────────────────────────────────────────────────────

/**
 * Parse a range like "B2:F50" and return the column letters.
 * Handles single columns (e.g. "B5") and multi-col ranges.
 */
function parseColumns(range) {
  if (!range) return [];

  // Strip sheet name prefix if present (e.g. "Sheet1!B2:F50")
  const clean = range.includes('!') ? range.split('!')[1] : range;

  const parts = clean.toUpperCase().split(':');
  const startCol = parts[0].match(/([A-Z]+)/)?.[1];
  const endCol   = parts[1] ? parts[1].match(/([A-Z]+)/)?.[1] : startCol;

  if (!startCol) return [];

  const colToNum = (col) => {
    let n = 0;
    for (const c of col) n = n * 26 + (c.charCodeAt(0) - 64);
    return n;
  };

  const numToCol = (n) => {
    let col = '';
    while (n > 0) {
      const rem = (n - 1) % 26;
      col = String.fromCharCode(65 + rem) + col;
      n = Math.floor((n - 1) / 26);
    }
    return col;
  };

  const start = colToNum(startCol);
  const end   = colToNum(endCol);

  const cols = [];
  for (let i = start; i <= end; i++) {
    cols.push(numToCol(i));
  }
  return cols;
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

// ── Render column rows ─────────────────────────────────────────────────────
function renderColumns() {
  elColRows.innerHTML = '';

  if (state.columns.length === 0) return;

  state.columns.forEach((col, idx) => {
    const row = document.createElement('div');
    row.className = 'col-row' + (col.include ? '' : ' excluded');
    row.dataset.idx = idx;

    // Col letter
    const letter = document.createElement('div');
    letter.className = 'col-letter';
    letter.textContent = col.letter;

    // Header name input
    const nameInput = document.createElement('input');
    nameInput.className = 'col-name-input';
    nameInput.type = 'text';
    nameInput.placeholder = `Column ${col.letter}`;
    nameInput.value = col.name;
    nameInput.addEventListener('input', (e) => {
      state.columns[idx].name = e.target.value;
      updateCommand();
    });

    // Repeat checkbox
    const repeatWrap = document.createElement('div');
    repeatWrap.className = 'check-wrap';
    const repeatCheck = createCheckbox(col.repeat, 'repeat-check', (checked) => {
      state.columns[idx].repeat = checked;
      updateCommand();
    });
    repeatWrap.appendChild(repeatCheck);

    // Include checkbox
    const includeWrap = document.createElement('div');
    includeWrap.className = 'check-wrap';
    const includeCheck = createCheckbox(col.include, 'include-check', (checked) => {
      state.columns[idx].include = checked;
      row.classList.toggle('excluded', !checked);
      updateCommand();
    });
    includeWrap.appendChild(includeCheck);

    row.appendChild(letter);
    row.appendChild(nameInput);
    row.appendChild(repeatWrap);
    row.appendChild(includeWrap);
    elColRows.appendChild(row);
  });

  elColCount.textContent = `${state.columns.length} col${state.columns.length !== 1 ? 's' : ''}`;
  elColsWrap.style.display = '';
  elNoRange.style.display = 'none';
}

function createCheckbox(initialChecked, extraClass, onChange) {
  const box = document.createElement('div');
  box.className = `custom-check ${extraClass}${initialChecked ? ' checked' : ''}`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 10 10');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M1.5 5l2.5 2.5 4.5-4.5');
  svg.appendChild(path);
  box.appendChild(svg);

  let checked = initialChecked;
  box.addEventListener('click', () => {
    checked = !checked;
    box.classList.toggle('checked', checked);
    onChange(checked);
  });

  return box;
}

// ── Build CLI command ─────────────────────────────────────────────────────
function buildCommand() {
  const id    = state.spreadsheetId || '<spreadsheet-id>';
  const gid   = state.gid           || '<gid>';
  const range = state.range         || '<range>';

  const headers = state.columns
    .filter(c => c.include && c.name.trim())
    .map(c => `${c.letter}:${c.name.trim()}`);

  const repeatCols = state.columns
    .filter(c => c.repeat)
    .map(c => c.letter);

  let cmd = `spreadsheet-extractor fetch-sheet \\\n  ${id} \\\n  ${gid} \\\n  ${range}`;

  if (headers.length > 0) {
    cmd += ` \\\n  --headers "${headers.join(',')}"`;
  }

  if (repeatCols.length > 0) {
    cmd += ` \\\n  --repeat-columns ${repeatCols.join(',')}`;
  }

  return cmd;
}

function syntaxHighlight(cmd) {
  return cmd
    .replace(/^(spreadsheet-extractor)/m, '<span class="keyword">$1</span>')
    .replace(/(fetch-sheet)/g, '<span class="keyword">$1</span>')
    .replace(/(--headers|--repeat-columns)/g, '<span class="flag">$1</span>')
    .replace(/"([^"]+)"/g, '"<span class="value">$1</span>"')
    .replace(/\\\n/g, ' \\\n')
    .replace(/\n/g, '<br>');
}

function updateCommand() {
  const cmd = buildCommand();
  elCmdOut.innerHTML = syntaxHighlight(cmd);
  elCmdSec.style.display = '';
  elActions.style.display = '';
}

// ── Range input handling ───────────────────────────────────────────────────
function applyRange(rangeStr) {
  state.range = rangeStr.trim();

  if (!state.range) {
    elColsWrap.style.display = 'none';
    elNoRange.style.display = '';
    elCmdSec.style.display = 'none';
    elActions.style.display = 'none';
    return;
  }

  const letters = parseColumns(state.range);

  if (letters.length === 0) {
    elColsWrap.style.display = 'none';
    elNoRange.style.display = '';
    return;
  }

  // Preserve existing column config if letters match
  const existing = {};
  state.columns.forEach(c => { existing[c.letter] = c; });

  state.columns = letters.map(letter => existing[letter] || {
    letter,
    name: '',
    repeat: false,
    include: true
  });

  renderColumns();
  updateCommand();
}

elRange.addEventListener('input', (e) => applyRange(e.target.value));
elRange.addEventListener('change', (e) => applyRange(e.target.value));

// ── Copy command ───────────────────────────────────────────────────────────
btnCopy.addEventListener('click', () => {
  const cmd = buildCommand();
  navigator.clipboard.writeText(cmd).then(() => {
    btnCopy.classList.add('copied');
    btnCopy.innerHTML = `
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Copied!
    `;
    setTimeout(() => {
      btnCopy.classList.remove('copied');
      btnCopy.innerHTML = `
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy Command
      `;
    }, 2000);
  });
});

// ── Load from tab ──────────────────────────────────────────────────────────
function loadFromTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;

    const url = tab.url || '';

    // Check if this is a Google Sheets URL
    if (!url.includes('docs.google.com/spreadsheets')) {
      elNotSheet.style.display = '';
      elMain.style.display = 'none';
      return;
    }

    elMain.classList.add('visible');

    // Extract spreadsheet ID and gid from URL
    const idMatch  = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = url.match(/[?&#]gid=(\d+)/);

    state.spreadsheetId = idMatch  ? idMatch[1]  : '';
    state.gid           = gidMatch ? gidMatch[1] : '0';

    elId.textContent  = truncate(state.spreadsheetId || '—', 22);
    elId.title        = state.spreadsheetId;
    elGid.textContent = state.gid || '—';

    // Try to get range from content script
    chrome.tabs.sendMessage(tab.id, { action: 'getSheetInfo' }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not ready or not injected — that's fine
        showNoRange();
        return;
      }

      if (response && response.selectedRange) {
        elRange.value = response.selectedRange;
        applyRange(response.selectedRange);
      } else {
        showNoRange();
      }
    });
  });
}

function showNoRange() {
  elColsWrap.style.display = 'none';
  elNoRange.style.display = '';
  elCmdSec.style.display = 'none';
  elActions.style.display = 'none';
}

btnReload.addEventListener('click', loadFromTab);

// ── Init ───────────────────────────────────────────────────────────────────
loadFromTab();
