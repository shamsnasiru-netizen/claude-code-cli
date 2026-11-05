'use strict';

const fs = require('fs');
const path = require('path');
const { CLAUDE_DIR, SETTINGS_FILE, COLORS } = require('./constants');

function claudeDirExists() {
  try {
    return fs.statSync(CLAUDE_DIR).isDirectory();
  } catch {
    return false;
  }
}

function settingsExists() {
  try {
    return fs.statSync(SETTINGS_FILE).isFile();
  } catch {
    return false;
  }
}

function readSettings() {
  if (!settingsExists()) return null;
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function writeSettings(data) {
  fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function maskKey(key) {
  if (!key || typeof key !== 'string') return '(not set)';
  if (key.length <= 8) return key.slice(0, 2) + '****';
  return key.slice(0, 7) + '...' + key.slice(-4);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function getDirSize(dirPath) {
  let total = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += getDirSize(full);
      } else {
        total += fs.statSync(full).size;
      }
    }
  } catch {}
  return total;
}

function countFiles(dirPath) {
  let count = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        count += countFiles(path.join(dirPath, entry.name));
      } else {
        count++;
      }
    }
  } catch {}
  return count;
}

function printSuccess(msg) { process.stdout.write(COLORS.green('  ✓ ') + msg + '\n'); }
function printError(msg) { process.stderr.write(COLORS.red('  ✗ ') + msg + '\n'); }
function printWarn(msg) { process.stdout.write(COLORS.yellow('  ⚠ ') + msg + '\n'); }
function printInfo(msg) { process.stdout.write(COLORS.cyan('  ℹ ') + msg + '\n'); }

module.exports = {
  claudeDirExists,
  settingsExists,
  readSettings,
  writeSettings,
  maskKey,
  formatBytes,
  formatDate,
  getDirSize,
  countFiles,
  printSuccess,
  printError,
  printWarn,
  printInfo,
};
