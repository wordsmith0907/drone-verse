/**
 * DroneVerse - Sanity CMS Data Seeder
 * Populates Sanity dataset with products, accessories, categories, hero slides, and site settings.
 * Uses the Sanity Mutations API with SANITY_AUTH_TOKEN.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env from root if present
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          process.env[key] = value.trim();
        }
      });
    }
  } catch (e) {
    console.warn('Could not read .env file:', e.message);
  }
}

loadEnv();

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'ulx4e2rk';
const DATASET = process.env.SANITY_DATASET || 'production';
const TOKEN = process.env.SANITY_AUTH_TOKEN;

if (!TOKEN) {
  console.error('ERROR: SANITY_AUTH_TOKEN is missing in environment variables or .env file.');
  process.exit(1);
}

const CATEGORIES = [
  {
    _id: 'cat-drones-accessories',
    _type: 'category',
    title: 'Drones & Accessories',
    slug: { _type: 'slug', current: 'drones-and-accessories' },
    description: 'Autonomous drones, 8K thermal imaging, long-range VTOL, FPV racing drones, digital goggles, LiPo batteries, and tactical gear.',
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/drone_skyfalcon_thermal_1788934724068',
    featured: true,
    order: 1,
  },
  {
    _id: 'cat-arduino',
    _type: 'category',
    title: 'Arduino & Microcontrollers',
    slug: { _type: 'slug', current: 'arduino' },
    description: 'Official Arduino boards, shields, starter kits, and embedded development microcontrollers.',
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/arduino_uno_r3_hero_1788855681120',
    featured: true,
    order: 2,
  },
  {
    _id: 'cat-raspberry-pi',
    _type: 'category',
    title: 'Raspberry Pi & Single Board Computers',
    slug: { _type: 'slug', current: 'raspberry-pi' },
    description: 'Raspberry Pi 5, Pi 4, Compute Modules, cameras, power supplies, and AI accelerator kits.',
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/raspberry_pi_5_hero_1788855694294',
    featured: true,
    order: 3,
  },
  {
    _id: 'cat-sensors',
    _type: 'category',
    title: 'Sensors & Modules',
    slug: { _type: 'slug', current: 'sensors' },
    description: 'Ultrasonic, LiDAR, IMU gyroscopes, thermal cameras, and biometric sensor modules.',
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/hc_sr04_ultrasonic_sensor_1788855708053',
    featured: true,
    order: 4,
  },
  {
    _id: 'cat-3d-printing',
    _type: 'category',
    title: '3D Printing & Fabrication',
    slug: { _type: 'slug', current: '3d-printing' },
    description: 'High-speed Bambu Lab printers, carbon-fiber filaments, resins, and CNC prototyping tools.',
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/bambu_lab_a1_mini_1788855721868',
    featured: true,
    order: 5,
  },
];

const HERO_SLIDES = [
  {
    _id: 'hero-slide-1',
    _type: 'heroSlide',
    title: 'Explore the Future of Robotics & AI',
    subtitle: 'From industrial automation to autonomous drones, discover cutting-edge components and developer kits.',
    badgeText: 'Official Raspberry Pi & Arduino Reseller',
    buttonText: 'Shop All Hardware',
    buttonLink: '/collections/all.html',
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/banners/hero_drone_showcase_1788855639148',
    order: 1,
    isActive: true,
  },
  {
    _id: 'hero-slide-2',
    _type: 'heroSlide',
    title: 'Next-Generation Autonomous Drones & FPV',
    subtitle: 'High-speed racing frames, RTF cinema copters, 8K thermal payloads, and tactical drone accessories.',
    badgeText: 'Up to 40% Off Premium Flight Kits',
    buttonText: 'Explore Drones & Gear',
    buttonLink: '/collections/drones-and-accessories.html',
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/banners/hero_drone_flight_1788855655075',
    order: 2,
    isActive: true,
  },
  {
    _id: 'hero-slide-3',
    _type: 'heroSlide',
    title: 'Precision 3D Printing & Prototyping',
    subtitle: 'Supercharge your engineering workflow with multi-color high-speed 3D printing and engineering polymers.',
    badgeText: 'Industrial Grade Additive Manufacturing',
    buttonText: 'View 3D Printers',
    buttonLink: '/products/bambu-lab-a1-mini.html',
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/banners/hero_robotics_lab_1788855668045',
    order: 3,
    isActive: true,
  },
  {
    _id: 'hero-slide-4',
    _type: 'heroSlide',
    title: 'Professional Aerial Photography & Cinema Drones',
    subtitle: 'Master the skies with dual 8K imaging, FLIR thermal sensors, and ultra-quiet carbon folding propulsion.',
    badgeText: '8K HDR • Thermal Imaging • 48-Min Flight Time',
    buttonText: 'Discover SkyFalcon Pro',
    buttonLink: '/products/skyfalcon-pro-8k-thermal-drone.html',
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/banners/hero_cinema_drone_1788892166668',
    order: 4,
    isActive: true,
  },
];

const SITE_SETTINGS = {
  _id: 'site-settings',
  _type: 'siteSettings',
  siteName: 'DroneVerse',
  announcementBar: '⚡ FREE SHIPPING! ₹100 OFF ON ₹999 | ₹200 OFF ON ₹2500 | ₹400 OFF ON ₹4900 | Bulk Enquiries / B2B',
  supportPhone: '+91 8123057137',
  supportEmail: 'care@robocraze.com',
  b2bWhatsapp: '+91 8123057137',
  address: 'Ground Floor, 912/10, Survey no. 104, 4th G Street, Chelekare, Kalyan Nagar, Bengaluru, Karnataka 560043',
};

const PRODUCTS = [
  {
    _id: 'prod-skyfalcon-pro-8k-thermal',
    _type: 'product',
    title: 'SkyFalcon Pro 8K Thermal Drone',
    slug: { _type: 'slug', current: 'skyfalcon-pro-8k-thermal-drone' },
    sku: 'DRN-SKY-8KTH',
    price: 189999,
    basePrice: 161016.10,
    oldPrice: 224999,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: '8K THERMAL',
    category: { _type: 'reference', _ref: 'cat-drones-accessories' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/drone_skyfalcon_thermal_1788934724068',
    shortDescription: 'Industrial enterprise inspection quadcopter with dual 8K visible optical zoom and high-sensitivity 640x512 FLIR thermal sensor.',
    specifications: [
      { name: 'Camera', value: 'Dual 8K 50MP Visible + 640x512 FLIR Thermal 30Hz' },
      { name: 'Flight Time', value: 'Up to 48 Minutes' },
      { name: 'Transmission', value: 'OcuSync 4.0 Pro (15 km 1080p Low-Latency)' },
      { name: 'Obstacle Sensing', value: '360° Omnidirectional LiDAR + Binocular Vision' },
      { name: 'Wind Resistance', value: 'Level 7 (15 m/s)' },
    ],
    packageContents: [
      '1x SkyFalcon Pro 8K Thermal Drone',
      '1x High-Brightness 7" Ground Station Controller',
      '2x Intelligent Flight Batteries (6S 5000mAh)',
      '3x Pairs Low-Noise Quick-Release Propellers',
      '1x Waterproof Hard Case',
    ],
    rating: 4.9,
    reviewsCount: 42,
    featured: true,
  },
  {
    _id: 'prod-phantomx-stealth-vtol',
    _type: 'product',
    title: 'PhantomX Stealth VTOL Hybrid Drone',
    slug: { _type: 'slug', current: 'phantomx-stealth-vtol-drone' },
    sku: 'DRN-PHX-VTOL',
    price: 145000,
    basePrice: 122881.36,
    oldPrice: 175000,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: 'VTOL HYBRID',
    category: { _type: 'reference', _ref: 'cat-drones-accessories' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/drone_phantomx_vtol_1788934738929`',
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/drone_phantomx_vtol_1788934738929',
    shortDescription: 'Long-range vertical takeoff and landing (VTOL) fixed-wing mapping drone engineered for precision geospatial surveying.',
    specifications: [
      { name: 'Endurance', value: '95 Minutes Fixed-Wing Cruise' },
      { name: 'Range', value: '35 km Autonomous Mission Radius' },
      { name: 'Wingspan', value: '1800mm Carbon-Kevlar Composite' },
      { name: 'Payload Bay', value: 'Modular Quick-Swap Bay (Up to 1.2 kg)' },
    ],
    rating: 5.0,
    reviewsCount: 19,
    featured: true,
  },
  {
    _id: 'prod-apexracer-7-fpv',
    _type: 'product',
    title: 'ApexRacer 7" Digital FPV Drone',
    slug: { _type: 'slug', current: 'apexracer-7-inch-fpv-drone' },
    sku: 'DRN-APX-7FPV',
    price: 42999,
    basePrice: 36439.83,
    oldPrice: 52999,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: '180 KM/H',
    category: { _type: 'reference', _ref: 'cat-drones-accessories' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/drone_apexracer_fpv_1788934755570',
    shortDescription: 'Pre-tuned 7-inch long-range cinematic freestyle FPV drone equipped with DJI O3 Air Unit, 2806.5 1300KV motors, and F722 stack.',
    specifications: [
      { name: 'Top Speed', value: '180 km/h (112 mph)' },
      { name: 'HD Video', value: 'DJI O3 Air Unit 4K/60fps' },
      { name: 'Flight Controller', value: 'F722 55A BLHeli_32 6S Stack' },
      { name: 'Frame', value: 'Toray 3K Full Carbon Fiber (6mm arms)' },
    ],
    rating: 4.8,
    reviewsCount: 37,
    featured: true,
  },
  {
    _id: 'prod-aquascan-amphibious',
    _type: 'product',
    title: 'AquaScan Amphibious Waterproof Drone',
    slug: { _type: 'slug', current: 'aquascan-amphibious-water-drone' },
    sku: 'DRN-AQU-AMPH',
    price: 79999,
    basePrice: 67795.76,
    oldPrice: 94999,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: 'IP67 SUBMERSIBLE',
    category: { _type: 'reference', _ref: 'cat-drones-accessories' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/drone_aquascan_amphibious_1788934770673',
    shortDescription: 'All-weather waterproof floating drone designed for marine research, search and rescue, aquaculture, and wet-weather photography.',
    specifications: [
      { name: 'Waterproofing', value: 'IP67 Fully Submersible & Floating Body' },
      { name: 'Camera', value: '4K/60fps HDR with Hydrophobic Coated Lens' },
      { name: 'Flight Time', value: '32 Minutes' },
      { name: 'Payload Release', value: 'Integrated 1.5kg Fishing/Rescue Drop Mechanism' },
    ],
    rating: 4.9,
    reviewsCount: 22,
    featured: true,
  },
  {
    _id: 'prod-aeromaster-4k-pro',
    _type: 'product',
    title: 'AeroMaster 4K Professional Drone',
    slug: { _type: 'slug', current: 'aeromaster-4k-pro-drone' },
    sku: 'DRN-AER-4KPR',
    price: 48999,
    basePrice: 41524.58,
    oldPrice: 59999,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: 'HOT',
    category: { _type: 'reference', _ref: 'cat-drones-accessories' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/drone_aeromaster_4k_1788892182061',
    shortDescription: 'Professional aerial cinematography drone featuring a 4K 60FPS mechanical shutter camera and 3-axis stabilized brushless gimbal.',
    specifications: [
      { name: 'Camera', value: '4K 60FPS 1-inch CMOS Sensor' },
      { name: 'Flight Time', value: '38 Minutes' },
      { name: 'Control Range', value: '10 km HD Transmission' },
    ],
    rating: 4.8,
    reviewsCount: 64,
    featured: true,
  },
  {
    _id: 'prod-cinemax-6k-pro',
    _type: 'product',
    title: 'Cinemax 6K Cinema Drone',
    slug: { _type: 'slug', current: 'cinemax-6k-pro-drone' },
    sku: 'DRN-CIN-6KPR',
    price: 124999,
    basePrice: 105931.36,
    oldPrice: 145000,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: 'BESTSELLER',
    category: { _type: 'reference', _ref: 'cat-drones-accessories' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/drone_cinemax_6k_1788892196645',
    shortDescription: 'Hollywood-grade aerial cinema drone capable of 6K ProRes RAW recording with dual-operator support.',
    specifications: [
      { name: 'Resolution', value: '6K 60FPS Apple ProRes RAW' },
      { name: 'Flight Time', value: '42 Minutes' },
      { name: 'Transmission', value: '15 km Triple-Band Ultra-Low Latency' },
    ],
    rating: 5.0,
    reviewsCount: 31,
    featured: true,
  },
  {
    _id: 'prod-vortex-fpv-racing',
    _type: 'product',
    title: 'Vortex FPV Racing Drone RTF',
    slug: { _type: 'slug', current: 'vortex-fpv-racing-drone' },
    sku: 'DRN-VOR-FPVR',
    price: 32499,
    basePrice: 27541.53,
    oldPrice: 39999,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: '140 KM/H',
    category: { _type: 'reference', _ref: 'cat-drones-accessories' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/drone_vortex_fpv_1788892211903',
    shortDescription: 'Ready-to-fly competition racing quadcopter built on a lightweight 5-inch carbon fiber monocoque frame.',
    specifications: [
      { name: 'Speed', value: '140 km/h Top Velocity' },
      { name: 'Motors', value: '2306 2450KV Brushless Motors' },
      { name: 'Video', value: 'Digital HD Micro Camera' },
    ],
    rating: 4.7,
    reviewsCount: 45,
    featured: true,
  },
  {
    _id: 'prod-agroscout-agriculture',
    _type: 'product',
    title: 'AgroScout Precision Agriculture Drone',
    slug: { _type: 'slug', current: 'agroscout-precision-agriculture-drone' },
    sku: 'DRN-AGR-SCT',
    price: 219999,
    basePrice: 186439.83,
    oldPrice: 249999,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: 'ENTERPRISE',
    category: { _type: 'reference', _ref: 'cat-drones-accessories' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/drone_agroscout_sprayer_1788892228308',
    shortDescription: 'Industrial autonomous crop spraying and multispectral field analysis hexacopter with 16L spray tank.',
    specifications: [
      { name: 'Capacity', value: '16 Liter Liquid Payload' },
      { name: 'Coverage', value: 'Up to 25 Acres per Hour' },
      { name: 'Sensors', value: 'Centimeter-Level RTK GPS' },
    ],
    rating: 4.9,
    reviewsCount: 15,
    featured: false,
  },
  {
    _id: 'prod-micropocket-mini',
    _type: 'product',
    title: 'MicroPocket 4K Mini Drone',
    slug: { _type: 'slug', current: 'micropocket-4k-mini-drone' },
    sku: 'DRN-MIC-4KMN',
    price: 18999,
    basePrice: 16100.85,
    oldPrice: 24999,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: '<249G NO REG',
    category: { _type: 'reference', _ref: 'cat-drones-accessories' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/drone_micropocket_mini_1788892244229',
    shortDescription: 'Ultralight sub-249g foldable travel drone with 4K HDR stabilized video and AI smart tracking.',
    specifications: [
      { name: 'Weight', value: '246 grams (No DGCA Registration Req)' },
      { name: 'Video', value: '4K HDR 30fps' },
      { name: 'Flight Time', value: '31 Minutes' },
    ],
    rating: 4.8,
    reviewsCount: 88,
    featured: false,
  },
  {
    _id: 'prod-arduino-uno-r3',
    _type: 'product',
    title: 'Arduino Uno R3',
    slug: { _type: 'slug', current: 'arduino-uno-r3' },
    sku: 'DEV-ARD-UNO3',
    price: 1850,
    basePrice: 1567.80,
    oldPrice: 2199,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: 'BESTSELLER',
    category: { _type: 'reference', _ref: 'cat-arduino' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/arduino_uno_r3_hero_1788855681120',
    shortDescription: 'Original ATmega328P microcontroller board engineered in Italy. The gold standard for embedded electronics.',
    specifications: [
      { name: 'Microcontroller', value: 'ATmega328P (16 MHz)' },
      { name: 'Operating Voltage', value: '5V (Recommended Input 7-12V)' },
      { name: 'Digital I/O Pins', value: '14 (6 PWM outputs)' },
    ],
    rating: 4.9,
    reviewsCount: 142,
    featured: false,
  },
  {
    _id: 'prod-raspberry-pi-5',
    _type: 'product',
    title: 'Raspberry Pi 5 (8GB RAM)',
    slug: { _type: 'slug', current: 'raspberry-pi-5' },
    sku: 'SBC-RPI-58GB',
    price: 7999,
    basePrice: 6778.81,
    oldPrice: 8999,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: 'NEW',
    category: { _type: 'reference', _ref: 'cat-raspberry-pi' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/raspberry_pi_5_hero_1788855694294',
    shortDescription: 'Latest flagship single-board computer featuring quad-core 2.4GHz 64-bit Arm Cortex-A76 and PCIe 2.0 interface.',
    specifications: [
      { name: 'Processor', value: 'Broadcom BCM2712 2.4GHz Cortex-A76' },
      { name: 'Memory', value: '8GB LPDDR4X-4267 SDRAM' },
      { name: 'Video Output', value: 'Dual 4Kp60 HDMI with HDR' },
    ],
    rating: 5.0,
    reviewsCount: 95,
    featured: false,
  },
  {
    _id: 'prod-hc-sr04-ultrasonic',
    _type: 'product',
    title: 'HC-SR04 Ultrasonic Distance Sensor',
    slug: { _type: 'slug', current: 'hc-sr04-ultrasonic-sensor' },
    sku: 'SEN-ULT-HC04',
    price: 125,
    basePrice: 105.93,
    oldPrice: 180,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: 'SALE',
    category: { _type: 'reference', _ref: 'cat-sensors' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/hc_sr04_ultrasonic_sensor_1788855708053',
    shortDescription: 'High precision ultrasonic non-contact ranging module offering 2cm to 400cm measurement range with 3mm accuracy.',
    specifications: [
      { name: 'Ranging Distance', value: '2cm - 400cm' },
      { name: 'Accuracy', value: '3mm' },
      { name: 'Operating Voltage', value: '5V DC' },
    ],
    rating: 4.8,
    reviewsCount: 210,
    featured: false,
  },
  {
    _id: 'prod-bambu-lab-a1-mini',
    _type: 'product',
    title: 'Bambu Lab A1 Mini 3D Printer',
    slug: { _type: 'slug', current: 'bambu-lab-a1-mini' },
    sku: '3DP-BAM-A1MN',
    price: 29999,
    basePrice: 25422.88,
    oldPrice: 34999,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: 'POPULAR',
    category: { _type: 'reference', _ref: 'cat-3d-printing' },
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/bambu_lab_a1_mini_1788855721868',
    shortDescription: 'High-speed desktop 3D printer with active flow rate compensation, full-auto calibration, and whisper-quiet operation.',
    specifications: [
      { name: 'Build Volume', value: '180 x 180 x 180 mm³' },
      { name: 'Max Speed', value: '500 mm/s' },
      { name: 'Nozzle Temp', value: 'Up to 300°C' },
    ],
    rating: 4.9,
    reviewsCount: 76,
    featured: false,
  },
];

const ACCESSORIES = [
  {
    _id: 'acc-skyeye-fpv-goggles',
    _type: 'droneAccessory',
    title: 'SkyEye FPV HD Digital Goggles',
    slug: { _type: 'slug', current: 'skyeye-fpv-hd-digital-goggles' },
    sku: 'ACC-GOG-SKYHD',
    price: 36999,
    basePrice: 31355.08,
    oldPrice: 42999,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: 'OLED 1080P',
    compatibility: ['ApexRacer 7"', 'Vortex FPV', 'DJI O3 Air Unit', 'Universal FPV Systems'],
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/acc_skyeye_goggles_1788934785431',
    shortDescription: 'Premium dual 1080p OLED micro-displays with 100Hz refresh rate, low-latency transmission, and built-in DVR.',
    specifications: [
      { name: 'Display', value: 'Dual 0.49" Micro-OLED 1920x1080' },
      { name: 'Refresh Rate', value: '100Hz' },
      { name: 'FOV', value: '44° Adjustable' },
      { name: 'Latency', value: '< 28ms Digital HD' },
    ],
    rating: 4.9,
    reviewsCount: 29,
    featured: true,
  },
  {
    _id: 'acc-ultrapulse-6s-lipo',
    _type: 'droneAccessory',
    title: 'UltraPulse 6S 4500mAh 120C LiPo Battery',
    slug: { _type: 'slug', current: 'ultrapulse-6s-4500mah-lipo-battery' },
    sku: 'ACC-BAT-6S45',
    price: 6499,
    basePrice: 5507.63,
    oldPrice: 7999,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: '120C BURST',
    compatibility: ['SkyFalcon Pro', 'PhantomX VTOL', 'ApexRacer 7"', 'Heavy-Lift Octocopters'],
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/acc_ultrapulse_lipo_1788934804045',
    shortDescription: 'Ultra-low internal resistance graphene cell pack offering 120C continuous burst current and extended cycle life.',
    specifications: [
      { name: 'Capacity', value: '4500mAh (22.2V / 6S1P)' },
      { name: 'Discharge Rate', value: '120C Continuous / 240C Burst' },
      { name: 'Connector', value: 'Amass XT90-S Anti-Spark' },
      { name: 'Weight', value: '685g' },
    ],
    rating: 4.8,
    reviewsCount: 52,
    featured: true,
  },
  {
    _id: 'acc-carbonx-folding-props',
    _type: 'droneAccessory',
    title: 'CarbonX 3-Blade Folding Drone Propellers (Set of 4)',
    slug: { _type: 'slug', current: 'carbonx-folding-drone-propellers' },
    sku: 'ACC-PRP-CBX4',
    price: 2999,
    basePrice: 2541.53,
    oldPrice: 3899,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: 'TORAY T700',
    compatibility: ['SkyFalcon Pro', 'AeroMaster 4K', 'Cinemax 6K', 'Universal Quick-Release Mounts'],
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/acc_carbonx_props_1788934818370',
    shortDescription: 'Dynamically balanced Toray T700 Japanese carbon fiber quick-folding low-noise aerodynamic propellers.',
    specifications: [
      { name: 'Material', value: '100% Toray T700 Carbon Fiber' },
      { name: 'Blade Design', value: 'Low-Noise Stealth Aerofoil Winglet' },
      { name: 'Noise Reduction', value: '-3.8 dB compared to OEM props' },
    ],
    rating: 4.9,
    reviewsCount: 34,
    featured: true,
  },
  {
    _id: 'acc-tactical-backpack',
    _type: 'droneAccessory',
    title: 'AeroShield Tactical Drone Backpack',
    slug: { _type: 'slug', current: 'aeroshield-tactical-drone-backpack' },
    sku: 'ACC-BAG-AERST',
    price: 4999,
    basePrice: 4236.44,
    oldPrice: 6499,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: 'WEATHERPROOF',
    compatibility: ['All Foldable & FPV Drones', 'Up to 16" Laptops', 'Transmitters & Goggles'],
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/acc_tactical_backpack_1788934832000',
    shortDescription: 'Mil-spec 1000D Cordura weatherproof modular backpack with customizable EVA foam divider inserts.',
    specifications: [
      { name: 'Material', value: '1000D Cordura Nylon Waterproof Fabric' },
      { name: 'Capacity', value: '35 Liters Expandable' },
      { name: 'Straps', value: 'External Heavy-Duty FPV Drone Straps' },
    ],
    rating: 4.8,
    reviewsCount: 41,
    featured: true,
  },
  {
    _id: 'acc-zenview-gimbal',
    _type: 'droneAccessory',
    title: 'ZenView 3-Axis Brushless Drone Gimbal',
    slug: { _type: 'slug', current: 'zenview-3-axis-brushless-drone-gimbal' },
    sku: 'ACC-GMB-ZENV3',
    price: 19999,
    basePrice: 16948.31,
    oldPrice: 24999,
    gstRate: 18,
    stockStatus: 'In Stock',
    badge: '±0.005° STAB',
    compatibility: ['Cinemax 6K', 'PhantomX VTOL', 'Custom DIY Quadcopters'],
    imageUrl: 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/v1/droneverse/products/acc_zenview_gimbal_1788934845000',
    shortDescription: 'High-torque direct-drive brushless 3-axis stabilizer with 32-bit dual IMU sensors for rock-solid cinema shots.',
    specifications: [
      { name: 'Angular Precision', value: '±0.005°' },
      { name: 'Payload Capacity', value: 'Up to 800g Action/Cinema Cameras' },
      { name: 'Rotation Range', value: 'Pan 360° Continuous, Tilt -120° to +30°' },
    ],
    rating: 5.0,
    reviewsCount: 18,
    featured: true,
  },
];

async function seedData() {
  console.log(`Starting Sanity CMS seeding for project ${PROJECT_ID} (${DATASET})...`);
  
  // Combine all items into createOrReplace mutations
  const mutations = [
    ...CATEGORIES.map(doc => ({ createOrReplace: doc })),
    ...HERO_SLIDES.map(doc => ({ createOrReplace: doc })),
    { createOrReplace: SITE_SETTINGS },
    ...PRODUCTS.map(doc => ({ createOrReplace: doc })),
    ...ACCESSORIES.map(doc => ({ createOrReplace: doc })),
  ];

  console.log(`Prepared ${mutations.length} documents for import into Sanity...`);

  const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ mutations }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Mutation failed with HTTP ${response.status}:`, errorText);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Sanity CMS seeding successfully completed!');
    console.log(`Transaction ID: ${result.transactionId}`);
    console.log(`Results: ${result.results?.length || mutations.length} documents created/replaced.`);
  } catch (err) {
    console.error('Network error executing mutations:', err);
    process.exit(1);
  }
}

seedData();
