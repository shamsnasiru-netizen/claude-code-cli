'use strict';

const fs = require('fs');
const path = require('path');
const { PROJECTS_DIR } = require('./constants');
const { c, ICON, tree, humanNumber } = require('./ui');

const MODEL_RATES = {
  'claude-sonnet': { input: 3, output: 15 },
  'claude-opus': { input: 15, output: 75 },
  'claude-haiku': { input: 0.25, output: 1.25 },
};

function estimateModel(name) {
  if (!name) return 'claude-sonnet';
  const lower = String(name).toLowerCase();
  if (lower.includes('opus')) return 'claude-opus';
  if (lower.includes('haiku')) return 'claude-haiku';
  return 'claude-sonnet';
}

function costFor(inputTokens, outputTokens, model) {
  const key = estimateModel(model);
  const rates = MODEL_RATES[key] || MODEL_RATES['claude-sonnet'];
  return (inputTokens / 1e6) * rates.input + (outputTokens / 1e6) * rates.output;
}

function parseJsonlFile(filePath) {
  const stats = { inputTokens: 0, outputTokens: 0, model: null, timestamp: null, lines: 0 };
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      stats.lines++;
      try {
        const obj = JSON.parse(trimmed);
        if (obj.usage) {
          if (obj.usage.input_tokens) stats.inputTokens += obj.usage.input_tokens;
          if (obj.usage.output_tokens) stats.outputTokens += obj.usage.output_tokens;
          if (obj.usage.inputTokens) stats.inputTokens += obj.usage.inputTokens;
          if (obj.usage.outputTokens) stats.outputTokens += obj.usage.outputTokens;
        }
        if (obj.token_count) stats.inputTokens += obj.token_count;
        if (obj.model && !stats.model) stats.model = obj.model;
        if (obj.timestamp && !stats.timestamp) stats.timestamp = obj.timestamp;
        if (obj.created_at && !stats.timestamp) stats.timestamp = obj.created_at;
      } catch { continue; }
    }
  } catch { return null; }
  return stats;
}

function collectUsage(projectFilter) {
  const result = {
    total: { inputTokens: 0, outputTokens: 0, cost: 0 },
    today: { inputTokens: 0, outputTokens: 0, cost: 0 },
    week: { inputTokens: 0, outputTokens: 0, cost: 0 },
    month: { inputTokens: 0, outputTokens: 0, cost: 0 },
    byProject: {},
    byModel: {},
    filesScanned: 0,
  };
  if (!fs.existsSync(PROJECTS_DIR)) return result;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  const weekMs = now - 7 * dayMs;
  const monthMs = now - 30 * dayMs;

  const projectDirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory());

  for (const pDir of projectDirs) {
    const projectName = pDir.name;
    if (projectFilter && !projectName.toLowerCase().includes(projectFilter.toLowerCase())) continue;
    const dirPath = path.join(PROJECTS_DIR, projectName);
    let projectStats = result.byProject[projectName] || { inputTokens: 0, outputTokens: 0, cost: 0 };

    function scanDir(dir) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) { scanDir(full); continue; }
          if (!entry.name.endsWith('.jsonl')) continue;
          const stats = parseJsonlFile(full);
          if (!stats) continue;
          result.filesScanned++;
          const cost = costFor(stats.inputTokens, stats.outputTokens, stats.model);
          result.total.inputTokens += stats.inputTokens;
          result.total.outputTokens += stats.outputTokens;
          result.total.cost += cost;
          projectStats.inputTokens += stats.inputTokens;
          projectStats.outputTokens += stats.outputTokens;
          projectStats.cost += cost;
          const modelKey = estimateModel(stats.model);
          if (!result.byModel[modelKey]) result.byModel[modelKey] = { inputTokens: 0, outputTokens: 0, cost: 0 };
          result.byModel[modelKey].inputTokens += stats.inputTokens;
          result.byModel[modelKey].outputTokens += stats.outputTokens;
          result.byModel[modelKey].cost += cost;
          const ts = stats.timestamp ? new Date(stats.timestamp).getTime() : null;
          if (ts != null && !isNaN(ts)) {
            if (ts >= todayMs) { result.today.inputTokens += stats.inputTokens; result.today.outputTokens += stats.outputTokens; result.today.cost += cost; }
            if (ts >= weekMs) { result.week.inputTokens += stats.inputTokens; result.week.outputTokens += stats.outputTokens; result.week.cost += cost; }
            if (ts >= monthMs) { result.month.inputTokens += stats.inputTokens; result.month.outputTokens += stats.outputTokens; result.month.cost += cost; }
          }
        }
      } catch {}
    }

    scanDir(dirPath);
    if (projectStats.inputTokens > 0 || projectStats.outputTokens > 0) {
      result.byProject[projectName] = projectStats;
    }
  }
  return result;
}

