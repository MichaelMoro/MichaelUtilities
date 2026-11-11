/**
 * Kraków — Hallmark Dispatch
 * Tema, filtro giorno, ricerca live, convertitore PLN↔EUR (tasso fisso 4.41).
 * Vanilla JS. Nessuna dipendenza.
 */
(function () {
  'use strict';

  // ---------- DOM ----------
  const themeToggle = document.getElementById('themeToggle');
  const dayNav = document.getElementById('dayNav');
  const dayChips = dayNav ? dayNav.querySelectorAll('.daynav__chip') : [];
  const dayCards = document.querySelectorAll('.day');
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const searchResults = document.getElementById('searchResults');

  // converter
  const plnInput = document.getElementById('plnInput');
  const eurInput = document.getElementById('eurInput');
  const RATE = 4.41; // PLN per 1 EUR (fisso)
  let lastEdited = 'pln';

  const STORAGE_THEME = 'cracovia.theme';
  let currentDay = 'all';
  let currentQuery = '';

  // ---------- INIT ----------
  function init() {
    loadThemePreference();
    setupTheme();
    if (dayChips.length) setupDayNav();
    if (searchInput) setupSearch();
    if (plnInput) setupConverter();
    checkUrlHash();
  }

  // ---------- TEMA ----------
  function loadThemePreference() {
    const saved = localStorage.getItem(STORAGE_THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    if (isDark) document.body.classList.add('dark');
  }
  function setupTheme() {
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');
      localStorage.setItem(STORAGE_THEME, isDark ? 'dark' : 'light');
    });
  }

  // ---------- FILTRO GIORNO ----------
  function setupDayNav() {
    dayChips.forEach((chip) => chip.addEventListener('click', () => selectDay(chip)));
  }
  function selectDay(chip) {
    dayChips.forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    currentDay = chip.dataset.day;
    applyFilters();
    if (currentDay !== 'all') {
      const target = document.getElementById('itinerario');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ---------- RICERCA ----------
  function setupSearch() {
    searchInput.addEventListener('input', handleSearch);
    searchClear.addEventListener('click', clearSearch);
    window.__searchIndex = Array.from(document.querySelectorAll('.day, .food, .airport__card, .ticket')).map((el) => ({
      el,
      text: el.textContent.toLowerCase(),
      day: el.dataset.day || (el.closest('.day') ? el.closest('.day').dataset.day : 'all'),
    }));
  }
  function handleSearch() {
    currentQuery = searchInput.value.trim().toLowerCase();
    toggleClear();
    applyFilters();
    updateSearchCount();
  }
  function clearSearch() {
    searchInput.value = '';
    currentQuery = '';
    toggleClear();
    applyFilters();
    updateSearchCount();
    searchInput.focus();
  }
  function toggleClear() {
    searchClear.style.display = searchInput.value ? 'inline' : 'none';
  }
  function updateSearchCount() {
    if (!currentQuery) { searchResults.textContent = ''; return; }
    const matches = window.__searchIndex.filter((it) =>
      it.text.includes(currentQuery) && (currentDay === 'all' || it.day === currentDay || it.day === 'all')
    ).length;
    searchResults.textContent =
      matches === 0 ? `Nessun risultato per "${searchInput.value}"` : `${matches} risultat${matches === 1 ? 'o' : 'i'} per "${searchInput.value}"`;
  }

  // ---------- FILTRI COMBINATI ----------
  function applyFilters() {
    dayCards.forEach((card) => {
      const day = card.dataset.day;
      const text = card.textContent.toLowerCase();
      const dayMatch = currentDay === 'all' || day === currentDay;
      const queryMatch = !currentQuery || text.includes(currentQuery);
      card.classList.toggle('is-hidden', !(dayMatch && queryMatch));
    });
    if (currentQuery) highlightMatches(currentQuery);
    else clearHighlights();
  }

  // ---------- EVIDENZIAZIONE ----------
  function highlightMatches(query) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest('script, style, .search__results, .day.is-hidden')) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.toLowerCase().includes(query) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach((node) => {
      const text = node.nodeValue;
      const idx = text.toLowerCase().indexOf(query);
      if (idx === -1) return;
      const before = document.createTextNode(text.slice(0, idx));
      const mark = document.createElement('mark');
      mark.textContent = text.slice(idx, idx + query.length);
      mark.className = 'search-mark';
      const after = document.createTextNode(text.slice(idx + query.length));
      const frag = document.createDocumentFragment();
      frag.appendChild(before); frag.appendChild(mark); frag.appendChild(after);
      node.parentNode.replaceChild(frag, node);
    });
  }
  function clearHighlights() {
    document.querySelectorAll('mark.search-mark').forEach((m) => {
      const text = document.createTextNode(m.textContent);
      m.parentNode.replaceChild(text, m);
    });
  }

  // ---------- HASH ----------
  function checkUrlHash() {
    const hash = window.location.hash;
    if (!hash) return;
    const target = document.querySelector(hash);
    if (target && target.classList.contains('day')) {
      const day = target.dataset.day;
      const chip = Array.from(dayChips).find((c) => c.dataset.day === day);
      if (chip) selectDay(chip);
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
  }

  // ---------- CONVERTER PLN <-> EUR (fisso 4.41) ----------
  function parseLocal(str) {
    if (str == null) return NaN;
    const s = String(str).trim().replace(/\s/g, '').replace(',', '.');
    if (s === '') return NaN;
    return parseFloat(s);
  }
  function setupConverter() {
    plnInput.addEventListener('input', () => { lastEdited = 'pln'; updateEurFromPln(); });
    eurInput.addEventListener('input', () => { lastEdited = 'eur'; updatePlnFromEur(); });
  }
  function updateEurFromPln() {
    const v = parseLocal(plnInput.value);
    if (!isFinite(v) || v === 0) { eurInput.value = ''; return; }
    eurInput.value = formatNum(v / RATE);
  }
  function updatePlnFromEur() {
    const v = parseLocal(eurInput.value);
    if (!isFinite(v) || v === 0) { plnInput.value = ''; return; }
    plnInput.value = formatNum(v * RATE);
  }
  function formatNum(n) {
    if (!isFinite(n)) return '';
    return n.toFixed(2).replace('.', ',').replace(/,00$/, '');
  }

  // ---------- GO ----------
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
