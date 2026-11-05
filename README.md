# claude-code-cli

Manage your Claude Code configuration, sessions, usage, and API keys from the terminal.

**No API key required to use this tool.** Works alongside [@anthropic-ai/claude-code](https://www.npmjs.com/package/@anthropic-ai/claude-code).

## Why claude-code-cli?

Claude Code is a powerful AI coding assistant, but managing its configuration across projects can be tedious. This CLI tool gives you a single command to:

- Check if Claude Code is properly installed and configured
- View token usage and estimated costs from session data
- Trace where each configuration setting comes from
- View and modify settings without editing JSON files by hand
- List and clean up old session data
- Verify API key setup across multiple sources
- Run comprehensive system diagnostics

All checks run locally. Zero dependencies. Privacy-first.

## Install

```bash
npm install -g claude-code-cli
```

## Quick Start

```bash
# See your Claude Code status at a glance (default command)
claude-code-cli

# Track token usage and estimated costs
claude-code-cli usage

# Check if Claude Code is set up correctly
claude-code-cli setup

# View current configuration
claude-code-cli config list

# List all Claude Code sessions
claude-code-cli sessions

# Check API key status
claude-code-cli keys

# Run full system diagnostics
claude-code-cli doctor
```

## Commands

### `status` (default)

Show a dashboard with Claude Code installation status, API key, session count, last used time, settings summary, and disk usage. Running `claude-code-cli` with no arguments shows this dashboard.

```bash
claude-code-cli status
claude-code-cli status --json
```

### `usage`

Track token usage and estimated costs by parsing session data locally. Shows today/week/month breakdown, per-project attribution, and per-model distribution.

```bash
claude-code-cli usage
claude-code-cli usage --project myapp
claude-code-cli usage --json
```

> Cost estimates are approximate and based on published per-token rates. This is not billing data.

### `setup`

Run initial setup verification. Checks Claude Code installation, settings file, API key, and binary availability.

```bash
claude-code-cli setup
claude-code-cli setup --json   # Machine-readable output
```

### `config`

View and manage Claude Code settings stored in `~/.claude/settings.json`.

```bash
claude-code-cli config list           # Show all settings
claude-code-cli config get model      # Get a specific setting
claude-code-cli config set model claude-sonnet-5-5  # Set a value
```

### `config explain [key]`

Trace where a configuration setting comes from. Shows the full precedence chain across environment variables, project-local, project-shared, and user-level settings files.

```bash
claude-code-cli config explain model
claude-code-cli config explain ANTHROPIC_API_KEY
claude-code-cli config explain        # summary of all settings
```

### `sessions`

List and manage Claude Code project sessions stored in `~/.claude/projects/`.

```bash
claude-code-cli sessions             # List all sessions
claude-code-cli sessions --clean     # Remove sessions older than 30 days
claude-code-cli sessions --clean --dry-run  # Preview what would be removed
```

### `keys`

Check API key configuration across environment, shell profiles, and .env files.

```bash
claude-code-cli keys
claude-code-cli keys --json
```

### `doctor`

Comprehensive system diagnostics covering Node.js, platform, Claude directory, settings, environment variables, git, npm, and disk space.

```bash
claude-code-cli doctor
claude-code-cli doctor --json
```

## Docker

Run in a container for isolated diagnostics:

```dockerfile
FROM node:22-alpine
RUN npm install -g claude-code-cli
ENTRYPOINT ["claude-code-cli"]
```

```bash
docker build -t claude-code-cli .
docker run --rm -v ~/.claude:/root/.claude claude-code-cli doctor
```

## Frequently Asked Questions

### How do I see my Claude Code usage and costs?

Run `claude-code-cli usage`. It parses session data locally and shows token consumption by time period, project, and model, with approximate cost estimates. No network requests are made.

### How do I know which settings file is being used?

Run `claude-code-cli config explain <key>` to see the full precedence chain for any setting. It shows which source (environment, project-local, project-shared, or user settings) is providing the effective value.

### How do I check if Claude Code is installed correctly?

Run `claude-code-cli setup`. It checks for the `~/.claude` directory, settings file, API key, and binary availability, then tells you what is missing.

### How do I find my Claude Code API key?

Run `claude-code-cli keys`. It checks the `ANTHROPIC_API_KEY` environment variable, shell profiles (`.bashrc`, `.zshrc`), and `.env` files in the current directory.

### Where are Claude Code sessions stored?

Sessions are stored in `~/.claude/projects/`, one directory per project. Run `claude-code-cli sessions` to see them with file counts and sizes.

### How do I clean up old Claude Code sessions?

Run `claude-code-cli sessions --clean` to remove sessions older than 30 days. Use `--dry-run` first to preview.

### Does this tool require an API key?

No. claude-code-cli reads local configuration and does not make any network requests. It works entirely offline.

### Can I use this without Claude Code installed?

Yes, but most commands will show warnings. The tool gracefully handles missing `~/.claude` directory and settings.

### How do I change the default Claude model?

```bash
claude-code-cli config set model claude-sonnet-5-5
```

### What does doctor check?

Doctor verifies: Node.js version, OS platform, `~/.claude` directory permissions, settings file validity, environment variables, git configuration, npm registry, and available disk space.

## License

MIT
