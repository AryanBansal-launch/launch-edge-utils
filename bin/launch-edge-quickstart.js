#!/usr/bin/env node
/**
 * One-command local edge dev: scaffold + seed + run, with a status report.
 *
 * Ensures functions/[proxy].edge.js, functions/dev-worker.edge.js,
 * wrangler.toml, and launch.json all exist (creating only what's missing —
 * an existing handler or config is never touched), seeds the local KV from
 * launch.json, prints what's configured for each edge feature, then starts
 * the dev server (which auto-primes the cache once ready).
 *
 * Equivalent to running, in order:
 *   npx launch-edge-local   (non-interactively, with sensible defaults)
 *   npx launch-edge-seed-local
 *   npx launch-edge-test-local
 */
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  kvSampleHandlerTemplate,
  devWorkerTemplate,
  wranglerTemplate,
  quickstartLaunchConfig
} from './lib/scaffold-templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

const cwd = process.cwd();
const packageJsonPath = path.join(cwd, 'package.json');
const functionsDir = path.join(cwd, 'functions');
const edgeFile = path.join(functionsDir, '[proxy].edge.js');
const devWorkerFile = path.join(functionsDir, 'dev-worker.edge.js');
const wranglerTomlPath = path.join(cwd, 'wrangler.toml');
const launchJsonPath = path.join(cwd, 'launch.json');

console.log(`\n${colors.bright}${colors.cyan}🚀 launch-edge-quickstart — one-command local edge dev${colors.reset}\n`);

if (!fs.existsSync(packageJsonPath)) {
  console.log(`${colors.red}❌ No package.json here.${colors.reset} Run this from your project root.\n`);
  process.exit(1);
}

// --- 1. Scaffold: create only what's missing; never touch existing files ---

console.log(`${colors.bright}Scaffolding${colors.reset}`);

if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
  console.log(`  ${colors.green}✨${colors.reset} Created /functions`);
}

let handlerStatus;
if (!fs.existsSync(edgeFile)) {
  // Self-contained demo handler: serves the sample redirect/rewrite/cache-priming
  // routes below itself (with Cache-Control set), so the very first run works
  // with no backend app running. For the full production-style handler (auth,
  // bot-block, geo, RSC, etc.) see `npx create-launch-edge` / `npx launch-edge-local`.
  fs.writeFileSync(edgeFile, kvSampleHandlerTemplate + '\n');
  console.log(`  ${colors.green}✨${colors.reset} Created functions/[proxy].edge.js (self-contained demo handler)`);
  handlerStatus = 'created';
} else {
  console.log(`  ${colors.blue}ℹ${colors.reset}  functions/[proxy].edge.js already exists — left unchanged`);
  handlerStatus = 'existing';
}

if (!fs.existsSync(devWorkerFile)) {
  fs.writeFileSync(devWorkerFile, devWorkerTemplate + '\n');
  console.log(`  ${colors.green}✨${colors.reset} Created functions/dev-worker.edge.js (KV-aware local shim)`);
} else {
  console.log(`  ${colors.blue}ℹ${colors.reset}  functions/dev-worker.edge.js already exists — left unchanged`);
}

let wranglerHasKV = true;
if (!fs.existsSync(wranglerTomlPath)) {
  fs.writeFileSync(wranglerTomlPath, wranglerTemplate);
  console.log(`  ${colors.green}✨${colors.reset} Created wrangler.toml (KV binding + BACKEND_URL)`);
} else {
  console.log(`  ${colors.blue}ℹ${colors.reset}  wrangler.toml already exists — left unchanged`);
  const existingToml = fs.readFileSync(wranglerTomlPath, 'utf-8');
  wranglerHasKV = /\[\[kv_namespaces\]\]/.test(existingToml);
  if (!wranglerHasKV) {
    console.log(
      `     ${colors.yellow}⚠${colors.reset}  No [[kv_namespaces]] binding found — redirects/rewrites/cache priming` +
        `\n        will stay inactive until you add one (see wrangler.toml in a fresh scaffold for reference).`
    );
  }
}

let launchConfig;
let launchJsonStatus;
if (!fs.existsSync(launchJsonPath)) {
  fs.writeFileSync(launchJsonPath, JSON.stringify(quickstartLaunchConfig, null, 2) + '\n');
  console.log(`  ${colors.green}✨${colors.reset} Created launch.json (sample redirects + rewrites + cache priming)`);
  launchConfig = quickstartLaunchConfig;
  launchJsonStatus = 'created';
} else {
  console.log(`  ${colors.blue}ℹ${colors.reset}  launch.json already exists — using it as-is`);
  launchJsonStatus = 'existing';
  try {
    launchConfig = JSON.parse(fs.readFileSync(launchJsonPath, 'utf-8'));
  } catch (err) {
    console.log(`  ${colors.red}✖${colors.reset}  Could not parse launch.json: ${err.message}`);
    launchConfig = {};
  }
}

// --- 2. Seed local KV from launch.json ---

console.log(`\n${colors.bright}Seeding local KV${colors.reset} (from launch.json)`);

const hasSeedableConfig =
  (Array.isArray(launchConfig.redirects) && launchConfig.redirects.length > 0) ||
  (Array.isArray(launchConfig.rewrites) && launchConfig.rewrites.length > 0) ||
  Boolean(launchConfig.cache?.cachePriming?.urls?.length);

