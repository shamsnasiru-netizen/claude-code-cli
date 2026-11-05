'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { maskKey, formatBytes, formatDate, getDirSize, countFiles } = require('../lib/utils');
const { validateApiKeyFormat } = require('../lib/keys');

test('maskKey returns (not set) for null', () => {
  assert.strictEqual(maskKey(null), '(not set)');
});

test('maskKey returns (not set) for empty string', () => {
  assert.strictEqual(maskKey(''), '(not set)');
});

test('maskKey masks short keys', () => {
  const result = maskKey('abcd');
  assert.strictEqual(result, 'ab****');
});

test('maskKey masks long keys with prefix and suffix', () => {
  const result = maskKey('sk-ant-api1234567890abcdef');
  assert.ok(result.startsWith('sk-ant-'));
  assert.ok(result.endsWith('cdef'));
});

test('formatBytes returns 0 B for zero', () => {
  assert.strictEqual(formatBytes(0), '0 B');
});

test('formatBytes formats KB correctly', () => {
  assert.strictEqual(formatBytes(1024), '1.0 KB');
});

test('formatBytes formats MB correctly', () => {
  assert.strictEqual(formatBytes(1024 * 1024), '1.0 MB');
});

test('validateApiKeyFormat accepts anthropic key', () => {
  const result = validateApiKeyFormat('sk-ant-verylongkey123456789');
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.reason, 'anthropic');
});

test('validateApiKeyFormat rejects empty key', () => {
  const result = validateApiKeyFormat('');
  assert.strictEqual(result.valid, false);
});

test('validateApiKeyFormat rejects unknown format', () => {
  const result = validateApiKeyFormat('random-garbage');
  assert.strictEqual(result.valid, false);
});

test('validateApiKeyFormat accepts generic sk- prefix', () => {
  const result = validateApiKeyFormat('sk-abc123def456');
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.reason, 'generic');
});
