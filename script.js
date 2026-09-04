// ============================================
// Cozy Crafting — script.js
// Handles the English / Español toggle.
// Any element with data-en / data-es attributes
// will have its text swapped automatically.
// ============================================

(function () {
  const STORAGE_KEY = "cozycrafting-lang";

  function applyLanguage(lang) {
    document.documentElement.setAttribute("lang", lang);

    document.querySelectorAll("[data-en]").forEach((el) => {
      const text = lang === "es" ? el.getAttribute("data-es") : el.getAttribute("data-en");
      if (text !== null) {
        el.textContent = text;
      }
    });

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      const isActive = btn.getAttribute("data-lang-btn") === lang;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function setLanguage(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyLanguage(lang);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const savedLang = localStorage.getItem(STORAGE_KEY) || "en";
    applyLanguage(savedLang);

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        setLanguage(btn.getAttribute("data-lang-btn"));
      });
    });
  });
})();

// ============================================
// Shared modal / lightbox
// - Photos with [data-lightbox] open an enlarged image (index.html)
// - Product names with [data-expand-card] open an enlarged copy
//   of their parent .product-listing card (shop.html)
// ============================================
(function () {
  function getModal() {
    let overlay = document.getElementById("site-modal");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "site-modal";
    overlay.className = "modal-overlay";
    overlay.setAttribute("hidden", "");
    overlay.innerHTML =
      '<div class="modal-window" role="dialog" aria-modal="true">' +
      '<button type="button" class="modal-close" aria-label="Close">&times;</button>' +
      '<div class="modal-body"></div>' +
      "</div>";
    document.body.appendChild(overlay);
    return overlay;
  }

  function openModal(contentEl) {
    const overlay = getModal();
    const body = overlay.querySelector(".modal-body");
    body.innerHTML = "";
    body.appendChild(contentEl);
    overlay.removeAttribute("hidden");
    document.body.classList.add("modal-open");
    overlay.querySelector(".modal-close").focus();
  }

  function closeModal() {
    const overlay = document.getElementById("site-modal");
    if (!overlay || overlay.hasAttribute("hidden")) return;
    overlay.setAttribute("hidden", "");
    document.body.classList.remove("modal-open");
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest(".modal-close")) {
      closeModal();
      return;
    }

    if (event.target.classList && event.target.classList.contains("modal-overlay")) {
      closeModal();
      return;
    }

    const photo = event.target.closest("[data-lightbox]");
    if (photo) {
      const img = document.createElement("img");
      img.src = photo.getAttribute("src");
      img.alt = photo.getAttribute("alt") || "";
      img.className = "modal-photo";
      openModal(img);
      return;
    }

    const trigger = event.target.closest("[data-expand-card]");
    if (trigger) {
      const card = trigger.closest(".product-listing");
      if (card) {
        const clone = card.cloneNode(true);
        clone.removeAttribute("id");
        openModal(clone);
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      const el = event.target.closest("[data-lightbox], [data-expand-card]");
      if (el) {
        event.preventDefault();
        el.click();
      }
    }
  });
})();
