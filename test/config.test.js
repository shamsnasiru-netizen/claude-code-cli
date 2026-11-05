'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { CLAUDE_DIR, SETTINGS_FILE, KNOWN_SETTINGS, ENV_KEYS, MIN_NODE_VERSION } = require('../lib/constants');

test('CLAUDE_DIR points to home .claude directory', () => {
  assert.ok(CLAUDE_DIR.includes('.claude'));
  assert.ok(CLAUDE_DIR.startsWith(os.homedir()));
});

test('SETTINGS_FILE is inside CLAUDE_DIR', () => {
  assert.ok(SETTINGS_FILE.startsWith(CLAUDE_DIR));
  assert.ok(SETTINGS_FILE.endsWith('settings.json'));
});

test('KNOWN_SETTINGS contains expected keys', () => {
  assert.ok('model' in KNOWN_SETTINGS);
  assert.ok('maxTokens' in KNOWN_SETTINGS);
  assert.ok('temperature' in KNOWN_SETTINGS);
});

test('ENV_KEYS contains ANTHROPIC_API_KEY', () => {
  assert.ok('ANTHROPIC_API_KEY' in ENV_KEYS);
});

test('MIN_NODE_VERSION is a positive number', () => {
  assert.ok(MIN_NODE_VERSION >= 16);
});

test('COLORS provides formatting functions', () => {
  const { COLORS } = require('../lib/constants');
  assert.strictEqual(typeof COLORS.green, 'function');
  assert.strictEqual(typeof COLORS.red, 'function');
  assert.strictEqual(typeof COLORS.yellow, 'function');
  assert.strictEqual(typeof COLORS.bold, 'function');
});

test('HELP_TEXT is non-empty string', () => {
  const { HELP_TEXT } = require('../lib/constants');
  assert.ok(typeof HELP_TEXT === 'string');
  assert.ok(HELP_TEXT.length > 100);
  assert.ok(HELP_TEXT.includes('setup'));
  assert.ok(HELP_TEXT.includes('doctor'));
});
