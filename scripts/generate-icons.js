#!/usr/bin/env node
/**
 * Generates PNG icons for the extension without committing binary assets.
 * This keeps the repository text-only while still allowing Chrome to load
 * the required icons when you run this script.
 */
const fs = require('fs');
const path = require('path');

const ICON_DATA = {
  16: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHUlEQVR4nGOM6vj/n4ECwESJ5lEDRg0YNWAwGQAA61IDABzd/usAAAAASUVORK5CYII=',
  48: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAVUlEQVR4nO3PQQ3AIADAQEAbrvCHrU3EHpclPQXt3Pc848eWDviqAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0B7QX0YgLk9Tu7/AAAAABJRU5ErkJggg==',
  128: 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABT0lEQVR4nO3SQQEAEADAQPRTXClieOwuwR6b9+w7yFq/A/jLAHEGiDNAnAHiDBBngDgDxBkgzgBxBogzQJwB4gwQZ4A4A8QZIM4AcQaIM0CcAeIMEGeAOAPEGSDOAHEGiDNAnAHiDBBngDgDxBkgzgBxBogzQJwB4gwQZ4A4A8QZIM4AcQaIM0CcAeIMEGeAOAPEGSDOAHEGiDNAnAHiDBBngDgDxBkgzgBxBogzQJwB4gwQZ4A4A8QZIM4AcQaIM0CcAeIMEGeAOAPEGSDOAHEGiDNAnAHiDBBngDgDxBkgzgBxBogzQJwB4gwQZ4A4A8QZIM4AcQaIM0CcAeIMEGeAOAPEGSDOAHEGiDNAnAHiDBBngLgH+WMEFeRgcXYAAAAASUVORK5CYII='
};

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
