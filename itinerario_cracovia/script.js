/**
 * Cracovia Itinerario Natale — interazioni
 * Filtri giorno, ricerca live, dark mode persistente, checklist salvata.
 * Vanilla JS, niente dipendenze.
 */
(function () {
  'use strict';

  // ---------- riferimenti DOM ----------
  const themeToggle = document.getElementById('themeToggle');
  const dayNav = document.getElementById('dayNav');
  const dayChips = dayNav ? dayNav.querySelectorAll('.day-chip') : [];
  const dayCards = document.querySelectorAll('.day-card');
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const searchResults = document.getElementById('searchResults');
  const checklist = document.getElementById('checklistList');
  const checklistCounter = document.getElementById('checklistCounter');
  const checklistReset = document.getElementById('checklistReset');

  // converter
  const plnInput = document.getElementById('plnInput');
  const eurInput = document.getElementById('eurInput');
  const rateInput = document.getElementById('rateInput');
  const swapBtn = document.getElementById('swapBtn');
  const presetBtns = document.querySelectorAll('.converter__preset');
  const chips = document.querySelectorAll('.converter__chip');
  let rate = 4.25; // PLN per 1 EUR
  let lastEdited = 'pln'; // traccia chi ha guidato l'ultimo calcolo

  const STORAGE_THEME = 'cracovia.theme';
  const STORAGE_CHECK = 'cracovia.checklist';
  const STORAGE_RATE = 'cracovia.rate';
  let currentDay = 'all';
  let currentQuery = '';

  // ---------- INIT ----------
  function init() {
    loadThemePreference();
    setupTheme();
    if (dayChips.length) setupDayNav();
    if (searchInput) setupSearch();
    if (checklist) setupChecklist();
    if (plnInput) setupConverter();
    checkUrlHash();
  }

  // ---------- TEMA ----------
  function loadThemePreference() {
    const saved = localStorage.getItem(STORAGE_THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    if (isDark) document.body.classList.add('dark-mode');
  }

  function setupTheme() {
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem(STORAGE_THEME, isDark ? 'dark' : 'light');
    });
  }

  // ---------- FILTRO GIORNO ----------
  function setupDayNav() {
    dayChips.forEach((chip) => {
      chip.addEventListener('click', () => selectDay(chip));
    });
  }

  function selectDay(chip) {
    dayChips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    currentDay = chip.dataset.day;
    applyFilters();
    // scroll dolce verso la sezione itinerario
    const target = document.getElementById('itinerario');
    if (target && currentDay !== 'all') {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ---------- RICERCA ----------
  function setupSearch() {
    searchInput.addEventListener('input', handleSearch);
    searchClear.addEventListener('click', clearSearch);

    // espone i testi indicizzati per la ricerca
    window.__searchIndex = Array.from(
      document.querySelectorAll('.day-card, .food-card, .airport-card, .ticket-box')
    ).map((el) => ({
      el,
      text: el.textContent.toLowerCase(),
      day: el.dataset.day || (el.closest('.day-card') ? el.closest('.day-card').dataset.day : 'all'),
    }));
  }

  function handleSearch() {
    currentQuery = searchInput.value.trim().toLowerCase();
    toggleClearButton();
    applyFilters();
    updateSearchCount();
  }

  function clearSearch() {
    searchInput.value = '';
    currentQuery = '';
    toggleClearButton();
    applyFilters();
    updateSearchCount();
    searchInput.focus();
  }

  function toggleClearButton() {
    searchClear.style.display = searchInput.value ? 'flex' : 'none';
  }

  function updateSearchCount() {
    if (!currentQuery) {
      searchResults.textContent = '';
      return;
    }
    const visible = Array.from(dayCards).filter((c) => !c.classList.contains('is-hidden')).length;
    const total = window.__searchIndex.length;
    const matches = window.__searchIndex.filter((item) =>
      item.text.includes(currentQuery) &&
      (currentDay === 'all' || item.day === currentDay || item.day === 'all')
    ).length;
    searchResults.textContent =
      matches === 0
        ? `Nessun risultato per "${searchInput.value}"`
        : `${matches} risultat${matches === 1 ? 'o' : 'i'} per "${searchInput.value}"`;
  }

  // ---------- APPLICA FILTRI COMBINATI ----------
  function applyFilters() {
    dayCards.forEach((card) => {
      const day = card.dataset.day;
      const text = card.textContent.toLowerCase();
      const dayMatch = currentDay === 'all' || day === currentDay;
      const queryMatch = !currentQuery || text.includes(currentQuery);
      card.classList.toggle('is-hidden', !(dayMatch && queryMatch));
    });

    // Evidenzia i match testuali nella ricerca
    if (currentQuery) highlightMatches(currentQuery);
    else clearHighlights();
  }

  // ---------- EVIDENZIAZIONE MATCH ----------
  function highlightMatches(query) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (
          !parent ||
          parent.closest('script, style, .search-results, .day-card.is-hidden')
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.toLowerCase().includes(query)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
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
      frag.appendChild(before);
      frag.appendChild(mark);
      frag.appendChild(after);
      node.parentNode.replaceChild(frag, node);
    });
  }

  function clearHighlights() {
    document.querySelectorAll('mark.search-mark').forEach((m) => {
      const text = document.createTextNode(m.textContent);
      m.parentNode.replaceChild(text, m);
    });
  }

  // ---------- HASH (link diretti tipo #day-29) ----------
  function checkUrlHash() {
    const hash = window.location.hash;
    if (!hash) return;
    const target = document.querySelector(hash);
    if (target && target.classList.contains('day-card')) {
      const day = target.dataset.day;
      const chip = Array.from(dayChips).find((c) => c.dataset.day === day);
      if (chip) selectDay(chip);
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
  }

  // ---------- CHECKLIST ----------
  function setupChecklist() {
    const saved = loadChecklistState();
    checklist.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = !!saved[cb.dataset.check];
      cb.addEventListener('change', () => {
        saveChecklistState();
        updateChecklistCounter();
      });
    });
    updateChecklistCounter();
    checklistReset.addEventListener('click', resetChecklist);
  }

  function loadChecklistState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_CHECK) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveChecklistState() {
    const state = {};
    checklist.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      state[cb.dataset.check] = cb.checked;
    });
    localStorage.setItem(STORAGE_CHECK, JSON.stringify(state));
  }

  function updateChecklistCounter() {
    const total = checklist.querySelectorAll('input[type="checkbox"]').length;
    const done = checklist.querySelectorAll('input[type="checkbox"]:checked').length;
    checklistCounter.textContent = `${done} / ${total}`;
    if (total && done === total) {
      checklistCounter.style.background = 'var(--accent)';
      checklistCounter.style.color = '#fff';
      checklistCounter.style.borderColor = 'var(--accent)';
    } else {
      checklistCounter.style.background = '';
      checklistCounter.style.color = '';
      checklistCounter.style.borderColor = '';
    }
  }

  function resetChecklist() {
    checklist.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = false;
    });
    saveChecklistState();
    updateChecklistCounter();
  }

  // ---------- CONVERTER PLN <-> EUR ----------
  function setupConverter() {
    // tasso salvato
    const savedRate = parseFloat(localStorage.getItem(STORAGE_RATE));
    if (!isNaN(savedRate) && savedRate > 0) {
      rate = savedRate;
      rateInput.value = rate;
      markActivePreset();
    }

    plnInput.addEventListener('input', () => {
      lastEdited = 'pln';
      convertFromPln();
    });
    eurInput.addEventListener('input', () => {
      lastEdited = 'eur';
      convertFromEur();
    });

    rateInput.addEventListener('input', () => {
      const v = parseFloat(rateInput.value);
      if (!isNaN(v) && v > 0) {
        rate = v;
        localStorage.setItem(STORAGE_RATE, String(rate));
        markActivePreset();
        // ricalcola usando l'ultimo valore guida
        if (lastEdited === 'pln') convertFromPln();
        else convertFromEur();
      }
    });

    presetBtns.forEach((b) => {
      b.addEventListener('click', () => {
        rate = parseFloat(b.dataset.preset);
        rateInput.value = rate;
        localStorage.setItem(STORAGE_RATE, String(rate));
        markActivePreset();
        if (lastEdited === 'pln') convertFromPln();
        else convertFromEur();
      });
    });

    chips.forEach((c) => {
      c.addEventListener('click', () => {
        const v = parseFloat(c.dataset.pln);
        plnInput.value = v;
        lastEdited = 'pln';
        convertFromPln();
        plnInput.focus();
      });
    });

    swapBtn.addEventListener('click', () => {
      // inverte visualmente i valori (PLN <-> EUR) e ricalcola
      const pv = plnInput.value;
      const ev = eurInput.value;
      plnInput.value = ev ? formatNum(parseFloat(ev) * rate) : '';
      eurInput.value = pv ? formatNum(parseFloat(pv) / rate) : '';
      lastEdited = 'pln';
    });
  }

  function convertFromPln() {
    const v = parseFloat(plnInput.value);
    if (isNaN(v)) {
      eurInput.value = '';
      return;
    }
    eurInput.value = formatNum(v / rate);
  }

  function convertFromEur() {
    const v = parseFloat(eurInput.value);
    if (isNaN(v)) {
      plnInput.value = '';
      return;
    }
    plnInput.value = formatNum(v * rate);
  }

  function formatNum(n) {
    if (!isFinite(n)) return '';
    // massimo 2 decimali, virgola come separatore all'itaaaaliano
    return n
      .toFixed(2)
      .replace('.', ',')
      .replace(/,00$/, '');
  }

  function markActivePreset() {
    presetBtns.forEach((b) => {
      b.classList.toggle('is-active', parseFloat(b.dataset.preset) === rate);
    });
  }

  // ---------- GO ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
