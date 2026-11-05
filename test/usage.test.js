'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { parseJsonlFile, costFor, estimateModel, collectUsage } = require('../lib/usage');
const fs = require('fs');
const os = require('os');
const path = require('path');

test('estimateModel identifies opus', () => {
  assert.strictEqual(estimateModel('claude-opus-4-20250514'), 'claude-opus');
});

test('estimateModel identifies haiku', () => {
  assert.strictEqual(estimateModel('claude-3-haiku'), 'claude-haiku');
});

test('estimateModel defaults to sonnet', () => {
  assert.strictEqual(estimateModel('unknown-model'), 'claude-sonnet');
  assert.strictEqual(estimateModel(null), 'claude-sonnet');
});

test('costFor computes estimated cost', () => {
  const cost = costFor(1000000, 500000, 'claude-sonnet-4');
  assert.ok(cost > 0);
  assert.ok(typeof cost === 'number');
});

test('parseJsonlFile parses valid JSONL', () => {
  const tmp = path.join(os.tmpdir(), 'test-usage-' + Date.now() + '.jsonl');
  const lines = [
    JSON.stringify({ usage: { input_tokens: 100, output_tokens: 50 }, model: 'claude-sonnet-4', timestamp: '2026-01-01T00:00:00Z' }),
    JSON.stringify({ usage: { input_tokens: 200, output_tokens: 80 }, model: 'claude-opus-4' }),
    JSON.stringify({ message: 'no usage here' }),
    'not json at all',
    '',
  ].join('\n');
  fs.writeFileSync(tmp, lines);
  const stats = parseJsonlFile(tmp);
  assert.ok(stats);
  assert.strictEqual(stats.inputTokens, 300);
  assert.strictEqual(stats.outputTokens, 130);
  assert.strictEqual(stats.model, 'claude-sonnet-4');
  assert.strictEqual(stats.timestamp, '2026-01-01T00:00:00Z');
  assert.ok(stats.lines >= 3);
  fs.unlinkSync(tmp);
});

test('parseJsonlFile returns null for missing file', () => {
  const stats = parseJsonlFile('/nonexistent/file.jsonl');
  assert.strictEqual(stats, null);
});

test('collectUsage returns structure', () => {
  const result = collectUsage(null);
  assert.strictEqual(typeof result, 'object');
  assert.ok('total' in result);
  assert.ok('today' in result);
  assert.ok('byProject' in result);
  assert.ok('byModel' in result);
  assert.strictEqual(typeof result.filesScanned, 'number');
});
