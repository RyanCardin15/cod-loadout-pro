#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'dist', 'counterplay-components.umd.js');
const dest = path.join(__dirname, '..', 'public', 'counterplay-components.umd.js');

try {
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    console.log('✓ Copied MCP component bundle to public directory');
  } else if (fs.existsSync(dest)) {
    console.log('✓ MCP component bundle already exists in public directory');
  } else {
    console.warn('⚠ MCP component bundle not found - please run build:mcp first');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Failed to copy MCP component bundle:', error.message);
  process.exit(1);
}
