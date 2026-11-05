'use strict';

let colorEnabled = !process.env.NO_COLOR && !process.argv.includes('--no-color');

const CODES = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

function paint(color, text) {
  if (!colorEnabled) return String(text);
  return CODES[color] + String(text) + CODES.reset;
}

const c = {};
for (const name of Object.keys(CODES)) {
  if (name !== 'reset') c[name] = (s) => paint(name, s);
}

function disableColor() { colorEnabled = false; }
function enableColor() { colorEnabled = true; }
function isColorEnabled() { return colorEnabled; }

const ICON = {
  ok: '✅',
  warn: '⚠️',
  err: '❌',
  folder: '📁',
  chart: '📊',
  gear: '⚙️',
  search: '🔍',
  disk: '💾',
  bolt: '⚡',
  clock: '🕒',
  key: '🔑',
  book: '📘',
};

function box(title, width) {
  const w = width || 42;
  const top = '╭' + '─'.repeat(w) + '╮';
  const bottom = '╰' + '─'.repeat(w) + '╯';
  const pad = Math.max(0, w - title.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  const middle = '│' + ' '.repeat(left) + title + ' '.repeat(right) + '│';
  return top + '\n' + middle + '\n' + bottom;
}

function tree(items) {
  const lines = [];
  for (let i = 0; i < items.length; i++) {
    const isLast = i === items.length - 1;
    const prefix = isLast ? '  └── ' : '  ├── ';
    lines.push(prefix + items[i]);
  }
  return lines.join('\n');
}

function table(headers, rows, minWidths) {
  const widths = [];
  for (let i = 0; i < headers.length; i++) {
    let max = String(headers[i]).length;
    for (const row of rows) {
      const len = String(row[i] != null ? row[i] : '').length;
      if (len > max) max = len;
    }
    if (minWidths && minWidths[i]) widths[i] = Math.max(max, minWidths[i]);
    else widths[i] = max;
  }

  const sep = '  ';
  const headerLine = headers.map((h, i) => String(h).padEnd(widths[i])).join(sep);
  const divider = widths.map(w => '─'.repeat(w)).join(sep);
  const rowLines = rows.map(row =>
    row.map((cell, i) => String(cell != null ? cell : '').padEnd(widths[i])).join(sep)
  );
  return [headerLine, divider, ...rowLines].join('\n');
}

function bar(current, total, width) {
  const w = width || 24;
  const ratio = total > 0 ? current / total : 0;
  const filled = Math.round(ratio * w);
  const empty = w - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ' ' + Math.round(ratio * 100) + '%';
}

function statusLine(label, state, detail) {
  const icon = state === 'ok' ? ICON.ok : state === 'warn' ? ICON.warn : state === 'err' ? ICON.err : '•';
  return '  ' + String(label).padEnd(16) + icon + '  ' + (detail || '');
}

function humanBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

function humanNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function humanTimeAgo(iso) {
  if (!iso) return 'unknown';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'just now';
  const s = Math.floor(diff / 1000);
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 30) return d + 'd ago';
  const mo = Math.floor(d / 30);
  if (mo < 12) return mo + 'mo ago';
  return Math.floor(mo / 12) + 'y ago';
}

module.exports = {
  c, ICON, box, tree, table, bar, statusLine,
  humanBytes, humanNumber, humanTimeAgo,
  disableColor, enableColor, isColorEnabled,
};
