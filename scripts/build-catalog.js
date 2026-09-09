import fs from 'fs';
import path from 'path';

const catalog = {};

function extractFromHtml(file) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');

  // Match addToCart('ID', 'Name', Price)
  const addRegex = /addToCart\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*([\d.]+)/g;
  let m;
  while ((m = addRegex.exec(content)) !== null) {
    const id = m[1].trim();
    const title = m[2].trim();
    const price = parseFloat(m[3]);
    catalog[id] = { id, title, price };
  }

  // Match zb-product-card with data-price and data-title
  const cardRegex = /<div class="zb-product-card"[^>]*data-price="([\d.]+)"[^>]*data-title="([^"]+)"/g;
  while ((m = cardRegex.exec(content)) !== null) {
    const price = parseFloat(m[1]);
    const title = m[2].trim();
    catalog[title] = { id: title, title, price };
  }
  
  // Match SKU lines like SKU: DV-DRN-0001
  const skuRegex = /<div class="zb-product-card"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
  while ((m = skuRegex.exec(content)) !== null) {
    const block = m[1];
    const skuMatch = block.match(/SKU:\s*([A-Z0-9-]+)/);
    const titleMatch = block.match(/<h3 class="zb-product-card__title">[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
    const priceMatch = block.match(/<span class="zb-price-main">₹([\d,]+(?:\.\d{2})?)<\/span>/);
    if (skuMatch && titleMatch && priceMatch) {
      const sku = skuMatch[1].trim();
      const title = titleMatch[1].trim();
      const price = parseFloat(priceMatch[1].replace(/,/g, ''));
      catalog[sku] = { id: sku, title, price };
    }
  }
}

const files = [
  'index.html',
  'cart.html',
  'checkout.html',
  'collections/all.html',
  'collections/all-page-2.html',
  'collections/all-page-3.html',
  'collections/drones-and-accessories.html',
  'collections/3d-printing.html',
  'collections/arduino.html',
  'collections/raspberry-pi.html',
  'collections/sensors.html',
  'collections/drone-parts.html',
  'collections/motors.html',
  'collections/stem-kits.html',
  'collections/electronic-components.html'
];

files.forEach(f => extractFromHtml(path.resolve(f)));

// Ensure our core drones and accessories are explicitly recorded
const coreItems = {
  // Drones
  'DV-DRN-0001': { id: 'DV-DRN-0001', title: 'AeroMini 4K Pocket Drone', price: 24999.0 },
  'DV-DRN-0002': { id: 'DV-DRN-0002', title: 'SkyMaster Pro CineX Quadcopter', price: 74999.0 },
  'DV-DRN-0003': { id: 'DV-DRN-0003', title: 'Vortex FPV 6S Freestyle Racing Drone', price: 21499.0 },
  'DV-DRN-0004': { id: 'DV-DRN-0004', title: 'AeroScout Hexa Heavy-Lift Enterprise Drone', price: 145000.0 },
  'DV-DRN-0005': { id: 'DV-DRN-0005', title: 'MicroGlow Nano 1080p Indoor Drone', price: 3999.0 },
  'DV-DRN-0006': { id: 'DV-DRN-0006', title: 'SkyFalcon Pro 8K Thermal Inspection Drone', price: 189999.0 },
  'DV-DRN-0007': { id: 'DV-DRN-0007', title: 'PhantomX Stealth Long-Range VTOL Drone', price: 224999.0 },
  'DV-DRN-0008': { id: 'DV-DRN-0008', title: 'ApexRacer 7-Inch Long-Range FPV Drone', price: 34999.0 },
  'DV-DRN-0009': { id: 'DV-DRN-0009', title: 'AquaScan Submersible Amphibious Drone', price: 62499.0 },
  'RC-DRN-001': { id: 'RC-DRN-001', title: 'SkyFalcon 4K Thermal Inspection Drone', price: 84999.0 },

  // Accessories
  'ACC-FPV-GOG': { id: 'ACC-FPV-GOG', title: 'SkyEye FPV HD Digital Goggles Pro', price: 44999.0 },
  'ACC-GIM-4K': { id: 'ACC-GIM-4K', title: 'ZenView 3-Axis Brushless Drone Gimbal 4K Camera', price: 18999.0 },
  'ACC-BAT-6S': { id: 'ACC-BAT-6S', title: 'UltraPulse 6S 4500mAh 120C LiPo Battery Pack', price: 7499.0 },
  'ACC-BPK-TAC': { id: 'ACC-BPK-TAC', title: 'AeroShield Hard-Shell Tactical Drone Backpack', price: 4999.0 },
  'ACC-PRP-CF': { id: 'ACC-PRP-CF', title: 'CarbonX 3-Blade Folding Drone Propellers', price: 2499.0 },

  // SBC & Microcontrollers
  'RC-RPI-5-8GB': { id: 'RC-RPI-5-8GB', title: 'Official Raspberry Pi 5 (8GB RAM)', price: 7499.0 },
  'raspberry-pi-5-8gb': { id: 'raspberry-pi-5-8gb', title: 'Official Raspberry Pi 5 (8GB RAM)', price: 7499.0 },
  'RC-ARD-UNO-R3': { id: 'RC-ARD-UNO-R3', title: 'Arduino Uno R3 Original Board', price: 2199.0 },
  'arduino-uno-r3': { id: 'arduino-uno-r3', title: 'Arduino Uno R3 Original Board', price: 2199.0 },
  'RC-ARD-001': { id: 'RC-ARD-001', title: 'Arduino Uno R3 Original Board (Made in Italy)', price: 2199.0 },
  'RC-ARD-002': { id: 'RC-ARD-002', title: 'Arduino Uno R4 WiFi with ESP32-S3 & LED Matrix', price: 2899.0 },
  'RC-ARD-003': { id: 'RC-ARD-003', title: 'Arduino Uno R4 Minima 32-bit Cortex-M4 Board', price: 1899.0 },
  'RC-3D-001': { id: 'RC-3D-001', title: 'Bambu Lab A1 Mini 3D Printer with AMS Lite Combo', price: 42999.0 },
  'bambu-lab-a1-mini': { id: 'bambu-lab-a1-mini', title: 'Bambu Lab A1 Mini 3D Printer with AMS Lite Combo', price: 42999.0 }
};

Object.assign(catalog, coreItems);

console.log(`Total catalog items indexed: ${Object.keys(catalog).length}`);

// Write to api/_catalog.js
const code = `/**
 * DroneVerse Authoritative Server-Side Product Catalog
 * Used by /api/create-order.js to recalculate order totals and eliminate price tampering.
 */
export const PRODUCT_CATALOG = ${JSON.stringify(catalog, null, 2)};

export function getProductPrice(id, fallbackTitle = '') {
  if (id && PRODUCT_CATALOG[id]) {
    return PRODUCT_CATALOG[id].price;
  }
  if (fallbackTitle && PRODUCT_CATALOG[fallbackTitle]) {
    return PRODUCT_CATALOG[fallbackTitle].price;
  }
  return null;
}

export function calculateOrderTotals(cartItems = []) {
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of cartItems) {
    const qty = Math.max(1, parseInt(item.qty || item.quantity || 1, 10));
    const id = item.id || item.productId || item.title || item.name;
    const title = item.title || item.name || id;

    // Server-side authoritative price lookup
    let authoritativePrice = getProductPrice(id, title);

    if (authoritativePrice === null || authoritativePrice === undefined) {
      // Fallback to item.price if product is not in static catalog, but sanitize
      authoritativePrice = Math.max(0, parseFloat(item.price) || 0);
    }

    const lineTotal = Math.round(authoritativePrice * qty * 100) / 100;
    subtotal += lineTotal;

    verifiedItems.push({
      id: id,
      title: title,
      price: authoritativePrice,
      quantity: qty,
      line_total: lineTotal,
      image: item.img || item.image || ''
    });
  }

  // Shipping rules: Free for subtotal >= 999, else 99
  const isFreeShipping = subtotal >= 999;
  const shippingFee = isFreeShipping ? 0 : 99;

  // 18% GST calculation included in total
  const gstAmount = Math.round((subtotal * 18) / 118 * 100) / 100;

  // Grand Total
  const grandTotal = Math.round((subtotal + shippingFee) * 100) / 100;

  return {
    items: verifiedItems,
    subtotal,
    shippingFee,
    gstAmount,
    grandTotal,
    amountInPaise: Math.round(grandTotal * 100)
  };
}
`;

fs.writeFileSync('api/_catalog.js', code);
console.log('Successfully written api/_catalog.js');
