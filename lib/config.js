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

module.exports = { listConfig, getConfig, setConfig };
