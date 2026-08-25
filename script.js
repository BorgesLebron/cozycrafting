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
