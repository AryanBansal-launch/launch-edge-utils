#!/usr/bin/env node
/**
 * Runs `wrangler dev` using the Wrangler bundled with @aryanbansal-launch/edge-utils.
 * Same as `npx wrangler dev`; extra args are passed through (e.g. --port 8788).
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let wranglerBin;
try {
  wranglerBin = require.resolve('wrangler/bin/wrangler.js');
} catch {
  console.error(
    'Could not resolve wrangler. Reinstall @aryanbansal-launch/edge-utils (it bundles wrangler).'
  );
  process.exit(1);
}

const cwd = process.cwd();
const wranglerToml = path.join(cwd, 'wrangler.toml');
if (!fs.existsSync(wranglerToml)) {
  console.error(
    'No wrangler.toml in the current directory.\n' +
      `  cwd: ${cwd}\n` +
      '  Run this from your project root (where wrangler.toml lives), or run the local wizard first:\n' +
      '  npx launch-edge-local'
  );
  process.exit(1);
}

const extraArgs = process.argv.slice(2);
const child = spawn(process.execPath, [wranglerBin, 'dev', ...extraArgs], {
  stdio: 'inherit',
  cwd,
  env: process.env,
});

child.on('error', (err) => {
  console.error(err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
