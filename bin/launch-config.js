#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => 
  new Promise((resolve) => rl.question(query, resolve));

async function run() {
  console.log(`\n${colors.bright}${colors.cyan}🚀 Launch Configuration Generator${colors.reset}\n`);

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`${colors.red}❌ Error: Root directory not detected.${colors.reset}`);
    process.exit(1);
  }

  const launchJsonPath = path.join(process.cwd(), 'launch.json');
  let config = {
    redirects: [],
    rewrites: [],
    cache: {
      cachePriming: {
        urls: []
      }
    }
  };

  if (fs.existsSync(launchJsonPath)) {
    console.log(`${colors.yellow}ℹ️  Existing launch.json found. We will merge your changes.${colors.reset}\n`);
    try {
      const existingConfig = JSON.parse(fs.readFileSync(launchJsonPath, 'utf-8'));
      
      // Preserve everything, but ensure our managed fields are initialized as arrays/objects
      config = {
        ...existingConfig,
        redirects: existingConfig.redirects || [],
        rewrites: existingConfig.rewrites || [],
        cache: {
          ...(existingConfig.cache || {}),
          cachePriming: {
            ...(existingConfig.cache?.cachePriming || {}),
            urls: existingConfig.cache?.cachePriming?.urls || []
          }
        }
      };
    } catch (e) {
      console.log(`${colors.red}⚠️  Error parsing existing launch.json. Starting with a fresh config.${colors.reset}\n`);
    }
  }

  // 1. Redirects
  while (true) {
    const addRedirect = await question(`Do you want to add a Redirect?${config.redirects.length > 0 ? ' another?' : ''} (y/n): `);
    if (addRedirect.toLowerCase() !== 'y') break;
    
    const source = await question('   Source path (e.g., /source): ');
    const destination = await question('   Destination path (e.g., /destination): ');
    const code = await question('   Status code (default 308): ');
    config.redirects.push({
      source,
      destination,
      statusCode: parseInt(code) || 308
    });
    console.log(`${colors.green}   ✔ Redirect added.${colors.reset}`);
  }

  // 2. Rewrites
  while (true) {
    const addRewrite = await question(`Do you want to add a Rewrite?${config.rewrites.length > 0 ? ' another?' : ''} (y/n): `);
    if (addRewrite.toLowerCase() !== 'y') break;

    const source = await question('   Source path (e.g., /api/*): ');
    const destination = await question('   Destination URL: ');
    config.rewrites.push({ source, destination });
    console.log(`${colors.green}   ✔ Rewrite added.${colors.reset}`);
  }

  // 3. Cache Priming
  const addPrime = await question('Do you want to add Cache Priming URLs? (y/n): ');
  if (addPrime.toLowerCase() === 'y') {
    console.log(`${colors.cyan}Note: Only relative paths are supported. No Regex/Wildcards.${colors.reset}`);
    const urls = await question('Enter URLs separated by commas (e.g., /home,/about,/shop): ');
    const urlList = urls.split(',').map(u => u.trim()).filter(u => u);
    config.cache.cachePriming.urls = [...new Set([...(config.cache.cachePriming.urls || []), ...urlList])];
  }

  // Clean up empty fields before writing
  if (config.redirects && config.redirects.length === 0) delete config.redirects;
  if (config.rewrites && config.rewrites.length === 0) delete config.rewrites;
  
  if (config.cache) {
    if (config.cache.cachePriming && config.cache.cachePriming.urls && config.cache.cachePriming.urls.length === 0) {
      delete config.cache.cachePriming;
    }
    if (Object.keys(config.cache).length === 0) {
      delete config.cache;
    }
  }

  fs.writeFileSync(launchJsonPath, JSON.stringify(config, null, 2));
  console.log(`\n${colors.green}✅ Successfully updated launch.json!${colors.reset}\n`);
  
  rl.close();
}

run();
