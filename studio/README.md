# DroneVerse Sanity Studio

This is the official headless CMS Studio for **DroneVerse**, providing structured content management for Drones, Drone Accessories, Categories, Hero Carousel Slides, and Global Site Settings.

## Project Information
- **Sanity Project ID**: `ulx4e2rk`
- **Dataset**: `production`
- **Organization ID**: `ousy4sgi6`

## Schemas
1. **`product`**: Drones, dev boards, and robotics with Dual GST pricing (`price` incl. GST + `basePrice` excl. GST), specs array, Cloudinary CDN image URLs, and stock status.
2. **`droneAccessory`**: FPV goggles, 6S LiPo batteries, carbon fiber propellers, tactical backpacks, and 3-axis brushless gimbals with compatibility matrix.
3. **`category`**: Collection categories with slugs, descriptions, and thumbnails.
4. **`heroSlide`**: Homepage carousel banners with dynamic CTAs, headings, and Cloudinary imagery.
5. **`siteSettings`**: Notice bar promo copy, support phone, emails, and address.

## Running Locally
In the `studio/` directory:
```bash
# Install dependencies
npm install

# Start local Sanity Studio development server (runs on http://localhost:3333)
npm run dev
```

## Deploying Sanity Studio to the Cloud
To host your Sanity Studio on a free Sanity URL (e.g. `https://droneverse.sanity.studio`):
```bash
npm run deploy
```
