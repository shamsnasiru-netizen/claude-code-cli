'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { PROJECTS_DIR } = require('../lib/constants');

test('sessions module exports listSessions', () => {
  const sessions = require('../lib/sessions');
  assert.strictEqual(typeof sessions.listSessions, 'function');
});

test('sessions module exports cleanSessions', () => {
  const sessions = require('../lib/sessions');
  assert.strictEqual(typeof sessions.cleanSessions, 'function');
});

test('listSessions returns array', () => {
  const sessions = require('../lib/sessions');
  const result = sessions.listSessions(true, {});
  assert.ok(Array.isArray(result));
});

test('PROJECTS_DIR is under .claude directory', () => {
  assert.ok(PROJECTS_DIR.includes('.claude'));
  assert.ok(PROJECTS_DIR.includes('projects'));
});
