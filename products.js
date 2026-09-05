// ============================================
// Cozy Crafting — products.js
// Single source of truth for product data used
// by the cart UI. IMPORTANT: prices here are for
// DISPLAY only — the Cloudflare Worker keeps its
// own copy and never trusts prices sent by the
// browser, so this file being edited can't be
// used to under-pay at checkout.
// ============================================

window.PRODUCT_CATALOG = {
  "wonder-box": {
    nameEn: "Fifi-Lu Wonder Box",
    nameEs: "Fifi-Lu Wonder Box",
    price: 2899, // cents
    image: "/assets/box.png",
  },
  "tote-bag": {
    nameEn: "Fifi-Lu Natural Cotton Tote Bag",
    nameEs: "Bolso Tote Fifi-Lu de Algodón Natural",
    price: 1500,
    image: "/assets/fifi-tote.jpeg",
  },
  "coloring-book": {
    nameEn: "Fifi-Lu Cozy Wonders Coloring Book",
    nameEs: "Libro para Colorear Fifi-Lu Cozy Wonders",
    price: 1299,
    image: "/assets/fifi-book-1.jpeg",
  },
  "page-protector": {
    nameEn: "Page Protector & Decorative Paper Clip",
    nameEs: "Protector de Página y Clip Decorativo",
    price: 800,
    image: "/assets/fifi-clip.jpeg",
  },
};
