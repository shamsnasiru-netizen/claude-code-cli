'use strict';

const test = require('node:test');
const assert = require('node:assert');
const os = require('os');
const path = require('path');
const fs = require('fs');

test('keys module exports runKeysCheck', () => {
  const keys = require('../lib/keys');
  assert.strictEqual(typeof keys.runKeysCheck, 'function');
});

test('keys module exports validateApiKeyFormat', () => {
  const keys = require('../lib/keys');
  assert.strictEqual(typeof keys.validateApiKeyFormat, 'function');
});

test('keys module exports maskKey', () => {
  const keys = require('../lib/keys');
  assert.strictEqual(typeof keys.maskKey, 'function');
});

test('runKeysCheck returns structured result', () => {
  const keys = require('../lib/keys');
  const origKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test123456789012345';
  const result = keys.runKeysCheck(true);
  process.env.ANTHROPIC_API_KEY = origKey;
  assert.ok(result);
  assert.ok('environment' in result);
  assert.ok('recommendations' in result);
  assert.ok(Array.isArray(result.recommendations));
  assert.strictEqual(result.environment.set, true);
});

test('runKeysCheck detects missing key', () => {
  const keys = require('../lib/keys');
  const origKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const result = keys.runKeysCheck(true);
  if (origKey) process.env.ANTHROPIC_API_KEY = origKey;
  assert.strictEqual(result.environment.set, false);
  assert.ok(result.recommendations.length > 0);
});

test('validateApiKeyFormat handles null input', () => {
  const { validateApiKeyFormat } = require('../lib/keys');
  const result = validateApiKeyFormat(null);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.reason, 'empty');
});