if (!wranglerHasKV) {
  console.log(`  ${colors.blue}ℹ${colors.reset}  Skipped — wrangler.toml has no KV binding.`);
} else if (!hasSeedableConfig) {
  console.log(`  ${colors.blue}ℹ${colors.reset}  Skipped — launch.json has no redirects, rewrites, or cache priming URLs.`);
} else {
  const seedResult = spawnSync(
    process.execPath,
    [path.join(__dirname, 'launch-edge-seed-local.js')],
    { cwd, env: process.env, stdio: ['inherit', 'pipe', 'pipe'] }
  );
  const seedOut = (seedResult.stdout || '').toString() + (seedResult.stderr || '').toString();
  seedOut
    .split('\n')
    .filter((l) => l.trim())
    .forEach((line) => console.log(`  ${colors.dim}${line}${colors.reset}`));
  if (seedResult.status !== 0) {
    console.log(`  ${colors.red}✖${colors.reset}  Seeding failed — continuing, but KV-backed features may be empty.`);
  }
}

// --- 3. Status report: what's configured, and how to try it ---

console.log(`\n${colors.bright}${colors.green}Ready — here's what's configured${colors.reset}\n`);

console.log(
  `  ${colors.bright}Handler:${colors.reset} functions/[proxy].edge.js (${handlerStatus === 'created' ? 'self-contained demo handler' : 'your existing handler'})`
);
console.log(
  `  ${colors.bright}Config:${colors.reset}  launch.json (${launchJsonStatus === 'created' ? 'sample data' : 'your existing config'})\n`
);

const redirects = Array.isArray(launchConfig.redirects) ? launchConfig.redirects : [];
const rewrites = Array.isArray(launchConfig.rewrites) ? launchConfig.rewrites : [];
const primeUrls = launchConfig.cache?.cachePriming?.urls ?? [];

function featureLine(label, ok, detail) {
  const mark = ok ? `${colors.green}✔${colors.reset}` : `${colors.dim}—${colors.reset}`;
  console.log(`  ${mark} ${colors.bright}${label}${colors.reset}${detail ? `  ${colors.dim}${detail}${colors.reset}` : ''}`);
}

featureLine(
  'Redirects',
  redirects.length > 0,
  redirects.length > 0 ? `${redirects.length} rule(s) configured` : 'none configured — add to launch.json .redirects'
);
if (redirects[0]) {
  console.log(`      ${colors.cyan}curl -i http://localhost:8787${redirects[0].source}${colors.reset}  ${colors.dim}→ ${redirects[0].statusCode ?? 301} to ${redirects[0].destination}${colors.reset}`);
}

featureLine(
  'Rewrites',
  rewrites.length > 0,
  rewrites.length > 0 ? `${rewrites.length} rule(s) configured` : 'none configured — add to launch.json .rewrites'
);
if (rewrites[0]) {
  console.log(`      ${colors.cyan}curl --compressed http://localhost:8787${rewrites[0].source.replace('*', 'example')}${colors.reset}  ${colors.dim}→ serves ${rewrites[0].destination.replace('*', 'example')}, URL unchanged${colors.reset}`);
}

featureLine(
  'Cache priming',
  primeUrls.length > 0,
  primeUrls.length > 0 ? `${primeUrls.length} URL(s), auto-primed on startup` : 'none configured — add to launch.json .cache.cachePriming.urls'
);
if (primeUrls[0]) {
  console.log(`      ${colors.cyan}curl -i http://localhost:8787${primeUrls[0]}${colors.reset}  ${colors.dim}→ X-Cache: HIT once warmed (needs a cacheable response)${colors.reset}`);
}

if (handlerStatus === 'created') {
  console.log(
    `\n  ${colors.bright}Handler:${colors.reset} ${colors.dim}the demo handler above also serves ${colors.reset}${colors.cyan}GET /api/edge-ping${colors.reset}${colors.dim} (JSON) and\n  passes anything else to BACKEND_URL. For the full production-style handler (auth, geo,\n  bot-block, RSC, security), run ${colors.reset}${colors.bright}npx create-launch-edge${colors.reset}${colors.dim} in a fresh project instead.${colors.reset}`
  );
} else {
  console.log(
    `\n  ${colors.bright}Your handler's own logic${colors.reset} ${colors.dim}(auth, geo, bot-block, RSC, JSON routes, etc.) lives in\n  functions/[proxy].edge.js and runs on every request, in addition to the above.${colors.reset}`
  );
}

console.log(`\n  ${colors.bright}Backend:${colors.reset} start your app on the ${colors.cyan}BACKEND_URL${colors.reset} in wrangler.toml (default ${colors.yellow}http://127.0.0.1:3000${colors.reset}) for passthrough routes to work.`);

console.log(`\n${colors.bright}Starting the dev server…${colors.reset} ${colors.dim}(edit launch.json + re-run this command any time to update)${colors.reset}\n`);

// --- 4. Run: launch-edge-test-local (wrangler dev + startup auto-prime) ---

const child = spawn(
  process.execPath,
  [path.join(__dirname, 'launch-edge-test-local.js'), ...process.argv.slice(2)],
  { stdio: 'inherit', cwd, env: process.env }
);

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
