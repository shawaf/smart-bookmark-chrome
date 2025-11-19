#!/usr/bin/env node
/**
 * Generates PNG icons for the extension without committing binary assets.
 * This keeps the repository text-only while still allowing Chrome to load
 * the required icons when you run this script.
 */
const fs = require('fs');
const path = require('path');

const ICON_DATA = require('../src/icon-base64.json');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

Object.entries(ICON_DATA).forEach(([size, b64]) => {
  const filename = path.join(assetsDir, `icon${size}.png`);
  const buffer = Buffer.from(b64, 'base64');
  fs.writeFileSync(filename, buffer);
  console.log(`Generated ${filename}`);
});

console.log('\nIcons ready. Update your loaded extension or package the zip including the assets folder.');
