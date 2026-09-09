/* ==========================================================================
   DRONEVERSE (Zbotic UI Theme) - Main Interactive JavaScript
   ========================================================================== */

// ==========================================================================
// 1. PERSISTENT CART & WISHLIST STORE (localStorage)
// ==========================================================================

const CartStore = {
  getCart() {
    try {
      const stored = localStorage.getItem('rc_cart');
      if (!stored) return [];
      let items = JSON.parse(stored);
      if (!Array.isArray(items)) return [];
      // Clean up legacy hardcoded demo placeholder items
      const cleaned = items.filter(item => item.id !== 'RC-ARD-001' && item.id !== 'RC-SNS-001');
      if (cleaned.length !== items.length) {
        localStorage.setItem('rc_cart', JSON.stringify(cleaned));
      }
      return cleaned;
    } catch (e) {
      return [];
    }
  },

  saveCart(items) {
    try {
      localStorage.setItem('rc_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
    this.syncBadges();
    this.renderCartPage();
  },

  addItem(id, name, price, qty = 1, img = '') {
    const items = this.getCart();
    const existing = items.find(item => item.id === id || item.name === name);
    if (existing) {
      existing.qty += qty;
      if (img && !existing.img) existing.img = img;
    } else {
      items.push({ id, name, price: Number(price) || 0, qty, img });
    }
    this.saveCart(items);
  },

  updateQty(id, delta) {
    const items = this.getCart();
    const item = items.find(i => i.id === id);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) {
        this.removeItem(id);
        return;
      }
      this.saveCart(items);
    }
  },

  removeItem(id) {
    let items = this.getCart();
    items = items.filter(i => i.id !== id);
    this.saveCart(items);
  },

  getTotalCount() {
    return this.getCart().reduce((sum, item) => sum + item.qty, 0);
  },

  getSubtotal() {
    return this.getCart().reduce((sum, item) => sum + (item.price * item.qty), 0);
  },

  syncBadges() {
    const count = this.getTotalCount();
    const subtotal = this.getSubtotal();
    const formattedTotal = `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const headerCartBadge = document.getElementById('cartCount');
    const mobileCartBadge = document.getElementById('mobileCartCount');
    const headerCartTotal = document.getElementById('cartTotal') || document.getElementById('cartTotalNav');

    if (headerCartBadge) headerCartBadge.textContent = count;
    if (mobileCartBadge) mobileCartBadge.textContent = count;
    if (headerCartTotal) headerCartTotal.textContent = formattedTotal;
  },

  renderCartPage() {
    const container = document.getElementById('cartAppContainer');
    if (!container) return;

    const items = this.getCart();
    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 70px 20px; background: #ffffff; border: 1px solid var(--zb-border); border-radius: var(--radius-md); max-width: 640px; margin: 20px auto 40px;">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: #F1F5F9; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: var(--zb-navy);">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: var(--zb-navy); margin-bottom: 8px;">Your Shopping Cart is Empty</h2>
          <p style="font-size: 14px; color: var(--zb-text-muted); margin-bottom: 24px; line-height: 1.5;">You haven't added any products yet. Browse our professional drones, FPV racers, and accessories to get started.</p>
          <a href="./collections/drones-and-accessories.html" class="hero-cta-button" style="display: inline-flex; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 700;">
            <span>EXPLORE DRONES & GEAR</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      `;
      return;
    }

    const subtotal = this.getSubtotal();
    const isFreeShipping = subtotal >= 999;
    const shippingFee = isFreeShipping ? 0 : 99;
    const gstIncluded = (subtotal * 18) / 118;
    const total = subtotal + shippingFee;

    const rowsHtml = items.map(item => {
      const itemImg = item.img || 'https://res.cloudinary.com/yoe6tiub/image/upload/f_auto,q_auto/ecommerce/products/drone_skyfalcon_thermal';
      const itemTotal = item.price * item.qty;
      return `
        <tr>
          <td>
            <div class="cart-item-flex">
              <img src="${itemImg}" alt="${item.name}" class="cart-item-thumb" style="object-fit: cover;">
              <div>
                <div class="cart-item-name">${item.name}</div>
                <div style="font-size: 11.5px; color: var(--zb-text-muted); margin-top: 4px;">SKU: ${item.id} | In Stock</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--zb-navy);">₹${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 11px; color: var(--zb-text-muted);">Incl. 18% GST</div>
          </td>
          <td>
            <div class="pdp-qty-picker" style="height: 38px; width: 110px;">
              <button type="button" class="pdp-qty-btn" onclick="CartStore.updateQty('${item.id}', -1)">-</button>
              <input type="text" class="pdp-qty-input" value="${item.qty}" readonly>
              <button type="button" class="pdp-qty-btn" onclick="CartStore.updateQty('${item.id}', 1)">+</button>
            </div>
          </td>
          <td>
            <div style="font-weight: 800; color: var(--zb-navy); font-size: 15px;">₹${itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </td>
          <td>
            <button type="button" onclick="CartStore.removeItem('${item.id}')" style="background: none; border: none; color: #dc2626; cursor: pointer;" title="Remove Item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-sm); padding: 14px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px;">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#1d4ed8"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
        <div>
          <div style="font-size: 13.5px; font-weight: 700; color: #1e3a8a;">${isFreeShipping ? '🎉 Congratulations! You have unlocked FREE Express Shipping across India!' : `Add ₹${(999 - subtotal).toLocaleString('en-IN')} more to unlock FREE Express Shipping!`}</div>
          <div style="font-size: 12px; color: #3b82f6;">All orders include GST invoices &amp; transit insurance.</div>
        </div>
      </div>

      <div class="cart-layout">
        <div>
          <div class="cart-table-wrap">
            <table class="cart-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th style="width: 120px;">Price</th>
                  <th style="width: 140px;">Quantity</th>
                  <th style="width: 120px;">Total</th>
                  <th style="width: 50px;"></th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 20px;">
            <label style="font-size: 13px; font-weight: 600; color: var(--zb-navy); margin-bottom: 6px; display: block;">Special Order Notes / Instructions for Dispatch:</label>
            <textarea placeholder="e.g. Please leave package at security gate or test before dispatch..." style="width: 100%; height: 80px; padding: 10px; border: 1px solid var(--zb-border-dark); border-radius: var(--radius-sm); font-family: inherit; font-size: 13px;"></textarea>
          </div>
        </div>

        <div>
          <div class="cart-summary-card">
            <h3 class="cart-summary-title">Order Summary</h3>
            <div class="cart-summary-row">
              <span>Subtotal (${this.getTotalCount()} items)</span>
              <span style="font-weight: 700;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="cart-summary-row">
              <span>Estimated Shipping</span>
              <span style="color: var(--zb-green); font-weight: 700;">${isFreeShipping ? 'FREE' : '₹99.00'}</span>
            </div>
            <div class="cart-summary-row">
              <span>GST Tax (18% Included)</span>
              <span>₹${gstIncluded.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <div class="cart-summary-row total">
              <span>Total Payable:</span>
              <span>₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <a href="./checkout.html" class="btn-checkout">Proceed to Checkout &rarr;</a>

            <div style="margin-top: 16px; text-align: center;">
              <a href="./collections/drones-and-accessories.html" style="font-size: 12.5px; color: var(--zb-blue); text-decoration: underline;">&larr; Continue Shopping</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};

const WishlistStore = {
  getWishlist() {
    try {
      const stored = localStorage.getItem('rc_wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  toggle(id) {
    let list = this.getWishlist();
    const index = list.indexOf(id);
    let added = false;
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(id);
      added = true;
    }
    try {
      localStorage.setItem('rc_wishlist', JSON.stringify(list));
    } catch (e) {}
    this.syncBadge();
    return added;
  },

  syncBadge() {
    const badge = document.getElementById('wishlistCount');
    if (badge) badge.textContent = this.getWishlist().length;
  }
};

// ==========================================================================
// 2. DOM INITIALIZATION & EVENT DELEGATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', function() {

  // Sync state from storage
  CartStore.syncBadges();
  WishlistStore.syncBadge();
  CartStore.renderCartPage();

  // Export globals
  window.CartStore = CartStore;
  window.WishlistStore = WishlistStore;
  window.DroneVerseCart = {
    addItem(item) {
      CartStore.addItem(item.sku || item.id, item.name, item.price, item.quantity || 1, item.image || item.img || '');
    },
    getCart() {
      return CartStore.getCart();
    }
  };
  window.addToCart = function(id, name, price, img) {
    const numPrice = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
    CartStore.addItem(id, name, numPrice, 1, typeof img === 'string' ? img : '');
    const toast = document.createElement('div');
    toast.textContent = `✓ Added "${name}" to cart!`;
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#0F172A;color:#fff;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.2);';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  // ------------------------------------------------------------------------
  // HERO BANNER SLIDER
  // ------------------------------------------------------------------------
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

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }

    function startAutoSlide() {
      stopAutoSlide();
      autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
      if (autoSlideInterval) clearInterval(autoSlideInterval);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => { nextSlide(); startAutoSlide(); });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => { prevSlide(); startAutoSlide(); });
    }
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const slideIdx = parseInt(dot.getAttribute('data-slide'), 10);
        goToSlide(slideIdx);
        startAutoSlide();
      });
    });

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('slide')) {
      const targetSlide = parseInt(urlParams.get('slide'), 10);
      if (!isNaN(targetSlide)) goToSlide(targetSlide);
    }

    startAutoSlide();
  }

  // ------------------------------------------------------------------------
  // "ALL DEPARTMENTS" MENU TOGGLE
  // ------------------------------------------------------------------------
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

  // ------------------------------------------------------------------------
  // TAB NAVIGATION (HOMEPAGE)
  // ------------------------------------------------------------------------
  const tabButtons = document.querySelectorAll('.zb-tab-btn');
  const tabContents = document.querySelectorAll('.zb-tab-content');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach(content => {
        if (content.id === targetTabId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  // ------------------------------------------------------------------------
  // CART PAGE INITIALIZATION
  // ------------------------------------------------------------------------
  CartStore.renderCartPage();

  // ------------------------------------------------------------------------
  // SEARCH QUERY FILTERING (search.html)
  // ------------------------------------------------------------------------
  const searchParams = new URLSearchParams(window.location.search);
  const query = searchParams.get('q');
  const searchGrid = document.getElementById('searchProductGrid') || document.getElementById('shopProductGrid');
  const searchTitle = document.querySelector('.search-results-header h1, .search-query-display');

  if (query && searchGrid) {
    const qLower = query.toLowerCase();
    let matches = 0;
    Array.from(searchGrid.children).forEach(card => {
      const title = (card.getAttribute('data-title') || card.textContent || '').toLowerCase();
      if (title.includes(qLower)) {
        card.style.display = '';
        matches++;
      } else {
        card.style.display = 'none';
      }
    });

    if (searchTitle) {
      searchTitle.textContent = `Search results for "${query}" (${matches} items found)`;
    }
  }

  // ------------------------------------------------------------------------
  // BACK TO TOP BUTTON
  // ------------------------------------------------------------------------
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

  // ------------------------------------------------------------------------
  // PDP INTERACTIONS
  // ------------------------------------------------------------------------
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

// ==========================================================================
// 3. GLOBAL EXPOSED EVENT HANDLERS
// ==========================================================================

function addToCart(arg1, arg2, arg3, arg4) {
  let button, productId = 'item', productName = 'DroneVerse Hardware Item', price = 0;
  
  if (arg1 && arg1.nodeType) {
    button = arg1;
    productId = button.getAttribute('data-product-id') || 'item';
    const card = button.closest('.zb-product-card');
    if (card) {
      const titleElem = card.querySelector('.zb-product-card__title a') || card.querySelector('.zb-product-card__title');
      if (titleElem) productName = titleElem.textContent.trim();
      const priceElem = card.querySelector('.zb-price-main') || card.querySelector('.zb-current-price');
      if (priceElem) price = parseFloat(priceElem.textContent.replace(/[^\d.]/g, '')) || 0;
    }
  } else {
    productId = arg1 || 'item';
    productName = arg2 || 'Product';
    price = typeof arg3 === 'number' ? arg3 : (parseFloat(arg3) || 0);
    button = (arg4 && arg4.nodeType) ? arg4 : (typeof event !== 'undefined' ? event.currentTarget : null);
  }

  // Visual feedback
  if (button) {
    const origHTML = button.innerHTML;
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      Added ✓
    `;
    button.style.backgroundColor = '#10B981';
    button.style.borderColor = '#10B981';
    button.disabled = true;

    setTimeout(() => {
      button.innerHTML = origHTML;
      button.style.backgroundColor = '';
      button.style.borderColor = '';
      button.disabled = false;
    }, 1800);
  }

  // Persist to CartStore
  CartStore.addItem(productId, productName, price, 1);
}

function toggleWishlist(button) {
  const card = button.closest('.zb-product-card');
  const id = card ? (card.getAttribute('data-title') || 'item') : 'item';
  const isAdded = WishlistStore.toggle(id);
  button.classList.toggle('active', isAdded);
  const svg = button.querySelector('svg');
  if (svg) svg.style.fill = isAdded ? '#0066FE' : '';
}

function quickView(productId) {
  console.log('[DroneVerse] Quick View:', productId);
}

function subscribeNewsletter() {
  alert('Thank you for subscribing to DroneVerse deals and engineering tutorials!');
}
