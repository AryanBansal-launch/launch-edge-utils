#!/usr/bin/env node
/**
 * Seed the local (Miniflare) KV namespace used by `wrangler dev` with the
 * redirect / rewrite / cache-priming config, so the edge worker can read it
 * exactly as it would read a real Cloudflare KV namespace in production.
 *
 * Uses `wrangler kv key put --local`, writing to the SAME persist directory
 * that `npm run dev` reads from (see PERSIST below). Re-run any time you edit
 * the *.json files.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));

let wranglerBin;
try {
  wranglerBin = require.resolve("wrangler/bin/wrangler.js");
} catch {
  console.error("Could not resolve wrangler. Run `npm install` first.");
  process.exit(1);
}

const BINDING = "EDGE_CONFIG";
// Must match the --persist-to used by `npm run dev`.
const PERSIST = ".wrangler-local";

const entries = [
  { key: "redirects", file: "redirects.json" },
  { key: "rewrites", file: "rewrites.json" },
  { key: "cache:priming", file: "cache-priming.json" },
];

for (const { key, file } of entries) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing data file: ${file}`);
    process.exit(1);
  }
  const args = [
    wranglerBin,
    "kv",
    "key",
    "put",
    key,
    "--binding",
    BINDING,
    "--local",
    "--persist-to",
    PERSIST,
    "--path",
    filePath,
  ];
  const res = spawnSync(process.execPath, args, { stdio: "inherit", cwd: dir });
  if (res.status !== 0) {
    console.error(`Failed to seed key "${key}"`);
    process.exit(res.status ?? 1);
  }
}

console.log(`\nSeeded local KV (${BINDING}): ${entries.map((e) => e.key).join(", ")}`);
