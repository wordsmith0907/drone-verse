/* ==========================================================================
   ROBOCRAZE (Zbotic UI Theme) - Main Interactive JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {

  // ==========================================================================
  // 1. HERO BANNER SLIDER
  // ==========================================================================
  const slider = document.getElementById('heroSlider');
  const dots = document.querySelectorAll('.hero-dot');
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');
  let currentSlide = 0;
  let autoSlideInterval = null;

  if (slider && dots.length > 0) {
    const totalSlides = dots.length;

    function goToSlide(index) {
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;
      currentSlide = index;
      slider.style.transform = `translateX(-${currentSlide * 100}%)`;
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlide);
      });
    }

    function nextSlide() {
      goToSlide(currentSlide + 1);
    }

    function prevSlide() {
      goToSlide(currentSlide - 1);
    }

    function startAutoSlide() {
      stopAutoSlide();
      autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
      if (autoSlideInterval) clearInterval(autoSlideInterval);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        startAutoSlide();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        startAutoSlide();
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const slideIdx = parseInt(dot.getAttribute('data-slide'), 10);
        goToSlide(slideIdx);
        startAutoSlide();
      });
    });

    startAutoSlide();
  }

  // ==========================================================================
  // 2. "ALL DEPARTMENTS" MENU TOGGLE (Mobile & Desktop)
  // ==========================================================================
  const deptTrigger = document.getElementById('departmentsTrigger');
  const deptMenu = document.getElementById('departmentsMenu');

  if (deptTrigger && deptMenu) {
    deptTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      deptMenu.classList.toggle('is-active');
    });

    document.addEventListener('click', (e) => {
      if (!deptMenu.contains(e.target)) {
        deptMenu.classList.remove('is-active');
      }
    });
  }

  // ==========================================================================
  // 3. BESTSELLERS TAB SWITCHING
  // ==========================================================================
  const tabButtons = document.querySelectorAll('.zb-tab-btn');
  const tabContents = document.querySelectorAll('.zb-tab-content');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');

      // Update button active state
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update content panel active state
      tabContents.forEach(content => {
        if (content.id === targetTabId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  // ==========================================================================
  // 4. BACK TO TOP BUTTON
  // ==========================================================================
  const backToTopBtn = document.getElementById('backToTop') || document.getElementById('backToTopBtn');

  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 350) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ==========================================================================
  // 5. MOBILE BOTTOM PANEL "MORE" DRAWER TOGGLE
  // ==========================================================================
  const mobileMenuOpenBtn = document.getElementById('mobileMenuOpenBtn');
  if (mobileMenuOpenBtn && deptMenu) {
    mobileMenuOpenBtn.addEventListener('click', () => {
      deptMenu.classList.toggle('is-active');
      window.scrollTo({ top: 120, behavior: 'smooth' });
    });
  }

});

// ==========================================================================
// 6. GLOBAL CART & WISHLIST FUNCTIONS (Frontend Placeholders with Live Feedback)
// ==========================================================================

let globalCartCount = 0;
let globalCartTotal = 0;
let globalWishlistCount = 0;

/**
 * Add to Cart Simulation
 */
