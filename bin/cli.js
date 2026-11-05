#!/usr/bin/env node

'use strict';

const { HELP_TEXT, COLORS } = require('../lib/constants');

const command = process.argv[2];
const args = process.argv.slice(3);

const jsonMode = args.includes('--json');
const quietMode = args.includes('--quiet');
const noColor = args.includes('--no-color');
const positional = args.filter(a => !a.startsWith('--'));

if (noColor) {
  try { require('../lib/ui').disableColor(); } catch {}
}

function showHelp() {
  process.stdout.write(HELP_TEXT + '\n');
}

async function main() {
  if (command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  if (command === '--version' || command === '-v') {
    const pkg = require('../package.json');
    process.stdout.write(pkg.version + '\n');
    return;
  }

  const cmd = command || 'status';

  switch (cmd) {
    case 'status': {
      const { renderStatus } = require('../lib/status');
      renderStatus(jsonMode);
      break;
    }
    case 'setup': {
      const { runSetup } = require('../lib/setup');
      runSetup(jsonMode);
      break;
    }
    case 'config': {
      const { listConfig, getConfig, setConfig, explainConfig } = require('../lib/config');
      const sub = positional[0];
      if (!sub || sub === 'list') {
        listConfig(jsonMode);
      } else if (sub === 'get') {
        getConfig(positional[1]);
      } else if (sub === 'set') {
        setConfig(positional[1], positional[2]);
      } else if (sub === 'explain') {
        explainConfig(positional[1], jsonMode);
      } else {
        process.stderr.write('Unknown config subcommand: ' + sub + '\n');
        process.stderr.write('Usage: claude-code-cli config [list|get|set|explain]\n');
        process.exitCode = 1;
      }
      break;
    }
    case 'usage': {
      const { renderUsage } = require('../lib/usage');
      const projIdx = args.indexOf('--project');
      const projectFilter = projIdx >= 0 ? args[projIdx + 1] : null;
      renderUsage(jsonMode, projectFilter);
      break;
    }
    case 'sessions': {
      const { listSessions, cleanSessions } = require('../lib/sessions');
      const dryRun = args.includes('--dry-run');
      if (args.includes('--clean')) {
        cleanSessions(dryRun);
      } else {
        listSessions(jsonMode, {});
      }
      break;
    }
    case 'keys': {
      const { runKeysCheck } = require('../lib/keys');
      runKeysCheck(jsonMode);
      break;
    }
    case 'doctor': {
      const { runDoctor } = require('../lib/doctor');
      runDoctor(jsonMode);
      break;
    }
    default: {
      process.stderr.write(`Unknown command: ${command}\n\n`);
      showHelp();
      process.exitCode = 1;
    }
  }
}

main().catch(err => {
  process.stderr.write(COLORS.red('Error: ') + err.message + '\n');
  process.exitCode = 1;
});
