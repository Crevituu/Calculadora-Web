'use strict';

// ─── State ───────────────────────────────────────────────
const state = {
  current:    '0',   // number being typed
  previous:   null,  // previous operand
  operator:   null,  // pending operator
  justEvaled: false, // flag after pressing =
};

// ─── DOM refs ────────────────────────────────────────────
const displayResult     = document.getElementById('result');
const displayExpression = document.getElementById('expression');
const buttons           = document.querySelectorAll('.btn');

// ─── Helpers ─────────────────────────────────────────────
function formatNumber(num) {
  const n = parseFloat(num);
  if (isNaN(n)) return num;
  // Limit decimals to avoid float artifacts
  const str = parseFloat(n.toPrecision(12)).toString();
  return str;
}

function updateDisplay() {
  displayResult.textContent = state.current;

  if (state.operator && state.previous !== null) {
    displayExpression.textContent = `${state.previous} ${state.operator}`;
  } else {
    displayExpression.innerHTML = '&nbsp;';
  }
}

function clearActiveOp() {
  document.querySelectorAll('.btn--op').forEach(b => b.classList.remove('--active'));
}

function highlightOp(op) {
  clearActiveOp();
  buttons.forEach(b => {
    if (b.dataset.action === 'operator' && b.dataset.value === op) {
      b.classList.add('--active');
    }
  });
}

function flashResult() {
  displayResult.classList.add('--accent');
  setTimeout(() => displayResult.classList.remove('--accent'), 300);
}

// ─── Core logic ──────────────────────────────────────────
function calculate(a, b, op) {
  a = parseFloat(a);
  b = parseFloat(b);
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? 'Erro' : a / b;
    default:  return b;
  }
}

// ─── Actions ─────────────────────────────────────────────
function handleNumber(value) {
  if (state.justEvaled) {
    // Start fresh after =
    state.current    = value;
    state.previous   = null;
    state.operator   = null;
    state.justEvaled = false;
    clearActiveOp();
    return;
  }

  if (state.current === '0' && value !== '.') {
    state.current = value;
  } else if (state.current.length >= 12) {
    return; // max digits
  } else {
    state.current += value;
  }
}

function handleOperator(op) {
  clearActiveOp();
  state.justEvaled = false;

  if (state.operator && state.previous !== null) {
    // Chain operations
    const result = calculate(state.previous, state.current, state.operator);
    state.current  = formatNumber(result);
    state.previous = formatNumber(result);
  } else {
    state.previous = state.current;
  }

  state.operator = op;
  // Next number typed will replace current
  state.justEvaled = false;
  // Mark: next digit press starts a new number
  state._waitingForNext = true;

  highlightOp(op);
}

function handleEquals() {
  if (state.operator === null || state.previous === null) return;

  const expr = `${state.previous} ${state.operator} ${state.current}`;
  const result = calculate(state.previous, state.current, state.operator);

  displayExpression.textContent = expr + ' =';
  state.current    = formatNumber(result);
  state.previous   = null;
  state.operator   = null;
  state.justEvaled = true;
  state._waitingForNext = false;

  clearActiveOp();
  flashResult();
}

function handleClear() {
  state.current         = '0';
  state.previous        = null;
  state.operator        = null;
  state.justEvaled      = false;
  state._waitingForNext = false;
  clearActiveOp();
}

function handleSign() {
  if (state.current === '0' || state.current === 'Erro') return;
  state.current = formatNumber(parseFloat(state.current) * -1);
}

function handlePercent() {
  if (state.current === 'Erro') return;
  state.current = formatNumber(parseFloat(state.current) / 100);
}

function handleDecimal() {
  if (state.justEvaled) {
    state.current    = '0.';
    state.previous   = null;
    state.operator   = null;
    state.justEvaled = false;
    return;
  }
  if (state._waitingForNext) {
    state.current         = '0.';
    state._waitingForNext = false;
    return;
  }
  if (!state.current.includes('.')) {
    state.current += '.';
  }
}

// ─── Router ──────────────────────────────────────────────
function handleButton(action, value) {
  // If waiting for next operand, reset current on number press
  if (action === 'number' && state._waitingForNext) {
    state.current         = value;
    state._waitingForNext = false;
    updateDisplay();
    return;
  }

  switch (action) {
    case 'number':   handleNumber(value);   break;
    case 'operator': handleOperator(value); break;
    case 'equals':   handleEquals();        break;
    case 'clear':    handleClear();         break;
    case 'sign':     handleSign();          break;
    case 'percent':  handlePercent();       break;
    case 'decimal':  handleDecimal();       break;
  }

  updateDisplay();
}

// ─── Event: click ─────────────────────────────────────────
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const { action, value } = btn.dataset;
    handleButton(action, value);
  });
});

// ─── Event: keyboard ──────────────────────────────────────
const keyMap = {
  '0': ['number', '0'],
  '1': ['number', '1'],
  '2': ['number', '2'],
  '3': ['number', '3'],
  '4': ['number', '4'],
  '5': ['number', '5'],
  '6': ['number', '6'],
  '7': ['number', '7'],
  '8': ['number', '8'],
  '9': ['number', '9'],
  '.': ['decimal', null],
  ',': ['decimal', null],
  '+': ['operator', '+'],
  '-': ['operator', '−'],
  '*': ['operator', '×'],
  '/': ['operator', '÷'],
  'Enter':     ['equals', null],
  '=':         ['equals', null],
  'Backspace': ['clear', null],
  'Escape':    ['clear', null],
  '%':         ['percent', null],
};

document.addEventListener('keydown', e => {
  const mapped = keyMap[e.key];
  if (!mapped) return;
  e.preventDefault();
  const [action, value] = mapped;
  handleButton(action, value);

  // Visual feedback on button
  buttons.forEach(btn => {
    const match =
      (action === 'number'   && btn.dataset.action === 'number'   && btn.dataset.value === value) ||
      (action === 'operator' && btn.dataset.action === 'operator' && btn.dataset.value === value) ||
      (action === 'equals'   && btn.dataset.action === 'equals') ||
      (action === 'clear'    && btn.dataset.action === 'clear') ||
      (action === 'decimal'  && btn.dataset.action === 'decimal') ||
      (action === 'percent'  && btn.dataset.action === 'percent');
    if (match) {
      btn.classList.add('key-active');
      setTimeout(() => btn.classList.remove('key-active'), 120);
    }
  });
});

// Initial render
updateDisplay();
