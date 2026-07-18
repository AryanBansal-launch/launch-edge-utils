#!/usr/bin/env node
/**
 * Runs `wrangler dev` using the Wrangler bundled with @aryanbansal-launch/edge-utils.
 * Same as `npx wrangler dev`; extra args are passed through (e.g. --port 8788).
 *
 * Once the dev server is ready, it automatically fires a single cache-priming
 * request (GET /__prime), mirroring how Launch warms pages after a deploy — so
 * you don't have to hit /__prime by hand. Pass `--no-prime` to disable this.
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

// `--no-prime` is consumed here (not a wrangler flag) to skip startup priming.
const rawArgs = process.argv.slice(2);
const autoPrime = !rawArgs.includes('--no-prime');
const extraArgs = rawArgs.filter((a) => a !== '--no-prime');

// Default the local persist dir so this shares KV/cache state with
// `launch-edge-seed-local` (which defaults to the same). A user-supplied
// --persist-to is respected and left untouched.
const persistArgs = extraArgs.includes('--persist-to')
  ? []
  : ['--persist-to', '.wrangler-local'];

// Pipe stdout/stderr so we can watch for the "Ready on <url>" line while still
// forwarding everything to the terminal unchanged.
const child = spawn(
  process.execPath,
  [wranglerBin, 'dev', ...persistArgs, ...extraArgs],
  {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd,
    env: process.env,
  }
);

let readyBuf = '';
let primeTriggered = false;

function maybeAutoPrime(chunk) {
  if (!autoPrime || primeTriggered) return;
  readyBuf += chunk.toString();
  const match = readyBuf.match(/Ready on (https?:\/\/[^\s]+)/);
  if (!match) return;
  primeTriggered = true;
  readyBuf = '';

  if (typeof fetch !== 'function') return; // older Node without global fetch
  const base = match[1].replace(/\/$/, '');
  // Give the runtime a beat to finish binding, then warm the cache once.
  setTimeout(() => {
    fetch(`${base}/__prime`)
      .then((res) => (res.ok ? res.json().catch(() => null) : null))
      .then((body) => {
        const n = body && Array.isArray(body.primed) ? body.primed.length : 0;
        if (n > 0) {
          process.stdout.write(
            `\n[launch] Auto-primed ${n} URL(s) from launch.json cache config.\n`
          );
        }
      })
      .catch(() => {
        /* best-effort: app/backend may not be up yet — ignore */
      });
  }, 500);
}

child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  maybeAutoPrime(chunk);
});
child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
  maybeAutoPrime(chunk);
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
