'use strict';

const fs = require('fs');
const path = require('path');
const { PROJECTS_DIR, COLORS } = require('./constants');
const { formatBytes, formatDate, getDirSize, countFiles, printInfo, printWarn } = require('./utils');

function listSessions(jsonMode, opts) {
  if (!fs.existsSync(PROJECTS_DIR)) {
    printWarn(`Projects directory not found: ${PROJECTS_DIR}`);
    printInfo('This means no Claude Code sessions have been created yet.');
    return [];
  }

  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
  const sessions = entries.filter(e => e.isDirectory()).map(e => {
    const dirPath = path.join(PROJECTS_DIR, e.name);
    let lastModified = null;
    try {
      lastModified = fs.statSync(dirPath).mtime.toISOString();
    } catch {}
    return {
      name: e.name,
      path: dirPath,
      lastModified,
      fileCount: countFiles(dirPath),
      sizeBytes: getDirSize(dirPath),
    };
  });

  sessions.sort((a, b) => new Date(b.lastModified || 0) - new Date(a.lastModified || 0));

  if (jsonMode) {
    process.stdout.write(JSON.stringify(sessions, null, 2) + '\n');
    return sessions;
  }

  process.stdout.write('\n' + COLORS.bold('Claude Code Sessions') + '\n\n');

  if (sessions.length === 0) {
    printInfo('No sessions found.');
    return sessions;
  }

  process.stdout.write(`  ${'SESSION'.padEnd(40)} ${'MODIFIED'.padEnd(22)} ${'FILES'.padEnd(8)} SIZE\n`);
  process.stdout.write('  ' + '-'.repeat(80) + '\n');

  for (const s of sessions) {
    const name = s.name.length > 38 ? s.name.slice(0, 35) + '...' : s.name;
    const modified = s.lastModified ? formatDate(s.lastModified).slice(0, 19) : 'unknown';
    process.stdout.write(`  ${name.padEnd(40)} ${modified.padEnd(22)} ${String(s.fileCount).padEnd(8)} ${formatBytes(s.sizeBytes)}\n`);
  }

  const totalSize = sessions.reduce((acc, s) => acc + s.sizeBytes, 0);
  const totalFiles = sessions.reduce((acc, s) => acc + s.fileCount, 0);
  process.stdout.write('\n  ' + COLORS.dim(`Total: ${sessions.length} session(s), ${totalFiles} file(s), ${formatBytes(totalSize)}`) + '\n\n');

  return sessions;
}

function cleanSessions(dryRun) {
  const sessions = listSessions(true, {});
  if (sessions.length === 0) return;

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const old = sessions.filter(s => s.lastModified && new Date(s.lastModified).getTime() < cutoff);

  if (old.length === 0) {
    printInfo('No sessions older than 30 days found.');
    return;
  }

  process.stdout.write(`\n  Found ${old.length} session(s) older than 30 days:\n`);
  for (const s of old) {
    if (dryRun) {
      process.stdout.write(`  [DRY RUN] Would remove: ${s.name} (${formatBytes(s.sizeBytes)})\n`);
    } else {
      try {
        fs.rmSync(s.path, { recursive: true, force: true });
        process.stdout.write(`  Removed: ${s.name} (${formatBytes(s.sizeBytes)})\n`);
      } catch (err) {
        process.stdout.write(`  Failed to remove ${s.name}: ${err.message}\n`);
      }
    }
  }
}

module.exports = { listSessions, cleanSessions };
