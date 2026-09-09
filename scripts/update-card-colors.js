import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const targetFiles = [
  'index.html',
  'collections/drone-parts.html',
  'collections/drones-and-accessories.html',
  'products/aeromini-4k-pocket-drone.html',
  'products/aeroscout-hexa-enterprise-drone.html',
  'products/microglow-nano-indoor-drone.html',
  'products/skymaster-pro-cinex-quadcopter.html',
  'products/vortex-fpv-6s-racing-drone.html'
];

let totalReplacements = 0;

for (const relPath of targetFiles) {
  const filePath = path.join(rootDir, relPath);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf-8');
  const count = (content.match(/#FFFFE4/gi) || []).length;

  if (count > 0) {
    content = content.replace(/#FFFFE4/gi, '#f5FDFF');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Updated ${relPath}: ${count} occurrences replaced with #f5FDFF.`);
    totalReplacements += count;
  }
}

console.log(`\nDone! Total ${totalReplacements} product card backgrounds updated to #f5FDFF.`);
