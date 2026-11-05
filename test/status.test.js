'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { collectStatus } = require('../lib/status');

test('collectStatus returns object with expected fields', () => {
  const info = collectStatus();
  assert.strictEqual(typeof info, 'object');
  assert.strictEqual(typeof info.installed, 'boolean');
  assert.strictEqual(typeof info.sessions, 'number');
  assert.ok(info.sessionSize >= 0);
  assert.ok(info.claudeDirSize >= 0);
});

test('collectStatus handles missing ~/.claude gracefully', () => {
  const info = collectStatus();
  // Just verify it doesn't throw
  assert.ok(info !== null && info !== undefined);
});
