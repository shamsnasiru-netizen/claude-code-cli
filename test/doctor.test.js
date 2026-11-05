'use strict';

const test = require('node:test');
const assert = require('node:assert');

test('doctor module exports runDoctor', () => {
  const doctor = require('../lib/doctor');
  assert.strictEqual(typeof doctor.runDoctor, 'function');
});

test('runDoctor returns structured result', () => {
  const doctor = require('../lib/doctor');
  const result = doctor.runDoctor(true);
  assert.ok(result);
  assert.ok('node' in result);
  assert.ok('platform' in result);
  assert.ok('claudeDir' in result);
  assert.ok('settings' in result);
  assert.ok('environment' in result);
  assert.ok('git' in result);
  assert.ok('npm' in result);
  assert.ok('disk' in result);
});

test('doctor node check has status field', () => {
  const doctor = require('../lib/doctor');
  const result = doctor.runDoctor(true);
  assert.ok(['ok', 'warn', 'error'].includes(result.node.status));
  assert.ok(typeof result.node.message === 'string');
});

test('doctor environment is an array', () => {
  const doctor = require('../lib/doctor');
  const result = doctor.runDoctor(true);
  assert.ok(Array.isArray(result.environment));
  assert.ok(result.environment.length > 0);
});

test('doctor platform check is ok', () => {
  const doctor = require('../lib/doctor');
  const result = doctor.runDoctor(true);
  assert.strictEqual(result.platform.status, 'ok');
});
