/**
 * Check that all .woff2 files in public/fonts/ start with the wOF2 magic bytes.
 * Run with: node scripts/check-fonts.mjs
 * Exits with code 1 if any file fails.
 */

import fs from 'fs';
import path from 'path';

const fontsDir = path.join(process.cwd(), 'public', 'fonts');
const fontFiles = [
  'Inter-VariableFont_wght.woff2',
  'InstrumentSerif-Regular.woff2',
  'InstrumentSerif-Italic.woff2',
  'JetBrainsMono-VariableFont_wght.woff2',
];

const WOFF2_MAGIC = Buffer.from([0x77, 0x4f, 0x46, 0x32]); // wOF2

let allOk = true;

for (const file of fontFiles) {
  const filePath = path.join(fontsDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: ${file} - FILE NOT FOUND`);
    allOk = false;
    continue;
  }
  
  const buffer = Buffer.alloc(4);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);
  
  if (buffer.equals(WOFF2_MAGIC)) {
    console.log(`OK: ${file} - valid woff2 (starts with wOF2)`);
  } else {
    console.error(`FAIL: ${file} - does not start with wOF2 (got: ${buffer.toString('hex')})`);
    allOk = false;
  }
}

if (allOk) {
  console.log('\nAll font files are valid woff2 files.');
  process.exit(0);
} else {
  console.error('\nSome font files are invalid.');
  process.exit(1);
}