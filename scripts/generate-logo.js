import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateLogos() {
  const inputPath = path.join(__dirname, '../src-tauri/icons/icon.png');
  const outputDir = path.join(__dirname, '../src/assets');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate 64x64
  await sharp(inputPath)
    .resize(64, 64, { fit: 'cover' })
    .png()
    .toFile(path.join(outputDir, 'logo-64.png'));
  console.log('Generated logo-64.png');

  // Generate 128x128
  await sharp(inputPath)
    .resize(128, 128, { fit: 'cover' })
    .png()
    .toFile(path.join(outputDir, 'logo-128.png'));
  console.log('Generated logo-128.png');
}

generateLogos().catch(console.error);