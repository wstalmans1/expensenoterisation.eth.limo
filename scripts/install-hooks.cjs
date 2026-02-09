const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const gitDir = path.join(repoRoot, '.git');

if (!fs.existsSync(gitDir)) {
  process.exit(0);
}

const hooksDir = path.join(gitDir, 'hooks');
if (!fs.existsSync(hooksDir)) {
  fs.mkdirSync(hooksDir, { recursive: true });
}

const hookPath = path.join(hooksDir, 'pre-commit');
const script = `#!/bin/sh\npnpm lint\npnpm compile\n`;

fs.writeFileSync(hookPath, script, 'utf8');
fs.chmodSync(hookPath, 0o755);
