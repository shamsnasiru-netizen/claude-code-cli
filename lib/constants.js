'use strict';

const os = require('os');
const path = require('path');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');

const ENV_KEYS = {
  ANTHROPIC_API_KEY: 'Anthropic API key for Claude Code',
  ANTHROPIC_MODEL: 'Default model override',
  CLAUDE_CODE_MAX_TOKENS: 'Max tokens per response',
};

const KNOWN_SETTINGS = {
  model: 'Default Claude model to use',
  maxTokens: 'Maximum tokens per response',
  temperature: 'Response temperature (0.0 - 1.0)',
  autoSave: 'Automatically save session context',
  theme: 'UI color theme preference',
};

const MIN_NODE_VERSION = 18;

const COLORS = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const HELP_TEXT = `
claude-code-cli — Manage your Claude Code configuration, sessions, and API keys

Usage:
  claude-code-cli <command> [options]

Commands:
  setup      Run initial setup and configuration wizard
  config     View and manage Claude Code settings
  sessions   List and manage Claude Code sessions
  keys       Check and manage API keys
  doctor     Run full system diagnostics
  help       Show this help message

Options:
  --json     Output as JSON (where applicable)
  --quiet    Suppress non-essential output
  -h, --help Show help

Examples:
  claude-code-cli setup
  claude-code-cli config list
  claude-code-cli config get model
  claude-code-cli config set model claude-sonnet-5-5
  claude-code-cli sessions --list
  claude-code-cli keys
  claude-code-cli doctor

For more information, visit: https://github.com/OWNER/claude-code-cli
`;

module.exports = {
  CLAUDE_DIR,
  SETTINGS_FILE,
  PROJECTS_DIR,
  ENV_KEYS,
  KNOWN_SETTINGS,
  MIN_NODE_VERSION,
  COLORS,
  HELP_TEXT,
};
