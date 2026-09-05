// ============================================
// Cozy Crafting — cart.js
// Client-side cart (localStorage) + drawer UI +
// checkout handoff to the Cloudflare Worker at
// /api/checkout, which talks to Stripe securely.
//
// Requires products.js (window.PRODUCT_CATALOG)
// to be loaded first.
// ============================================

(function () {
  const CART_KEY = "cozycrafting-cart";
  const LANG_KEY = "cozycrafting-lang";
  const CHECKOUT_ENDPOINT = "/api/checkout";

  const STRINGS = {
    en: {
      cartTitle: "Your Cart",
      empty: "Your cart is empty.",
      continue: "Continue Shopping",
      subtotal: "Subtotal",
      checkout: "Checkout",
      checkingOut: "Redirecting…",
      remove: "Remove",
      checkoutError: "Something went wrong starting checkout. Please try again.",
      added: "Added to cart!",
    },
    es: {
      cartTitle: "Tu Carrito",
      empty: "Tu carrito está vacío.",
      continue: "Seguir Comprando",
      subtotal: "Subtotal",
      checkout: "Pagar",
      checkingOut: "Redirigiendo…",
      remove: "Quitar",
      checkoutError: "Algo salió mal al iniciar el pago. Inténtalo de nuevo.",
      added: "¡Añadido al carrito!",
    },
  };

  function currentLang() {
    return localStorage.getItem(LANG_KEY) || "en";
  }

  function t(key) {
    const lang = currentLang();
    return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key];
  }

  function formatPrice(cents) {
    return (cents / 100).toLocaleString(currentLang() === "es" ? "es-US" : "en-US", {
      style: "currency",
      currency: "USD",
    });
  }

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderBadge();
  }

  function addToCart(id, qty) {
    qty = qty || 1;
    const cart = getCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) {
      existing.qty = Math.min(20, existing.qty + qty);
    } else {
      cart.push({ id, qty: Math.min(20, qty) });
    }
    saveCart(cart);
    renderDrawer();
    openDrawer();
  }

  function setQty(id, qty) {
    let cart = getCart();
    qty = Math.max(1, Math.min(20, qty));
    cart = cart.map((item) => (item.id === id ? { ...item, qty } : item));
    saveCart(cart);
    renderDrawer();
  }

  function removeFromCart(id) {
    const cart = getCart().filter((item) => item.id !== id);
    saveCart(cart);
    renderDrawer();
  }

  function clearCart() {
    saveCart([]);
    renderDrawer();
  }

  function cartCount() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
  }

  function cartTotalCents() {
    const catalog = window.PRODUCT_CATALOG || {};
    return getCart().reduce((sum, item) => {
      const product = catalog[item.id];
      return product ? sum + product.price * item.qty : sum;
    }, 0);
  }

  // ---------- Badge ----------
  function renderBadge() {
    const badge = document.querySelector("[data-cart-count]");
    if (!badge) return;
    const count = cartCount();
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  // ---------- Drawer ----------
  function getDrawer() {
    let drawer = document.getElementById("cart-drawer");
    if (drawer) return drawer;

    drawer = document.createElement("div");
    drawer.id = "cart-drawer";
    drawer.className = "cart-drawer-overlay";
    drawer.setAttribute("hidden", "");
    drawer.innerHTML =
      '<div class="cart-drawer-panel" role="dialog" aria-modal="true" aria-label="Shopping cart">' +
      '<div class="cart-drawer-header">' +
      '<h2 class="cart-drawer-title"></h2>' +
      '<button type="button" class="modal-close cart-drawer-close" aria-label="Close">&times;</button>' +
      "</div>" +
      '<div class="cart-drawer-body"></div>' +
      '<div class="cart-drawer-footer"></div>' +
      "</div>";
    document.body.appendChild(drawer);

    drawer.addEventListener("click", (event) => {
      if (
        event.target === drawer ||
        event.target.closest(".cart-drawer-close") ||
        event.target.closest("[data-continue-shopping]")
      ) {
        closeDrawer();
      }
    });

    return drawer;
  }

  function renderDrawer() {
    const drawer = getDrawer();
    const catalog = window.PRODUCT_CATALOG || {};
    const cart = getCart();

    drawer.querySelector(".cart-drawer-title").textContent = t("cartTitle");

    const body = drawer.querySelector(".cart-drawer-body");
    const footer = drawer.querySelector(".cart-drawer-footer");

    if (!cart.length) {
      body.innerHTML = '<p class="cart-empty">' + t("empty") + "</p>";
      footer.innerHTML =
        '<button type="button" class="shop-link" data-continue-shopping>' + t("continue") + "</button>";
      return;
    }

    body.innerHTML = cart
      .map((item) => {
        const product = catalog[item.id];
        if (!product) return "";
        const name = currentLang() === "es" ? product.nameEs : product.nameEn;
        return (
          '<div class="cart-row" data-cart-row="' +
          item.id +
          '">' +
          '<img class="cart-row-image" src="' +
          product.image +
          '" alt="" />' +
          '<div class="cart-row-info">' +
          '<p class="cart-row-name">' +
          name +
          "</p>" +
          '<p class="cart-row-price">' +
          formatPrice(product.price) +
          "</p>" +
          '<div class="cart-row-controls">' +
          '<button type="button" class="qty-btn" data-qty-decrease="' +
          item.id +
          '" aria-label="Decrease quantity">−</button>' +
          '<span class="qty-value">' +
          item.qty +
          "</span>" +
          '<button type="button" class="qty-btn" data-qty-increase="' +
          item.id +
          '" aria-label="Increase quantity">+</button>' +
          '<button type="button" class="cart-remove" data-remove="' +
          item.id +
          '">' +
          t("remove") +
          "</button>" +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    footer.innerHTML =
      '<div class="cart-subtotal"><span>' +
      t("subtotal") +
      '</span><span>' +
      formatPrice(cartTotalCents()) +
      "</span></div>" +
      '<button type="button" class="shop-link cart-checkout-btn" data-checkout-btn>' +
      t("checkout") +
      "</button>";
  }

  function openDrawer() {
    const drawer = getDrawer();
    renderDrawer();
    drawer.removeAttribute("hidden");
    document.body.classList.add("modal-open");
  }

  function closeDrawer() {
    const drawer = document.getElementById("cart-drawer");
    if (!drawer) return;
    drawer.setAttribute("hidden", "");
    document.body.classList.remove("modal-open");
  }

  // ---------- Checkout ----------
  async function checkout() {
    const cart = getCart();
    if (!cart.length) return;

    const btn = document.querySelector("[data-checkout-btn]");
    const originalText = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = t("checkingOut");
    }

    try {
      const res = await fetch(CHECKOUT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.map((i) => ({ id: i.id, qty: i.qty })) }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data.error || "Checkout failed");
    } catch (err) {
      alert(t("checkoutError"));
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  }

  // ---------- Wire up ----------
  document.addEventListener("click", (event) => {
    const addBtn = event.target.closest("[data-add-to-cart]");
    if (addBtn) {
      addToCart(addBtn.getAttribute("data-add-to-cart"), 1);
      return;
    }

    const openBtn = event.target.closest("[data-cart-toggle]");
    if (openBtn) {
      openDrawer();
      return;
    }

    const decBtn = event.target.closest("[data-qty-decrease]");
    if (decBtn) {
      const id = decBtn.getAttribute("data-qty-decrease");
      const item = getCart().find((i) => i.id === id);
      if (item) {
        if (item.qty <= 1) {
          removeFromCart(id);
        } else {
          setQty(id, item.qty - 1);
        }
      }
      return;
    }

    const incBtn = event.target.closest("[data-qty-increase]");
    if (incBtn) {
      const id = incBtn.getAttribute("data-qty-increase");
      const item = getCart().find((i) => i.id === id);
      if (item) setQty(id, item.qty + 1);
      return;
    }

    const removeBtn = event.target.closest("[data-remove]");
    if (removeBtn) {
      removeFromCart(removeBtn.getAttribute("data-remove"));
      return;
    }

    const checkoutBtn = event.target.closest("[data-checkout-btn]");
    if (checkoutBtn) {
      checkout();
      return;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });

  document.addEventListener("DOMContentLoaded", renderBadge);

  // Refresh badge/drawer text when the language toggle changes
  window.onLanguageChange = function () {
    renderBadge();
    const drawer = document.getElementById("cart-drawer");
    if (drawer && !drawer.hasAttribute("hidden")) {
      renderDrawer();
    }
  };

  // Clear the cart after a successful purchase (called from success.html)
  window.clearCozyCraftingCart = clearCart;
})();