function addToCart(arg1, arg2, arg3, arg4) {
  let button, productId, price = 0;
  if (arg1 && arg1.nodeType) {
    button = arg1;
    productId = button.getAttribute('data-product-id') || 'item';
    const card = button.closest('.zb-product-card');
    const priceElement = card ? (card.querySelector('.zb-price-main') || card.querySelector('.zb-current-price')) : null;
    if (priceElement) {
      price = parseFloat(priceElement.textContent.replace(/[^\d.]/g, '')) || 0;
    }
  } else {
    productId = arg1;
    price = typeof arg3 === 'number' ? arg3 : (parseFloat(arg3) || 0);
    button = (arg4 && arg4.nodeType) ? arg4 : (typeof event !== 'undefined' ? event.currentTarget : null);
  }

  // Visual feedback on button
  if (button) {
    const originalText = button.innerHTML;
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      Added ✓
    `;
    button.style.backgroundColor = '#11A45D';
    button.style.borderColor = '#11A45D';
    button.disabled = true;

    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.backgroundColor = '';
      button.style.borderColor = '';
      button.disabled = false;
    }, 2000);
  }

  // Increment counters
  globalCartCount += 1;
  globalCartTotal += price;

  const headerCartBadge = document.getElementById('cartCount');
  const mobileCartBadge = document.getElementById('mobileCartCount');
  const headerCartTotal = document.getElementById('cartTotal') || document.getElementById('cartTotalNav');

  if (headerCartBadge) headerCartBadge.textContent = globalCartCount;
  if (mobileCartBadge) mobileCartBadge.textContent = globalCartCount;
  if (headerCartTotal) headerCartTotal.textContent = `₹${globalCartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  console.log(`[Robocraze] Added "${productId}" to cart. Total items: ${globalCartCount}`);
}

/**
 * Toggle Wishlist item
 */
function toggleWishlist(button) {
  button.classList.toggle('active');
  const isActive = button.classList.contains('active');
  const svg = button.querySelector('svg');
  const wishlistBadge = document.getElementById('wishlistCount');

  if (isActive) {
    if (svg) svg.style.fill = '#E95D2A';
    globalWishlistCount += 1;
  } else {
    if (svg) svg.style.fill = '';
    globalWishlistCount = Math.max(0, globalWishlistCount - 1);
  }

  if (wishlistBadge) wishlistBadge.textContent = globalWishlistCount;
}

/**
 * Quick View placeholder
 */
function quickView(productId) {
  console.log(`[Robocraze] Quick View triggered for: ${productId}`);
  // In a full implementation, opens a lightbox/modal with product details and specs
}

/**
 * Newsletter subscribe placeholder
 */
function subscribeNewsletter() {
  alert('Thank you for subscribing to Robocraze deals and engineering tutorials!');
}

// ==========================================================================
// 8. PDP GALLERY & INTERACTIONS
// ==========================================================================
document.addEventListener('DOMContentLoaded', function() {
  // Gallery thumbnails
  const thumbs = document.querySelectorAll('.pdp-thumb');
  const mainImg = document.getElementById('pdpMainImg');
  if (thumbs.length && mainImg) {
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', function() {
        thumbs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const newSrc = this.getAttribute('data-img-src') || this.querySelector('img').src;
        mainImg.src = newSrc;
      });
    });
  }

  // PDP Quantity Picker
  const qtyMinus = document.getElementById('pdpQtyMinus');
  const qtyPlus = document.getElementById('pdpQtyPlus');
  const qtyInput = document.getElementById('pdpQtyInput');
  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });
    qtyPlus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      qtyInput.value = val + 1;
    });
  }

  // PDP Tab Switching
  const pdpTabTriggers = document.querySelectorAll('.pdp-tab-trigger');
  const pdpPanes = document.querySelectorAll('.pdp-tab-pane');
  if (pdpTabTriggers.length && pdpPanes.length) {
    pdpTabTriggers.forEach(btn => {
      btn.addEventListener('click', () => {
        pdpTabTriggers.forEach(b => b.classList.remove('active'));
        pdpPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetPane = document.getElementById(btn.getAttribute('data-target'));
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  // PDP Pincode Checker
  const pincodeBtn = document.getElementById('pdpPincodeBtn');
  const pincodeInput = document.getElementById('pdpPincodeInput');
  const pincodeResult = document.getElementById('pdpPincodeResult');
  if (pincodeBtn && pincodeInput && pincodeResult) {
    pincodeBtn.addEventListener('click', () => {
      const pin = pincodeInput.value.trim();
      if (pin.length === 6 && /^\d+$/.test(pin)) {
        pincodeResult.innerHTML = '⚡ <strong>Delivery to ' + pin + ':</strong> Available! Standard delivery in 2-4 business days. Free shipping eligible.';
        pincodeResult.style.color = '#11A45D';
      } else {
        pincodeResult.innerHTML = '❌ Please enter a valid 6-digit Indian Postal Code.';
        pincodeResult.style.color = '#dc2626';
      }
    });
  }

  // Variant selector buttons
  const variantBtns = document.querySelectorAll('.pdp-variant-btn');
  variantBtns.forEach(vBtn => {
    vBtn.addEventListener('click', function() {
      const parent = this.closest('.pdp-variant-options');
      if (parent) {
        parent.querySelectorAll('.pdp-variant-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });

  // Shop View Switcher
  const viewGrid4 = document.getElementById('viewGrid4');
  const viewGrid3 = document.getElementById('viewGrid3');
  const viewList = document.getElementById('viewList');
  const targetGrid = document.getElementById('shopProductGrid');

  if (targetGrid) {
    if (viewGrid4) {
      viewGrid4.addEventListener('click', () => {
        targetGrid.classList.remove('list-view', 'product-grid-3');
        targetGrid.classList.add('product-grid-4');
        [viewGrid4, viewGrid3, viewList].forEach(b => b && b.classList.remove('active'));
        viewGrid4.classList.add('active');
      });
    }
    if (viewGrid3) {
      viewGrid3.addEventListener('click', () => {
        targetGrid.classList.remove('list-view', 'product-grid-4');
        targetGrid.classList.add('product-grid-3');
        [viewGrid4, viewGrid3, viewList].forEach(b => b && b.classList.remove('active'));
        viewGrid3.classList.add('active');
      });
    }
    if (viewList) {
      viewList.addEventListener('click', () => {
        targetGrid.classList.remove('product-grid-4', 'product-grid-3');
        targetGrid.classList.add('list-view');
        [viewGrid4, viewGrid3, viewList].forEach(b => b && b.classList.remove('active'));
        viewList.classList.add('active');
      });
    }
  }

  // FAQ Accordion
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(q => {
    q.addEventListener('click', function() {
      const item = this.closest('.faq-item');
      if (item) {
        item.classList.toggle('active');
      }
    });
  });

  // Shop Sorting Dropdown
  const sortSelect = document.getElementById('shopSortSelect');
  if (sortSelect && targetGrid) {
    sortSelect.addEventListener('change', function() {
      const order = this.value;
      const cards = Array.from(targetGrid.children);
      cards.sort((a, b) => {
        const priceA = parseFloat(a.getAttribute('data-price') || '0');
        const priceB = parseFloat(b.getAttribute('data-price') || '0');
        const nameA = (a.getAttribute('data-title') || '').toLowerCase();
        const nameB = (b.getAttribute('data-title') || '').toLowerCase();

        if (order === 'price-low') return priceA - priceB;
        if (order === 'price-high') return priceB - priceA;
        if (order === 'name-asc') return nameA.localeCompare(nameB);
        if (order === 'name-desc') return nameB.localeCompare(nameA);
        return 0;
      });
      cards.forEach(c => targetGrid.appendChild(c));
    });
  }
});
