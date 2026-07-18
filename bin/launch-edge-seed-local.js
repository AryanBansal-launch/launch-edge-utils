#!/usr/bin/env node
/**
 * Seed the local (Miniflare) KV namespace from launch.json, so `wrangler dev`
 * can read your Launch redirect / rewrite / cache-priming config exactly as it
 * would read a real KV namespace in production.
 *
 * Reads launch.json in the current directory and writes three keys into the
 * EDGE_CONFIG namespace (only the sections that are present):
 *   redirects      <- launch.json .redirects
 *   rewrites       <- launch.json .rewrites
 *   cache:priming  <- launch.json .cache.cachePriming
 *
 * Writes to the SAME persist dir that `launch-edge-test-local` reads from
 * (default .wrangler-local). Pass `--persist-to <dir>` to override both.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
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

const BINDING = 'EDGE_CONFIG';

// Keep in sync with the default in launch-edge-test-local.js.
function readPersistFlag(argv) {
  const i = argv.indexOf('--persist-to');
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  return '.wrangler-local';
}
const persistTo = readPersistFlag(process.argv.slice(2));

const cwd = process.cwd();
const launchJsonPath = path.join(cwd, 'launch.json');
if (!fs.existsSync(launchJsonPath)) {
  console.error(
    'No launch.json in the current directory.\n' +
      `  cwd: ${cwd}\n` +
      '  Create one with the local wizard (npx launch-edge-local) or `npx launch-config`.'
  );
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(launchJsonPath, 'utf-8'));
} catch (err) {
  console.error(`Could not parse launch.json: ${err.message}`);
  process.exit(1);
}

// Only seed sections that exist (launch.json strips empty ones).
const entries = [];
if (Array.isArray(config.redirects) && config.redirects.length) {
  entries.push({ key: 'redirects', value: config.redirects });
}
if (Array.isArray(config.rewrites) && config.rewrites.length) {
  entries.push({ key: 'rewrites', value: config.rewrites });
}
if (config.cache?.cachePriming?.urls?.length) {
  entries.push({ key: 'cache:priming', value: config.cache.cachePriming });
}

if (entries.length === 0) {
  console.error(
    'launch.json has no redirects, rewrites, or cache priming URLs to seed.\n' +
      '  Add some with `npx launch-config`, then re-run.'
  );
  process.exit(1);
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'launch-seed-'));
try {
  for (const { key, value } of entries) {
    // Pass the value via a file (--path) to avoid shell-arg size/escaping issues.
    const tmpFile = path.join(tmpDir, key.replace(/[^a-z0-9]/gi, '_') + '.json');
    fs.writeFileSync(tmpFile, JSON.stringify(value));

    const args = [
      wranglerBin,
      'kv',
      'key',
      'put',
      key,
      '--binding',
      BINDING,
      '--local',
      '--persist-to',
      persistTo,
      '--path',
      tmpFile,
    ];
    const res = spawnSync(process.execPath, args, { stdio: 'inherit', cwd, env: process.env });
    if (res.status !== 0) {
      console.error(`Failed to seed key "${key}".`);
      process.exit(res.status ?? 1);
    }
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log(
  `\n✅ Seeded local KV (${BINDING}) from launch.json: ${entries
    .map((e) => e.key)
    .join(', ')}`
);
console.log(`   Persist dir: ${persistTo}  →  now run: npx launch-edge-test-local`);
