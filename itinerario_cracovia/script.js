/**
 * Kraków — Hallmark Dispatch
 * Tema, filtro giorno, ricerca live, convertitore PLN↔EUR (tasso fisso 4.41).
 * SPA: 4 viste gestite da tabbar in basso.
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

  // viste / tabbar
  const tabbar = document.getElementById('tabbar');
  const tabBtns = tabbar ? tabbar.querySelectorAll('.tabbar__btn') : [];
  const views = Array.from(document.querySelectorAll('.view'));
  const VIEW_FROM_ID = { itinerario: 'itinerario', cibi: 'mangiare', aeroporto: 'trasferimenti', convertitore: 'valuta' };
  const ID_FROM_VIEW = { itinerario: 'itinerario', mangiare: 'cibi', trasferimenti: 'aeroporto', valuta: 'convertitore' };

  // converter
  const plnInput = document.getElementById('plnInput');
  const eurInput = document.getElementById('eurInput');
  const RATE = 4.41; // PLN per 1 EUR (fisso)
  let lastEdited = 'pln';

  const STORAGE_THEME = 'cracovia.theme';
  const STORAGE_VIEW = 'cracovia.view';
  let currentDay = 'all';
  let currentQuery = '';
  let currentView = 'itinerario';

  // ---------- INIT ----------
  function init() {
    loadThemePreference();
    setupTheme();
    if (tabBtns.length) setupTabbar();
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

  // ---------- VISTE / TABBAR ----------
  function setupTabbar() {
    tabBtns.forEach((btn) => btn.addEventListener('click', () => switchView(btn.dataset.target, true)));
  }
  function switchView(view, scrollUp) {
    if (!ID_FROM_VIEW[view]) view = 'itinerario';
    currentView = view;
    // marca tab attiva
    tabBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.target === view));
    // mostra solo la vista corrente
    views.forEach((v) => v.classList.toggle('is-current', v.dataset.view === view));
    // espone la vista corrente sul body (per mostrare/nascondere la search via CSS)
    document.body.dataset.view = view;
    // pulisci highlight se stiamo cambiando vista senza query
    if (!currentQuery) clearHighlights();
    // se lasciamo l'itinerario, pulisce la query così la ricerca non resta "sospesa"
    if (view !== 'itinerario' && currentQuery) {
      // non azzeriamo la query (potrebbe servire tornando indietro), ma chiudiamo la UI
    }
    localStorage.setItem(STORAGE_VIEW, view);
    if (scrollUp) window.scrollTo({ top: 0, behavior: 'smooth' });
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
  }

  // ---------- RICERCA ----------
  function setupSearch() {
    searchInput.addEventListener('input', handleSearch);
    searchClear.addEventListener('click', clearSearch);
    window.__searchIndex = Array.from(document.querySelectorAll('.day, .food, .airport__card, .ticket')).map((el) => ({
      el,
      text: el.textContent.toLowerCase(),
      day: el.dataset.day || (el.closest('.day') ? el.closest('.day').dataset.day : 'all'),
      view: el.closest('.view') ? el.closest('.view').dataset.view : 'itinerario',
    }));
  }
  function handleSearch() {
    currentQuery = searchInput.value.trim().toLowerCase();
    toggleClear();
    if (currentQuery) {
      // Ricerca globale: trova prima vista con match e portaci l'utente
      const firstMatchView = window.__searchIndex.find((it) =>
        it.text.includes(currentQuery) && (currentDay === 'all' || it.day === currentDay || it.day === 'all')
      );
      if (firstMatchView && firstMatchView.view !== currentView) {
        switchView(firstMatchView.view, false);
      }
      // Se la query matcha solo in altre viste oltre la corrente, va bene:
      // mostriamo risultati nella vista corrente (se ne ha) e l'utente può navigare.
      applyFilters();
      highlightAcrossViews(currentQuery);
    } else {
      clearHighlights();
      applyFilters();
    }
    updateSearchCount();
  }
  function clearSearch() {
    searchInput.value = '';
    currentQuery = '';
    toggleClear();
    clearHighlights();
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
  // Applica filtro giorno + query alla vista corrente (day cards) e a
  // foods/airport/ticket: con query attiva, nasconde quelli che non matchano.
  function applyFilters() {
    dayCards.forEach((card) => {
      const day = card.dataset.day;
      const text = card.textContent.toLowerCase();
      const dayMatch = currentDay === 'all' || day === currentDay;
      const queryMatch = !currentQuery || text.includes(currentQuery);
      card.classList.toggle('is-hidden', !(dayMatch && queryMatch));
    });
    // foods / airport / ticket: se c'è query, nascondi i blocchi che non matchano
    document.querySelectorAll('.food, .airport__card, .ticket').forEach((el) => {
      const text = el.textContent.toLowerCase();
      el.classList.toggle('is-hidden', currentQuery ? !text.includes(currentQuery) : false);
    });
  }

  // ---------- EVIDENZIAZIONE (su tutte le viste, anche nascoste) ----------
  function highlightAcrossViews(query) {
    clearHighlights();
    // Evidenzia in tutte le viste (anche non correnti) così, se l'utente
    // cambia tab, trova i match già pronti.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('script, style, .search__results, .day.is-hidden, .food.is-hidden, .airport__card.is-hidden, .ticket.is-hidden, .tabbar')) {
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
    // hash speciale: #day-29 / #day-30 / #day-1
    const dayMatch = hash && hash.match(/^#day-(\d+)$/);
    if (dayMatch) {
      const day = dayMatch[1];
      const chip = Array.from(dayChips).find((c) => c.dataset.day === day);
      if (chip) selectDay(chip);
      switchView('itinerario', false);
      setTimeout(() => {
        const target = document.getElementById('day-' + day);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return;
    }
    // hash vista: #mangiare / #trasferimenti / #valuta / #itinerario
    if (hash) {
      const v = hash.slice(1);
      if (ID_FROM_VIEW[v]) {
        switchView(v, false);
        return;
      }
      // target diretto via id (es. #convertitore)
      const target = document.querySelector(hash);
      if (target && target.classList.contains('view')) {
        switchView(target.dataset.view, false);
      }
    }
    // default o vista salvata
    if (!hash) {
      const saved = localStorage.getItem(STORAGE_VIEW);
      switchView(saved && ID_FROM_VIEW[saved] ? saved : 'itinerario', false);
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
