'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { CLAUDE_DIR, SETTINGS_FILE, MIN_NODE_VERSION, COLORS } = require('./constants');
const { claudeDirExists, settingsExists, printSuccess, printWarn, printError, printInfo } = require('./utils');

function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  if (major >= MIN_NODE_VERSION) {
    return { status: 'ok', message: `Node.js ${version} (>= ${MIN_NODE_VERSION} required)` };
  }
  return { status: 'warn', message: `Node.js ${version} (minimum ${MIN_NODE_VERSION} recommended)` };
}

function checkPlatform() {
  const platform = os.platform();
  const arch = os.arch();
  const release = os.release();
  return { status: 'ok', message: `${platform} ${arch} (kernel ${release})` };
}

function checkClaudeDir() {
  if (claudeDirExists()) {
    try {
      const stat = fs.statSync(CLAUDE_DIR);
      const writable = fs.accessSync(CLAUDE_DIR, fs.constants.W_OK) === undefined;
      return { status: 'ok', message: `${CLAUDE_DIR} (writable: ${writable})` };
    } catch {
      return { status: 'warn', message: `${CLAUDE_DIR} exists but may have permission issues` };
    }
  }
  return { status: 'warn', message: `${CLAUDE_DIR} not found — Claude Code may not be installed` };
}

function checkSettingsFile() {
  if (settingsExists()) {
    try {
      JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      return { status: 'ok', message: 'Settings file valid JSON' };
    } catch {
      return { status: 'error', message: 'Settings file exists but contains invalid JSON' };
    }
  }
  return { status: 'warn', message: 'Settings file not found' };
}

function checkEnvironment() {
  const results = [];
  const apiKey = process.env.ANTHROPIC_API_KEY;
  results.push({
    name: 'ANTHROPIC_API_KEY',
    status: apiKey ? 'ok' : 'warn',
    message: apiKey ? 'configured' : 'not set',
  });
  const home = process.env.HOME || process.env.USERPROFILE;
  results.push({
    name: 'HOME',
    status: home ? 'ok' : 'error',
    message: home || 'not set',
  });
  const pathEnv = process.env.PATH;
  results.push({
    name: 'PATH',
    status: pathEnv ? 'ok' : 'error',
    message: pathEnv ? `${pathEnv.split(path.delimiter).length} entries` : 'not set',
  });
  return results;
}

function checkGitConfig() {
  try {
    const name = execSync('git config --global user.name 2>/dev/null', { encoding: 'utf-8' }).trim();
    return { status: name ? 'ok' : 'warn', message: name ? `user.name: ${name}` : 'git user.name not set' };
  } catch {
    return { status: 'warn', message: 'git not available or not configured' };
  }
}

function checkNpmConfig() {
  try {
    const registry = execSync('npm config get registry 2>/dev/null', { encoding: 'utf-8' }).trim();
    return { status: 'ok', message: `registry: ${registry}` };
  } catch {
    return { status: 'warn', message: 'npm not available' };
  }
}

function checkDiskSpace() {
  try {
    const stat = fs.statfsSync(os.homedir());
    const freeGB = (stat.bavail * stat.bsize) / (1024 * 1024 * 1024);
    if (freeGB > 1) {
      return { status: 'ok', message: `${freeGB.toFixed(1)} GB free in home directory` };
    }
    return { status: 'warn', message: `Only ${freeGB.toFixed(1)} GB free in home directory` };
  } catch {
    return { status: 'ok', message: 'disk space check unavailable' };
  }
}

function runDoctor(jsonMode) {
  const results = {
    node: checkNodeVersion(),
    platform: checkPlatform(),
    claudeDir: checkClaudeDir(),
    settings: checkSettingsFile(),
    environment: checkEnvironment(),
    git: checkGitConfig(),
    npm: checkNpmConfig(),
    disk: checkDiskSpace(),
  };

  if (jsonMode) {
    process.stdout.write(JSON.stringify(results, null, 2) + '\n');
    return results;
  }

  process.stdout.write('\n' + COLORS.bold('Claude Code CLI — System Diagnostics') + '\n');
  process.stdout.write('  ' + '='.repeat(50) + '\n\n');

  const icon = { ok: COLORS.green('✓'), warn: COLORS.yellow('⚠'), error: COLORS.red('✗') };

  process.stdout.write(COLORS.bold('Runtime:') + '\n');
  process.stdout.write(`  ${icon[results.node.status]} ${results.node.message}\n`);
  process.stdout.write(`  ${icon[results.platform.status]} ${results.platform.message}\n\n`);

  process.stdout.write(COLORS.bold('Claude Code:') + '\n');
  process.stdout.write(`  ${icon[results.claudeDir.status]} ${results.claudeDir.message}\n`);
  process.stdout.write(`  ${icon[results.settings.status]} ${results.settings.message}\n\n`);

  process.stdout.write(COLORS.bold('Environment:') + '\n');
  for (const env of results.environment) {
    process.stdout.write(`  ${icon[env.status]} ${env.name}: ${env.message}\n`);
  }
  process.stdout.write('\n');

  process.stdout.write(COLORS.bold('Developer Tools:') + '\n');
  process.stdout.write(`  ${icon[results.git.status]} Git: ${results.git.message}\n`);
  process.stdout.write(`  ${icon[results.npm.status]} npm: ${results.npm.message}\n\n`);

  process.stdout.write(COLORS.bold('System:') + '\n');
  process.stdout.write(`  ${icon[results.disk.status]} ${results.disk.message}\n\n`);

  const hasErrors = Object.values(results).some(r =>
    Array.isArray(r) ? r.some(e => e.status === 'error') : r.status === 'error'
  );
  const hasWarns = Object.values(results).some(r =>
    Array.isArray(r) ? r.some(e => e.status === 'warn') : r.status === 'warn'
  );

  if (hasErrors) {
    process.stdout.write(COLORS.red('  ✗ Issues found. Run with --json for details.\n\n'));
  } else if (hasWarns) {
    process.stdout.write(COLORS.yellow('  ⚠ Some warnings found. Review above.\n\n'));
  } else {
    process.stdout.write(COLORS.green('  ✓ All checks passed.\n\n'));
  }

  return results;
}

module.exports = { runDoctor };
