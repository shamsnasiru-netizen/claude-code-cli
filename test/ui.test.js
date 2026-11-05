'use strict';

const test = require('node:test');
const assert = require('node:assert');
const ui = require('../lib/ui');

test('humanBytes formats correctly', () => {
  assert.strictEqual(ui.humanBytes(0), '0 B');
  assert.strictEqual(ui.humanBytes(1024), '1.0 KB');
  assert.strictEqual(ui.humanBytes(1048576), '1.0 MB');
});

test('humanNumber formats correctly', () => {
  assert.strictEqual(ui.humanNumber(500), '500');
  assert.strictEqual(ui.humanNumber(1500), '1.5K');
  assert.strictEqual(ui.humanNumber(1500000), '1.5M');
});

test('humanTimeAgo returns string', () => {
  const now = new Date().toISOString();
  assert.ok(typeof ui.humanTimeAgo(now) === 'string');
  assert.strictEqual(ui.humanTimeAgo(null), 'unknown');
});

test('box returns bordered string', () => {
  const result = ui.box('Hello', 20);
  assert.ok(result.includes('Hello'));
  assert.ok(result.includes('╭'));
});

test('tree renders items', () => {
  const result = ui.tree(['one', 'two', 'three']);
  assert.ok(result.includes('one'));
  assert.ok(result.includes('three'));
  assert.ok(result.includes('└──'));
});

test('table renders headers and rows', () => {
  const result = ui.table(['A', 'B'], [['1', '2'], ['3', '4']]);
  assert.ok(result.includes('A'));
  assert.ok(result.includes('1'));
});

test('bar returns progress string', () => {
  const result = ui.bar(5, 10, 10);
  assert.ok(result.includes('50%'));
});

test('disableColor strips codes', () => {
  ui.disableColor();
  const result = ui.c.red('test');
  assert.strictEqual(result, 'test');
  ui.enableColor();
});

test('enableColor adds codes', () => {
  ui.enableColor();
  const result = ui.c.red('test');
  assert.ok(result.includes('\x1b[31m'));
  assert.ok(result.includes('\x1b[0m'));
});
