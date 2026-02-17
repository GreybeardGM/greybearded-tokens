#!/usr/bin/env node

const { execSync } = require('node:child_process');

const targets = ['styles', 'templates', 'scripts'];
const legacyPatterns = ['gb-', 'gbt-', 'gbt-token-', 'gbt-frames-tools-'];

const joinedTargets = targets.join(' ');
const joinedPatterns = legacyPatterns.map((p) => `-e "${p}"`).join(' ');
const cmd = `rg -n --fixed-strings -g '!scripts/check-legacy-prefixes.js' ${joinedPatterns} ${joinedTargets}`;

try {
  const output = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (output.trim()) {
    console.error('Legacy CSS/UI prefix usage found (expected gbtf- only):');
    console.error(output.trim());
    process.exit(1);
  }
} catch (error) {
  if (error.status === 1) {
    console.log('No legacy CSS/UI prefixes found.');
    process.exit(0);
  }

  console.error('Failed to run legacy prefix check.');
  if (error.stderr) {
    console.error(String(error.stderr).trim());
  }
  process.exit(error.status || 2);
}
