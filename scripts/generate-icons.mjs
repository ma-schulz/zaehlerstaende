// Rasterisiert public/favicon.svg in die PWA-Icon-Größen.
// Nutzung: node scripts/generate-icons.mjs   (benötigt devDependency "sharp")
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public', 'favicon.svg'));

const targets = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

for (const { file, size } of targets) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(root, 'public', file));
  console.log('geschrieben:', file);
}
