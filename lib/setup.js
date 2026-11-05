'use strict';

const fs = require('fs');
const path = require('path');
const { CLAUDE_DIR, SETTINGS_FILE, COLORS } = require('./constants');
const { claudeDirExists, settingsExists, readSettings, printSuccess, printWarn, printError, printInfo } = require('./utils');

function checkClaudeDir() {
  if (claudeDirExists()) {
    printSuccess(`Claude directory found: ${CLAUDE_DIR}`);
    return true;
  }
  printWarn(`Claude directory not found at ${CLAUDE_DIR}`);
  printInfo('This usually means Claude Code has not been set up yet.');
  printInfo('Install Claude Code first: npm install -g @anthropic-ai/claude-code');
  return false;
}

function checkSettings() {
  if (settingsExists()) {
    printSuccess(`Settings file found: ${SETTINGS_FILE}`);
    const settings = readSettings();
    if (settings) {
      const keys = Object.keys(settings);
      printInfo(`  ${keys.length} setting(s) configured`);
    } else {
      printWarn('  Settings file could not be parsed as JSON.');
    }
    return true;
  }
  printWarn(`Settings file not found at ${SETTINGS_FILE}`);
  return false;
}

function checkApiKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    const masked = key.slice(0, 7) + '...' + key.slice(-4);
    printSuccess(`ANTHROPIC_API_KEY configured: ${COLORS.dim(masked)}`);
    return true;
  }
  printWarn('ANTHROPIC_API_KEY not found in environment.');
  printInfo('Set it with: export ANTHROPIC_API_KEY=sk-ant-your-key-here');
  return false;
}

function checkClaudeBinary() {
  const { execSync } = require('child_process');
  try {
    const result = execSync('which claude 2>/dev/null || echo NOT_FOUND', { encoding: 'utf-8' }).trim();
    if (result === 'NOT_FOUND') {
      printWarn('Claude Code binary not found in PATH.');
      return false;
    }
    printSuccess(`Claude Code binary found: ${result}`);
    return true;
  } catch {
    printWarn('Could not check Claude Code binary.');
    return false;
  }
}

function runSetup(jsonMode) {
  const results = {
    claudeDir: checkClaudeDir(),
    settings: checkSettings(),
    apiKey: checkApiKey(),
    binary: checkClaudeBinary(),
  };

  const allGood = Object.values(results).every(Boolean);
  const partial = Object.values(results).some(Boolean);

  process.stdout.write('\n');
  if (allGood) {
    process.stdout.write(COLORS.green('  ✓ Claude Code is properly configured and ready to use.\n'));
  } else if (partial) {
    process.stdout.write(COLORS.yellow('  ⚠ Claude Code is partially configured. Some features may not work.\n'));
  } else {
    process.stdout.write(COLORS.red('  ✗ Claude Code does not appear to be installed or configured.\n'));
    process.stdout.write('  Install it with: ' + COLORS.cyan('npm install -g @anthropic-ai/claude-code\n'));
  }

  if (jsonMode) {
    process.stdout.write('\n' + JSON.stringify(results) + '\n');
  }

  return results;
}

module.exports = { runSetup, checkClaudeDir, checkSettings, checkApiKey, checkClaudeBinary };
