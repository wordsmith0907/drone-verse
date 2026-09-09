/**
 * DroneVerse - Sanity CMS Client
 * Lightweight browser client for querying Sanity Headless CMS via GROQ / CDN API
 * Project ID: ulx4e2rk | Dataset: production
 */

(function (window) {
  'use strict';

  const SANITY_CONFIG = {
    projectId: 'ulx4e2rk',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: true,
  };

  /**
   * Builds the Sanity GROQ query URL using the Edge CDN
   */
  function buildQueryUrl(query, params = {}) {
    const host = SANITY_CONFIG.useCdn ? 'apicdn.sanity.io' : 'api.sanity.io';
    const encodedQuery = encodeURIComponent(query);
    let url = `https://${SANITY_CONFIG.projectId}.${host}/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodedQuery}`;
    
    // Append params if any ($paramName="value")
    for (const [key, value] of Object.entries(params)) {
      url += `&$${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
    }
    return url;
  }

  /**
   * Execute GROQ query with timeout and resilient error handling
   */
  async function sanityQuery(query, params = {}) {
    if (!SANITY_CONFIG.projectId || SANITY_CONFIG.projectId === 'your-project-id') {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(buildQueryUrl(query, params), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[Sanity CMS] Query responded with status ${response.status}`);
        return null;
      }

      const json = await response.json();
      return json.result || [];
    } catch (err) {
      console.warn('[Sanity CMS] Offline or network error fetching CMS data. Falling back to local catalog.', err.message);
      return null;
    }
  }

  // --- Specialized GROQ Query Methods ---

  /**
   * Fetch active Hero Slides ordered by sequence
   */
  async function fetchHeroSlides() {
    const query = `*[_type == "heroSlide" && isActive == true] | order(order asc) {
      _id,
      title,
      subtitle,
      badgeText,
      buttonText,
      buttonLink,
      imageUrl,
      order
    }`;
    return await sanityQuery(query);
  }

  /**
   * Fetch Featured Drones & Hardware for homepage and catalog
   */
  async function fetchFeaturedDrones() {
    const query = `*[_type == "product" && featured == true] | order(_createdAt desc) {
      _id,
      title,
      "slug": slug.current,
      sku,
      price,
      basePrice,
      oldPrice,
      badge,
      stockStatus,
      imageUrl,
      shortDescription,
      rating,
      reviewsCount
    }`;
    return await sanityQuery(query);
  }

  /**
   * Fetch all Drones
   */
  async function fetchAllProducts() {
    const query = `*[_type == "product"] | order(price desc) {
      _id,
      title,
      "slug": slug.current,
      sku,
      price,
      basePrice,
      oldPrice,
      badge,
      stockStatus,
      imageUrl,
      shortDescription,
      specifications,
      packageContents,
      rating,
      reviewsCount
    }`;
    return await sanityQuery(query);
  }

  /**
   * Fetch all Drone Accessories
   */
  async function fetchDroneAccessories() {
    const query = `*[_type == "droneAccessory"] | order(price desc) {
      _id,
      title,
      "slug": slug.current,
      sku,
      price,
      basePrice,
      oldPrice,
      badge,
      stockStatus,
      compatibility,
      imageUrl,
      shortDescription,
      specifications,
      rating,
      reviewsCount
    }`;
    return await sanityQuery(query);
  }

  /**
   * Fetch product detail by slug
   */
  async function fetchProductBySlug(slug) {
    const query = `*[_type in ["product", "droneAccessory"] && slug.current == $slug][0] {
      _id,
      _type,
      title,
      "slug": slug.current,
      sku,
      price,
      basePrice,
      oldPrice,
      badge,
      stockStatus,
      imageUrl,
      shortDescription,
      specifications,
      packageContents,
      compatibility,
      rating,
      reviewsCount
    }`;
    return await sanityQuery(query, { slug });
  }

  /**
   * Fetch all Categories
   */
  async function fetchCategories() {
    const query = `*[_type == "category"] | order(order asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      imageUrl,
      featured
    }`;
    return await sanityQuery(query);
  }

  /**
   * Fetch Site Settings
   */
  async function fetchSiteSettings() {
    const query = `*[_type == "siteSettings"][0] {
      siteName,
      announcementBar,
      supportPhone,
      supportEmail,
      b2bWhatsapp,
      address
    }`;
    return await sanityQuery(query);
  }

  // Export to window global
  window.DroneVerseCMS = {
    config: SANITY_CONFIG,
    query: sanityQuery,
    fetchHeroSlides,
    fetchFeaturedDrones,
    fetchAllProducts,
    fetchDroneAccessories,
    fetchProductBySlug,
    fetchCategories,
    fetchSiteSettings,
  };

  // Dispatch event when ready
  document.dispatchEvent(new CustomEvent('droneverse:cms:ready', { detail: window.DroneVerseCMS }));

})(window);
