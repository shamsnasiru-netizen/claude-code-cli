'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { COLORS } = require('./constants');
const { maskKey, printSuccess, printWarn, printInfo, printError } = require('./utils');

function validateApiKeyFormat(key) {
  if (!key || typeof key !== 'string') return { valid: false, reason: 'empty' };
  if (key.startsWith('sk-ant-') && key.length > 20) return { valid: true, reason: 'anthropic' };
  if (key.startsWith('sk-') && key.length > 10) return { valid: true, reason: 'generic' };
  return { valid: false, reason: 'unrecognized format' };
}

function checkEnvKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { set: false, valid: false, masked: null, source: 'environment' };
  const validation = validateApiKeyFormat(key);
  return { set: true, valid: validation.valid, masked: maskKey(key), source: 'environment', format: validation.reason };
}

function checkShellProfile() {
  const profiles = [
    path.join(os.homedir(), '.bashrc'),
    path.join(os.homedir(), '.zshrc'),
    path.join(os.homedir(), '.profile'),
    path.join(os.homedir(), '.bash_profile'),
  ];
  const found = [];
  for (const p of profiles) {
    try {
      const content = fs.readFileSync(p, 'utf-8');
      if (content.includes('ANTHROPIC_API_KEY')) {
        found.push(path.basename(p));
      }
    } catch {}
  }
  return found;
}

function checkDotEnvFiles() {
  const cwd = process.cwd();
  const envFiles = ['.env', '.env.local', '.env.production'];
  const found = [];
  for (const f of envFiles) {
    const fp = path.join(cwd, f);
    try {
      const content = fs.readFileSync(fp, 'utf-8');
      if (content.includes('ANTHROPIC_API_KEY')) {
        found.push(f);
      }
    } catch {}
  }
  return found;
}

function runKeysCheck(jsonMode) {
  const envKey = checkEnvKey();
  const shellProfiles = checkShellProfile();
  const dotEnvFiles = checkDotEnvFiles();

  const result = {
    environment: envKey,
    shellProfiles,
    dotEnvFiles,
    recommendations: [],
  };

  if (!envKey.set) {
    result.recommendations.push('Set ANTHROPIC_API_KEY in your shell profile or .env file');
  } else if (!envKey.valid) {
    result.recommendations.push('API key format looks unusual — verify it starts with sk-ant-');
  }
  if (dotEnvFiles.length > 0) {
    result.recommendations.push(`ANTHROPIC_API_KEY found in ${dotEnvFiles.join(', ')} — consider using environment variables instead`);
  }
  if (result.recommendations.length === 0) {
    result.recommendations.push('API key configuration looks good');
  }

  if (jsonMode) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return result;
  }

  process.stdout.write('\n' + COLORS.bold('API Key Status') + '\n\n');

  if (envKey.set) {
    const status = envKey.valid ? COLORS.green('valid') : COLORS.yellow('unrecognized format');
    printSuccess(`ANTHROPIC_API_KEY: ${envKey.masked} (${status})`);
  } else {
    printWarn('ANTHROPIC_API_KEY not set in environment.');
  }

  if (shellProfiles.length > 0) {
    printInfo(`Found in shell profiles: ${shellProfiles.join(', ')}`);
  }
  if (dotEnvFiles.length > 0) {
    printWarn(`Found in .env files: ${dotEnvFiles.join(', ')} — these files may be committed to git.`);
  }

  process.stdout.write('\n' + COLORS.bold('Recommendations:') + '\n');
  for (const rec of result.recommendations) {
    process.stdout.write(`  • ${rec}\n`);
  }
  process.stdout.write('\n');

  return result;
}

module.exports = { runKeysCheck, validateApiKeyFormat, maskKey };
