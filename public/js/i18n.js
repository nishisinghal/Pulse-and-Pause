// ============================================
// SWASTHYA YOUTH — Internationalization Engine
// ============================================
window.I18n = (() => {
  let translations = {};
  let currentLang = localStorage.getItem('swasthya_lang') || 'en';

  async function init() {
    await loadTranslations(currentLang);
    updateDOM();
  }

  async function loadTranslations(lang) {
    try {
      const res = await fetch(`/i18n/${lang}.json`);
      translations = await res.json();
    } catch (e) {
      console.error('Failed to load translations:', e);
      if (lang !== 'en') {
        const res = await fetch('/i18n/en.json');
        translations = await res.json();
      }
    }
  }

  function t(key) {
    const keys = key.split('.');
    let val = translations;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        return key; // fallback to key
      }
    }
    return val;
  }

  async function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('swasthya_lang', lang);
    document.body.setAttribute('data-lang', lang);
    await loadTranslations(lang);
    updateDOM();

    // Update lang toggle button
    const label = document.getElementById('lang-label');
    if (label) label.textContent = lang === 'en' ? 'हिं' : 'EN';
  }

  function getLang() {
    return currentLang;
  }

  function updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val && val !== key) {
        el.textContent = val;
      }
    });
  }

  return { init, t, setLang, getLang, updateDOM };
})();
