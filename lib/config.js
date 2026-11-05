'use strict';

const { readSettings, writeSettings, settingsExists, printInfo, printWarn, printError } = require('./utils');
const { KNOWN_SETTINGS, ENV_KEYS, COLORS } = require('./constants');

function listConfig(jsonMode) {
  const settings = readSettings();
  const envConfig = {};

  for (const [key, desc] of Object.entries(ENV_KEYS)) {
    envConfig[key] = { value: process.env[key] ? '(set)' : '(not set)', description: desc };
  }

  if (jsonMode) {
    process.stdout.write(JSON.stringify({ settings: settings || {}, env: envConfig }, null, 2) + '\n');
    return;
  }

  process.stdout.write('\n' + COLORS.bold('Claude Code Configuration') + '\n\n');

  process.stdout.write(COLORS.bold('Settings file (~/.claude/settings.json):') + '\n');
  if (!settingsExists()) {
    printWarn('Settings file not found. Run "claude-code-cli setup" to create it.');
  } else if (!settings) {
    printWarn('Settings file exists but could not be parsed.');
  } else {
    const keys = Object.keys(settings);
    if (keys.length === 0) {
      printInfo('Settings file is empty.');
    } else {
      for (const key of keys) {
        const desc = KNOWN_SETTINGS[key] || '';
        process.stdout.write(`  ${COLORs_cyan(key)}: ${JSON.stringify(settings[key])}` + (desc ? COLORS.dim(`  — ${desc}`) : '') + '\n');
      }
    }
  }

  process.stdout.write('\n' + COLORS.bold('Environment variables:') + '\n');
  for (const [key, info] of Object.entries(envConfig)) {
    process.stdout.write(`  ${COLORS.cyan(key)}: ${info.value}` + COLORS.dim(`  — ${info.description}`) + '\n');
  }
  process.stdout.write('\n');
}

function getConfig(key) {
  if (!key) {
    printError('Please specify a setting key. Usage: claude-code-cli config get <key>');
    process.exitCode = 1;
    return;
  }
  const settings = readSettings();
  if (!settings) {
    printWarn('No settings file found.');
    process.exitCode = 1;
    return;
  }
  if (!(key in settings)) {
    printWarn(`Setting "${key}" not found in settings.`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(JSON.stringify(settings[key]) + '\n');
}

function setConfig(key, value) {
  if (!key || value === undefined) {
    printError('Usage: claude-code-cli config set <key> <value>');
    process.exitCode = 1;
    return;
  }
  let parsedValue = value;
  if (value === 'true') parsedValue = true;
  else if (value === 'false') parsedValue = false;
  else if (/^\d+$/.test(value)) parsedValue = parseInt(value, 10);
  else if (/^\d+\.\d+$/.test(value)) parsedValue = parseFloat(value);

  const settings = readSettings() || {};
  settings[key] = parsedValue;
  writeSettings(settings);
  printInfo(`Set "${key}" to ${JSON.stringify(parsedValue)}`);
}

function COLORs_cyan(s) { return COLORS.cyan(s); }

function explainConfig(key, jsonMode) {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  const { c, ICON, tree } = require('./ui');
  const { maskKey } = require('./utils');

  const sources = [
    { name: 'CLI flag', file: null, kind: 'cli' },
    { name: 'Environment', file: null, kind: 'env' },
    { name: 'Project local', file: path.join(process.cwd(), '.claude', 'settings.local.json'), kind: 'file' },
    { name: 'Project shared', file: path.join(process.cwd(), '.claude', 'settings.json'), kind: 'file' },
    { name: 'User settings', file: path.join(os.homedir(), '.claude', 'settings.json'), kind: 'file' },
  ];

  function readJson(fp) {
    try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch { return null; }
  }

  function resolve(key) {
    const envMap = {
      model: 'ANTHROPIC_MODEL',
      maxTokens: 'CLAUDE_CODE_MAX_TOKENS',
      ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',
    };
    const chain = [];
    for (const src of sources) {
      let found = false;
      let value = null;
      if (src.kind === 'env') {
        const envKey = envMap[key] || key;
        value = process.env[envKey];
        if (value !== undefined) found = true;
      } else if (src.kind === 'file' && src.file) {
        const data = readJson(src.file);
        if (data && key in data) { found = true; value = data[key]; }
      }
      chain.push({ source: src.name, file: src.file, found, value });
    }
    const winner = chain.find(s => s.found);
    return { chain, winner };
  }

  function getSummary() {
    const rows = [];
    const userSettings = readJson(path.join(os.homedir(), '.claude', 'settings.json')) || {};
    const projShared = readJson(path.join(process.cwd(), '.claude', 'settings.json')) || {};
    const projLocal = readJson(path.join(process.cwd(), '.claude', 'settings.local.json')) || {};
    const allKeys = new Set([...Object.keys(userSettings), ...Object.keys(projShared), ...Object.keys(projLocal)]);
    for (const k of ['model', 'maxTokens', 'temperature', 'theme']) {
      if (allKeys.has(k)) allKeys.delete(k), allKeys.add(k);
    }
    for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL']) {
      allKeys.add(k);
    }
    for (const k of allKeys) {
      const { winner } = resolve(k);
      let displayValue = '(not set)';
      let sourceLabel = 'not set (default)';
      if (winner) {
        sourceLabel = winner.source.toLowerCase();
        if (k.includes('KEY') || k.includes('SECRET') || k.includes('TOKEN')) {
          displayValue = maskKey(String(winner.value));
        } else {
          displayValue = String(winner.value);
          if (displayValue.length > 40) displayValue = displayValue.slice(0, 37) + '...';
        }
      }
      rows.push({ key: k, value: displayValue, source: sourceLabel });
    }
    return rows;
  }

  if (!key) {
    const rows = getSummary();
    if (jsonMode) {
      process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
      return rows;
    }
    process.stdout.write('\n' + c.bold('  ' + ICON.gear + ' Configuration Summary') + '\n\n');
    for (const r of rows) {
      const keyPadded = c.cyan(String(r.key).padEnd(24));
      const valPadded = String(r.value).padEnd(26);
      process.stdout.write('  ' + keyPadded + valPadded + c.dim(r.source) + '\n');
    }
    process.stdout.write('\n');
    return rows;
  }

  const { chain, winner } = resolve(key);
  if (jsonMode) {
    process.stdout.write(JSON.stringify({ key, chain, winner }, null, 2) + '\n');
    return { key, chain, winner };
  }

  process.stdout.write('\n  ' + ICON.search + ' ' + c.bold(key) + '\n\n');
  if (winner) {
    const val = key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN')
      ? maskKey(String(winner.value)) : String(winner.value);
    process.stdout.write('  Effective Value: ' + c.cyan(val) + '\n');
    process.stdout.write('  Source: ' + c.green(winner.source) + '\n');
  } else {
    process.stdout.write('  ' + c.yellow('Not set — using default value') + '\n');
  }

  process.stdout.write('\n' + c.bold('  Precedence chain:') + '\n');
  const items = chain.map((s, i) => {
    const mark = s.found ? c.green('MATCHES') : c.dim('not set');
    return (i + 1) + '. ' + (s.found ? c.green('✔') : c.dim('✖')) + ' ' +
      s.source + (s.file ? c.dim(' (' + s.file + ')') : '') + ' — ' + mark;
  });
  process.stdout.write(tree(items) + '\n\n');
  return { key, chain, winner };
}

module.exports = { listConfig, getConfig, setConfig, explainConfig };
