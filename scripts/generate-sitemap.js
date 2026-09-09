import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const BASE_URL = 'https://droneverse.in';

// 1. GENERATE ROBOTS.TXT
const robotsContent = `# Robots.txt for DroneVerse (https://droneverse.in)
User-agent: *
Allow: /
Allow: /collections/
Allow: /products/
Allow: /blogs/
Allow: /pages/
Allow: /policies/

# Disallow private user states and serverless API functions
Disallow: /admin/
Disallow: /account/
Disallow: /cart.html
Disallow: /checkout.html
Disallow: /api/

Sitemap: ${BASE_URL}/sitemap.xml
`;

fs.writeFileSync(path.join(rootDir, 'robots.txt'), robotsContent, 'utf-8');
console.log('✓ robots.txt generated successfully.');

// 2. DISCOVER HTML FILES FOR SITEMAP
function getHtmlFiles(dir, prefix = '') {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;

    // Ignore excluded folders
    if (entry.isDirectory()) {
      if (['node_modules', 'studio', 'dist', '.git', 'scripts', 'api', 'admin', 'account'].includes(entry.name)) {
        continue;
      }
      results = results.concat(getHtmlFiles(fullPath, relPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      // Exclude cart and checkout from search indexing
      if (['cart.html', 'checkout.html'].includes(relPath)) {
        continue;
      }
      results.push(relPath.replace(/\\/g, '/'));
    }
  }
  return results;
}

const htmlFiles = getHtmlFiles(rootDir);

// Priority and frequency assignment
function getPriorityAndFreq(file) {
  if (file === 'index.html') return { priority: '1.0', changefreq: 'daily' };
  if (file.startsWith('collections/')) return { priority: '0.8', changefreq: 'weekly' };
  if (file.startsWith('products/')) return { priority: '0.9', changefreq: 'weekly' };
  if (file.startsWith('blogs/')) return { priority: '0.7', changefreq: 'monthly' };
  if (file.startsWith('policies/')) return { priority: '0.3', changefreq: 'yearly' };
  return { priority: '0.6', changefreq: 'monthly' };
}

const today = new Date().toISOString().split('T')[0];

const urlEntries = htmlFiles.map(file => {
  const urlPath = file === 'index.html' ? '' : file;
  const { priority, changefreq } = getPriorityAndFreq(file);
  return `  <url>
    <loc>${BASE_URL}/${urlPath}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join('\n');

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemapContent, 'utf-8');
console.log(`✓ sitemap.xml generated with ${htmlFiles.length} pages indexed.`);
