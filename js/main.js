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
      return stored ? JSON.parse(stored) : [
        { id: 'RC-ARD-001', name: 'Original Arduino Uno R3 Development Board', price: 2199.00, qty: 1 },
        { id: 'RC-SNS-001', name: 'HC-SR04 Ultrasonic Distance Sensor Module', price: 59.00, qty: 2 }
      ];
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
  },

  addItem(id, name, price, qty = 1) {
    const items = this.getCart();
    const existing = items.find(item => item.id === id || item.name === name);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ id, name, price, qty });
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
  // CART PAGE TABLE INTERACTIONS (Interactive Quantity & Removal)
  // ------------------------------------------------------------------------
  const cartTable = document.querySelector('.cart-table');
  if (cartTable) {
    const qtyInputs = cartTable.querySelectorAll('.pdp-qty-input');
    
    // Bind plus / minus buttons in table
    cartTable.querySelectorAll('.cart-item-row, tr').forEach(row => {
      const minusBtn = row.querySelector('.pdp-qty-btn:first-of-type');
      const plusBtn = row.querySelector('.pdp-qty-btn:last-of-type');
      const input = row.querySelector('.pdp-qty-input');
      const removeBtn = row.querySelector('button[title="Remove Item"], .cart-item__remove');

      if (minusBtn && input) {
        minusBtn.addEventListener('click', () => {
          let val = parseInt(input.value, 10) || 1;
          if (val > 1) {
            input.value = val - 1;
            CartStore.addItem('cart-row', 'Item', 0, -1);
            recalculateCartTable();
          }
        });
      }

      if (plusBtn && input) {
        plusBtn.addEventListener('click', () => {
          let val = parseInt(input.value, 10) || 1;
          input.value = val + 1;
          CartStore.addItem('cart-row', 'Item', 0, 1);
          recalculateCartTable();
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          row.style.transition = 'opacity 0.25s ease';
          row.style.opacity = '0';
          setTimeout(() => {
            row.remove();
            recalculateCartTable();
          }, 250);
        });
      }
    });

    function recalculateCartTable() {
      let subtotal = 0;
      cartTable.querySelectorAll('tbody tr').forEach(r => {
        const priceCell = r.querySelector('.cart-item-price, td:nth-child(2)');
        const qtyInput = r.querySelector('.pdp-qty-input');
        const totalCell = r.querySelector('.cart-total-val, td:nth-child(4)');

        if (priceCell && qtyInput) {
          const price = parseFloat(priceCell.textContent.replace(/[^\d.]/g, '')) || 0;
          const qty = parseInt(qtyInput.value, 10) || 0;
          const lineTotal = price * qty;
          if (totalCell) {
            totalCell.textContent = `₹${lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
          }
          subtotal += lineTotal;
        }
      });

      const summarySubtotal = document.querySelector('.cart-summary__subtotal, .summary-row:first-child span:last-child');
      const summaryGst = document.querySelector('.cart-summary__gst, .summary-row:nth-child(2) span:last-child');
      const summaryGrand = document.querySelector('.cart-summary-total, .summary-total span:last-child');

      if (summarySubtotal) summarySubtotal.textContent = `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      if (summaryGst) summaryGst.textContent = `₹${(subtotal * 0.18 / 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      if (summaryGrand) summaryGrand.textContent = `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

      CartStore.syncBadges();
    }
  }

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
  if (svg) svg.style.fill = isAdded ? '#E95D2A' : '';
}

function quickView(productId) {
  console.log('[DroneVerse] Quick View:', productId);
}

function subscribeNewsletter() {
  alert('Thank you for subscribing to DroneVerse deals and engineering tutorials!');
}
