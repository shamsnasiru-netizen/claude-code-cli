'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const path = require('path');

const CLI_PATH = path.join(__dirname, '..', 'bin', 'cli.js');

function runCli(...args) {
  return execSync(`node "${CLI_PATH}" ${args.join(' ')}`, { encoding: 'utf-8' });
}

test('CLI runs without arguments and shows help', () => {
  const output = runCli();
  assert.ok(output.includes('claude-code-cli'));
  assert.ok(output.includes('setup'));
  assert.ok(output.includes('doctor'));
});

test('CLI help command shows usage', () => {
  const output = runCli('help');
  assert.ok(output.includes('Usage:'));
  assert.ok(output.includes('Commands:'));
});

test('CLI --version outputs version number', () => {
  const output = runCli('--version');
  assert.ok(/^\d+\.\d+\.\d+/.test(output.trim()));
});

test('CLI unknown command shows error and help', () => {
  try {
    execSync(`node "${CLI_PATH}" badcommand 2>&1`, { encoding: 'utf-8' });
    assert.fail('Should have exited with error');
  } catch (err) {
    assert.ok(err.stdout.includes('Unknown command'));
  }
});

test('CLI setup command runs without crash', () => {
  const output = runCli('setup');
  assert.ok(output.length > 0);
});

test('CLI config list runs without crash', () => {
  const output = runCli('config', 'list');
  assert.ok(output.includes('Configuration') || output.includes('not found'));
});

test('CLI doctor command produces output', () => {
  const output = runCli('doctor');
  assert.ok(output.includes('Diagnostics') || output.includes('checks'));
});

test('CLI keys command produces output', () => {
  const output = runCli('keys');
  assert.ok(output.length > 0);
});

test('CLI sessions command produces output', () => {
  const output = runCli('sessions');
  assert.ok(output.length > 0);
});
