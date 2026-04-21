#!/usr/bin/env node
/**
 * Shortcut for: npx launch-init local
 */
process.argv.splice(2, 0, 'local');
import('./launch-init.js').catch((err) => {
  console.error(err);
  process.exit(1);
});