function renderUsage(jsonMode, projectFilter) {
  const data = collectUsage(projectFilter);
  if (jsonMode) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    return data;
  }
  process.stdout.write('\n' + c.bold('  ' + ICON.chart + ' Usage Report') + '\n');
  if (data.filesScanned === 0) {
    process.stdout.write('\n  ' + c.dim('No session data found. Run Claude Code first to generate usage.') + '\n\n');
    return data;
  }
  const fmt = (s) => {
    const tokens = s.inputTokens + s.outputTokens;
    return humanNumber(tokens) + ' tokens (~$' + s.cost.toFixed(2) + ')';
  };
  process.stdout.write('\n');
  process.stdout.write('  ' + c.bold('Today:'.padEnd(16)) + ' ' + c.cyan(fmt(data.today)) + '\n');
  process.stdout.write('  ' + c.bold('This Week:'.padEnd(16)) + ' ' + c.cyan(fmt(data.week)) + '\n');
  process.stdout.write('  ' + c.bold('This Month:'.padEnd(16)) + ' ' + c.cyan(fmt(data.month)) + '\n');
  process.stdout.write('  ' + c.bold('Total:'.padEnd(16)) + ' ' + c.dim(fmt(data.total)) + '\n');
  const projects = Object.entries(data.byProject)
    .sort((a, b) => (b[1].inputTokens + b[1].outputTokens) - (a[1].inputTokens + a[1].outputTokens));
  if (projects.length > 0) {
    const totalTokens = projects.reduce((acc, [, s]) => acc + s.inputTokens + s.outputTokens, 0);
    process.stdout.write('\n' + c.bold('  By Project:') + '\n');
    process.stdout.write(tree(projects.map(([name, s]) => {
      const tokens = s.inputTokens + s.outputTokens;
      const pct = totalTokens > 0 ? Math.round((tokens / totalTokens) * 100) : 0;
      const short = name.length > 28 ? name.slice(0, 25) + '...' : name;
      return c.cyan(short.padEnd(30)) + String(pct).padStart(3) + '% (' + humanNumber(tokens) + ' tokens)';
    })) + '\n');
  }
  const models = Object.entries(data.byModel)
    .sort((a, b) => (b[1].inputTokens + b[1].outputTokens) - (a[1].inputTokens + a[1].outputTokens));
  if (models.length > 0) {
    const totalTokens = models.reduce((acc, [, s]) => acc + s.inputTokens + s.outputTokens, 0);
    process.stdout.write('\n' + c.bold('  By Model:') + '\n');
    process.stdout.write(tree(models.map(([name, s]) => {
      const tokens = s.inputTokens + s.outputTokens;
      const pct = totalTokens > 0 ? Math.round((tokens / totalTokens) * 100) : 0;
      return c.magenta(name.padEnd(20)) + String(pct).padStart(3) + '%';
    })) + '\n');
  }
  process.stdout.write('\n' + c.dim('  Cost estimates are approximate. Not actual billing data.') + '\n');
  process.stdout.write(c.dim('  Scanned ' + data.filesScanned + ' session file(s).') + '\n\n');
  return data;
}

module.exports = { collectUsage, renderUsage, parseJsonlFile, costFor, estimateModel };
