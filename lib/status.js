'use strict';

const fs = require('fs');
const path = require('path');
const { CLAUDE_DIR, SETTINGS_FILE, PROJECTS_DIR } = require('./constants');
const { claudeDirExists, settingsExists, readSettings, maskKey, getDirSize } = require('./utils');
const { c, ICON, box, tree, humanBytes, humanTimeAgo } = require('./ui');

function collectStatus() {
  const info = {
    installed: false,
    version: null,
    apiKey: null,
    apiKeyMasked: null,
    sessions: 0,
    sessionSize: 0,
    lastUsed: null,
    model: null,
    permissions: null,
    mcpServers: 0,
    claudeDirSize: 0,
    cacheSize: 0,
  };

  if (claudeDirExists()) {
    info.installed = true;
    info.claudeDirSize = getDirSize(CLAUDE_DIR);

    if (settingsExists()) {
      const settings = readSettings();
      if (settings) {
        info.model = settings.model || null;
        info.permissions = settings.permissions || 'default';
        if (settings.mcpServers && typeof settings.mcpServers === 'object') {
          info.mcpServers = Object.keys(settings.mcpServers).length;
        }
      }
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    info.apiKey = true;
    info.apiKeyMasked = maskKey(apiKey);
  }

  if (fs.existsSync(PROJECTS_DIR)) {
    try {
      const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory());
      info.sessions = dirs.length;
      let lastMtime = 0;
      for (const d of dirs) {
        try {
          const m = fs.statSync(path.join(PROJECTS_DIR, d.name)).mtimeMs;
          if (m > lastMtime) lastMtime = m;
        } catch {}
      }
      if (lastMtime > 0) info.lastUsed = new Date(lastMtime).toISOString();
      info.sessionSize = getDirSize(PROJECTS_DIR);
    } catch {}
  }

  const cacheDir = path.join(CLAUDE_DIR, 'cache');
  if (fs.existsSync(cacheDir)) {
    info.cacheSize = getDirSize(cacheDir);
  }

  return info;
}

function renderStatus(jsonMode) {
  const info = collectStatus();

  if (jsonMode) {
    process.stdout.write(JSON.stringify(info, null, 2) + '\n');
    return info;
  }

  const pkg = require('../package.json');
  process.stdout.write('\n' + c.bold(box('Claude Code CLI Manager v' + pkg.version)) + '\n\n');

  process.stdout.write(statusLine('Claude Code', info.installed ? 'ok' : 'warn',
    info.installed ? 'Installed' : 'Not found') + '\n');

  process.stdout.write(statusLine('API Key', info.apiKey ? 'ok' : 'warn',
    info.apiKey ? 'Configured (' + c.dim(info.apiKeyMasked) + ')' : 'Not set') + '\n');

  process.stdout.write(statusLine('Sessions',
    info.sessions > 0 ? 'ok' : 'warn',
    info.sessions + ' session' + (info.sessions === 1 ? '' : 's') +
    (info.sessionSize > 0 ? ' (' + humanBytes(info.sessionSize) + ')' : '')) + '\n');

  process.stdout.write(statusLine('Last Used',
    info.lastUsed ? 'ok' : 'warn',
    info.lastUsed ? humanTimeAgo(info.lastUsed) : 'No sessions yet') + '\n');

  if (info.model || info.permissions || info.mcpServers > 0) {
    process.stdout.write('\n' + c.bold('  Settings:') + '\n');
    const items = [];
    if (info.model) items.push('Model: ' + c.cyan(info.model));
    if (info.permissions) items.push('Permissions: ' + c.cyan(info.permissions));
    if (info.mcpServers > 0) items.push('MCP Servers: ' + c.cyan(String(info.mcpServers)) + ' configured');
    process.stdout.write(tree(items) + '\n');
  }

  if (info.claudeDirSize > 0 || info.cacheSize > 0) {
    process.stdout.write('\n' + c.bold('  Disk Usage:') + '\n');
    const items = [];
    if (info.claudeDirSize > 0) items.push('~/.claude/  ' + humanBytes(info.claudeDirSize));
    if (info.cacheSize > 0) items.push('Cache       ' + humanBytes(info.cacheSize));
    process.stdout.write(tree(items) + '\n');
  }

  process.stdout.write('\n');
  return info;
}

function statusLine(label, state, detail) {
  const icon = state === 'ok' ? ICON.ok : state === 'warn' ? ICON.warn : ICON.err;
  return '  ' + c.bold(String(label).padEnd(14)) + icon + '  ' + (detail || '');
}

module.exports = { collectStatus, renderStatus };
