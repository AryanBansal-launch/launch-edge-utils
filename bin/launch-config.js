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
  const redirectMode = await question(`How would you like to add redirects?\n   1) One by one (interactive)\n   2) Bulk import from CSV file\n   3) Bulk import from JSON file\n   4) Skip\nChoose (1-4): `);
  
  if (redirectMode === '1') {
    // Interactive mode
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
  } else if (redirectMode === '2') {
    // CSV import
    const csvPath = await question('   Enter CSV file path (e.g., ./redirects.csv): ');
    try {
      const csvContent = fs.readFileSync(path.resolve(csvPath), 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Skip header if present
      const startIndex = lines[0].toLowerCase().includes('source') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const [source, destination, statusCode] = lines[i].split(',').map(s => s.trim());
        if (source && destination) {
          config.redirects.push({
            source,
            destination,
            statusCode: parseInt(statusCode) || 308
          });
        }
      }
      console.log(`${colors.green}   ✔ Imported ${lines.length - startIndex} redirects from CSV.${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}   ✖ Error reading CSV file: ${error.message}${colors.reset}`);
    }
  } else if (redirectMode === '3') {
    // JSON import
    const jsonPath = await question('   Enter JSON file path (e.g., ./redirects.json): ');
    try {
      const jsonContent = fs.readFileSync(path.resolve(jsonPath), 'utf-8');
      const redirects = JSON.parse(jsonContent);
      
      if (Array.isArray(redirects)) {
        config.redirects.push(...redirects);
        console.log(`${colors.green}   ✔ Imported ${redirects.length} redirects from JSON.${colors.reset}`);
      } else {
        console.log(`${colors.red}   ✖ JSON file must contain an array of redirect objects.${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}   ✖ Error reading JSON file: ${error.message}${colors.reset}`);
    }
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
